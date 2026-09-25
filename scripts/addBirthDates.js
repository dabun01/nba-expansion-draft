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
// scripts/birthDateOverrides.json, e.g. { "atl13": "2002-11-28" }, and re-run.

import fs from "fs";

const TEAMS_PATH = new URL("../src/data/teams.json", import.meta.url);
const OVERRIDES_PATH = new URL("./birthDateOverrides.json", import.meta.url);
const SPARQL_URL = "https://query.wikidata.org/sparql";

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

// "Nikola Jokić" -> "nikolajokic", "P.J. Washington" -> "pjwashington",
// "Jabari Smith Jr." -> "jabarismith". Spaces are dropped too so
// "P. J. Washington" and "P.J. Washington" compare equal.
function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'\u2019]/g, "")
    .replace(/-/g, " ")
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, "")
    .replace(/\s+/g, "");
}

async function fetchCandidates() {
  const res = await fetch(`${SPARQL_URL}?query=${encodeURIComponent(QUERY)}`, {
    headers: {
      Accept: "application/sparql-results+json",
      // Wikidata asks scripts to identify themselves
      "User-Agent": "nba-expansion-draft/1.0 (birthDate import script)",
    },
  });
  if (!res.ok) throw new Error(`Wikidata returned ${res.status}`);
  const { results } = await res.json();

  // normalized name -> Map(personUri -> "YYYY-MM-DD")
  const byName = new Map();
  for (const row of results.bindings) {
    const dob = row.dob.value.slice(0, 10);
    for (const label of [row.name?.value, row.alias?.value]) {
      if (!label) continue;
      const key = normalizeName(label);
      if (!byName.has(key)) byName.set(key, new Map());
      byName.get(key).set(row.person.value, dob);
    }
  }
  return byName;
}

async function main() {
  const raw = fs.readFileSync(TEAMS_PATH, "utf-8");
  const data = JSON.parse(raw);
  const overrides = fs.existsSync(OVERRIDES_PATH)
    ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf-8"))
    : {};

  const todo = data.players.filter((p) => force || !p.birthDate);
  const byName = todo.some((p) => !overrides[p.id])
    ? await fetchCandidates()
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
    const matches = byName.get(normalizeName(player.name));
    const dates = matches ? [...new Set(matches.values())] : [];
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
