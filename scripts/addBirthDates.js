// addBirthDates.js
// Fills in `birthDate` (YYYY-MM-DD) for every player in src/data/teams.json
// using Wikidata (free, no API key). Re-runnable: players that already have a
// birthDate are left alone unless you pass --force.
//
// Run from the repo root with: node scripts/addBirthDates.js [--force] [--dry-run]
//
// Name matching is fuzzy on purpose (accents, periods, "Jr."/"II" suffixes are
// ignored), so anything that can't be matched to exactly one player is listed
// at the end instead of guessed. Fix those by adding them to
// scripts/birthDateOverrides.json, e.g. { "<player id>": "YYYY-MM-DD" }, and re-run.

import fs from "fs";
import { fetchByName, lookup } from "./lib/wikidata.js";

const TEAMS_PATH = new URL("../src/data/teams.json", import.meta.url);
const OVERRIDES_PATH = new URL("./birthDateOverrides.json", import.meta.url);

const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");

// Every basketball player (Q3665646) born since 1980 who has either a
// Basketball-Reference ID (P2685) or an NBA.com ID (P3647). That restricts
// candidates to people who've actually been in the NBA, which is what keeps
// common names like "Jalen Smith" from matching a college or overseas player.
const QUERY = `
SELECT ?person ?name ?alias ?dob WHERE {
  ?person wdt:P106 wd:Q3665646; wdt:P569 ?dob.
  { ?person wdt:P2685 [] } UNION { ?person wdt:P3647 [] }
  FILTER(?dob >= "1980-01-01"^^xsd:dateTime)
  ?person rdfs:label ?name. FILTER(LANG(?name) = "en")
  OPTIONAL { ?person skos:altLabel ?alias. FILTER(LANG(?alias) = "en") }
}`;

async function main() {
  const raw = fs.readFileSync(TEAMS_PATH, "utf-8");
  const data = JSON.parse(raw);
  const overrides = fs.existsSync(OVERRIDES_PATH)
    ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf-8"))
    : {};

  const todo = data.players.filter((p) => force || !p.birthDate);
  const byName = todo.some((p) => !overrides[p.id])
    ? await fetchByName(QUERY, (row) => row.dob.value.slice(0, 10))
    : new Map();

  const missing = [];
  const ambiguous = [];
  let filled = 0;

  for (const player of todo) {
    if (overrides[player.id]) {
      player.birthDate = overrides[player.id];
      filled++;
      continue;
    }
    const dates = lookup(byName, player.name);
    if (dates.length === 1) {
      player.birthDate = dates[0];
      filled++;
    } else if (dates.length === 0) {
      missing.push(player);
    } else {
      ambiguous.push({ player, dates });
    }
  }

  // Edit the file text in place instead of re-serializing it: JSON.stringify
  // would rewrite numbers like 10.0 as 10 and turn a small change into a
  // diff across the whole file. birthDate goes on the line after position.
  let text = raw;
  for (const player of todo) {
    if (!player.birthDate) continue;
    const block = new RegExp(
      `("id": "${player.id}",[\\s\\S]*?\\n( *)"position": "[^"]*",\\n)(?: *"birthDate": "[^"]*",\\n)?`,
    );
    text = text.replace(block, `$1$2"birthDate": "${player.birthDate}",\n`);
  }

  if (!dryRun) fs.writeFileSync(TEAMS_PATH, text);

  console.log(`${dryRun ? "[dry run] " : ""}Filled ${filled} of ${todo.length} players.`);
  if (missing.length) {
    console.log(`\nNo Wikidata match (${missing.length}) -- add to birthDateOverrides.json:`);
    for (const p of missing) console.log(`  ${p.id}  ${p.name}`);
  }
  if (ambiguous.length) {
    console.log(`\nMultiple matches (${ambiguous.length}) -- pick one in birthDateOverrides.json:`);
    for (const { player, dates } of ambiguous)
      console.log(`  ${player.id}  ${player.name}: ${dates.join(", ")}`);
  }
}

main().catch((err) => {
  console.error("❌ addBirthDates failed:", err);
  process.exit(1);
});
