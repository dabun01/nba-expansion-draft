// migrateToNbaIds.js
// One-time migration: replaces team-prefixed player ids ("uta04") with official
// NBA.com person ids ("1631117") everywhere in src/data/teams.json.
//
// Why: the old ids encode the team, which goes stale on every trade, and saved
// fan submissions will reference player ids forever. NBA.com ids never change
// and also key headshots (cdn.nba.com/headshots/nba/latest/1040x760/{id}.png).
//
// Run from the repo root with: node scripts/migrateToNbaIds.js [--dry-run]
//
// All-or-nothing: if any player can't be matched to exactly one NBA.com id,
// nothing is written. Look those players up on nba.com (the id is the number
// in the URL, e.g. nba.com/player/1628369/jayson-tatum), add them to
// scripts/nbaIdOverrides.json keyed by OLD id, e.g. { "bos01": "1628369" },
// and re-run.

import fs from "fs";
import { fetchByName, lookup } from "./lib/wikidata.js";

const TEAMS_PATH = new URL("../src/data/teams.json", import.meta.url);
const OVERRIDES_PATH = new URL("./nbaIdOverrides.json", import.meta.url);
const BIRTHDATE_OVERRIDES_PATH = new URL("./birthDateOverrides.json", import.meta.url);
const MAP_PATH = new URL("./idMigrationMap.json", import.meta.url);

const dryRun = process.argv.includes("--dry-run");

// Everyone with an NBA.com player ID (P3647). Having that id already means
// they've been in the NBA, so no occupation or birth-date filter is needed.
const QUERY = `
SELECT ?person ?name ?alias ?nbaId WHERE {
  ?person wdt:P3647 ?nbaId.
  ?person rdfs:label ?name. FILTER(LANG(?name) = "en")
  OPTIONAL { ?person skos:altLabel ?alias. FILTER(LANG(?alias) = "en") }
}`;

const isNbaId = (id) => /^\d+$/.test(id);

function readJson(url) {
  return fs.existsSync(url) ? JSON.parse(fs.readFileSync(url, "utf-8")) : null;
}

// Swap every quoted old id for its new one. Old ids only ever appear as
// whole JSON strings ("atl01"), so matching the quotes keeps this exact.
// Editing the text instead of re-serializing keeps the rest of the file
// (e.g. numbers written as 10.0) byte-for-byte unchanged.
function rewriteIds(text, idMap) {
  return text.replace(/"([^"\\]+)"/g, (whole, s) =>
    idMap.has(s) ? `"${idMap.get(s)}"` : whole,
  );
}

async function main() {
  const raw = fs.readFileSync(TEAMS_PATH, "utf-8");
  const data = JSON.parse(raw);
  const overrides = readJson(OVERRIDES_PATH) ?? {};

  const todo = data.players.filter((p) => !isNbaId(p.id));
  if (todo.length === 0) {
    console.log("All players already use NBA.com ids. Nothing to do.");
    return;
  }

  const byName = todo.some((p) => !overrides[p.id])
    ? await fetchByName(QUERY, (row) => row.nbaId.value)
    : new Map();

  const idMap = new Map(); // old id -> NBA.com id
  const missing = [];
  const ambiguous = [];
  const invalid = [];

  for (const player of todo) {
    if (overrides[player.id]) {
      const id = String(overrides[player.id]);
      if (isNbaId(id)) idMap.set(player.id, id);
      else invalid.push({ player, id });
      continue;
    }
    const ids = lookup(byName, player.name);
    if (ids.length === 1) idMap.set(player.id, ids[0]);
    else if (ids.length === 0) missing.push(player);
    else ambiguous.push({ player, ids });
  }

  // Two players resolving to the same NBA.com id means a bad match or a
  // typo in the overrides -- merging them would silently lose a player.
  const nameById = new Map(
    data.players.filter((p) => isNbaId(p.id)).map((p) => [p.id, p.name]),
  );
  const duplicates = [];
  for (const player of todo) {
    const id = idMap.get(player.id);
    if (!id) continue;
    if (nameById.has(id)) duplicates.push({ player, id, other: nameById.get(id) });
    else nameById.set(id, player.name);
  }

  console.log(`Matched ${idMap.size} of ${todo.length} players.`);
  if (missing.length) {
    console.log(`\nNo Wikidata match (${missing.length}) -- add to nbaIdOverrides.json:`);
    for (const p of missing) console.log(`  ${p.id}  ${p.name}`);
  }
  if (ambiguous.length) {
    console.log(`\nMultiple matches (${ambiguous.length}) -- pick one in nbaIdOverrides.json:`);
    for (const { player, ids } of ambiguous) {
      console.log(`  ${player.id}  ${player.name}:`);
      for (const id of ids) console.log(`      ${id}  https://www.nba.com/player/${id}`);
    }
  }
  if (invalid.length) {
    console.log(`\nNot a numeric NBA.com id in nbaIdOverrides.json (${invalid.length}):`);
    for (const { player, id } of invalid) console.log(`  ${player.id}  ${player.name}: "${id}"`);
  }
  if (duplicates.length) {
    console.log(`\nSame NBA.com id as another player (${duplicates.length}):`);
    for (const { player, id, other } of duplicates)
      console.log(`  ${player.id}  ${player.name} -> ${id}, already used by ${other}`);
  }

  const problems = missing.length + ambiguous.length + invalid.length + duplicates.length;
  if (problems > 0) {
    console.log("\nNothing written. Fix the players above and re-run.");
    process.exit(1);
  }

  const text = rewriteIds(raw, idMap);

  // Sanity check before writing: every team's playerIds must still point at
  // real players, and no old-style id may be left behind.
  const after = JSON.parse(text);
  const playerIds = new Set(after.players.map((p) => p.id));
  const dangling = after.teams.flatMap((t) => t.playerIds.filter((id) => !playerIds.has(id)));
  const leftover = after.players.filter((p) => !isNbaId(p.id));
  if (dangling.length || leftover.length) {
    throw new Error(
      `Rewrite check failed: dangling ${dangling.join(", ") || "none"}, ` +
        `unmigrated ${leftover.map((p) => p.id).join(", ") || "none"}`,
    );
  }

  if (dryRun) {
    console.log("\n[dry run] All players matched. Re-run without --dry-run to write.");
    return;
  }

  fs.writeFileSync(TEAMS_PATH, text);
  console.log(`\nRewrote ids in src/data/teams.json.`);

  // birthDateOverrides.json is keyed by player id, so move it to the new ids.
  // (nbaIdOverrides.json is keyed by old id on purpose and is done after this.)
  const birthDateOverrides = readJson(BIRTHDATE_OVERRIDES_PATH);
  if (birthDateOverrides) {
    const rekeyed = Object.fromEntries(
      Object.entries(birthDateOverrides).map(([k, v]) => [idMap.get(k) ?? k, v]),
    );
    fs.writeFileSync(BIRTHDATE_OVERRIDES_PATH, JSON.stringify(rekeyed, null, 2) + "\n");
    console.log("Re-keyed scripts/birthDateOverrides.json.");
  }

  // A record of old -> new, for translating anything saved under old ids
  // (e.g. a draft in your browser's localStorage). Safe to delete later.
  fs.writeFileSync(MAP_PATH, JSON.stringify(Object.fromEntries(idMap), null, 2) + "\n");
  console.log(`Wrote scripts/idMigrationMap.json (${idMap.size} entries).`);
}

main().catch((err) => {
  console.error("❌ migrateToNbaIds failed:", err);
  process.exit(1);
});
