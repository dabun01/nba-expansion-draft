// Shared helpers for the data scripts that look players up on Wikidata
// (free, no API key) and match them to teams.json by name.

const SPARQL_URL = "https://query.wikidata.org/sparql";

// "Nikola Jokic" (with accent) -> "nikolajokic", "P.J. Washington" ->
// "pjwashington". Spaces are dropped so "P. J. Washington" matches too.
//
// Suffixes like "Jr." and "II" are kept on purpose: stripping them made
// "Gary Payton II" match his father, and "LeBron James" match Bronny, who
// Wikidata also lists as "LeBron James Jr.". "Jr." and "Jr" still compare
// equal because periods are removed.
export function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,'\u2019]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, "");
}

/**
 * Runs a SPARQL query that selects ?person, ?name, optional ?alias, and one
 * value column, and indexes the results by normalized name.
 *
 * Returns Map(normalizedName -> Map(personUri -> value)). A name that maps to
 * more than one distinct value is ambiguous and should be resolved by hand.
 */
export async function fetchByName(query, valueOf) {
  const res = await fetch(`${SPARQL_URL}?query=${encodeURIComponent(query)}`, {
    headers: {
      Accept: "application/sparql-results+json",
      // Wikidata asks scripts to identify themselves
      "User-Agent": "nba-expansion-draft/1.0 (data import script)",
    },
  });
  if (!res.ok) throw new Error(`Wikidata returned ${res.status}`);
  const { results } = await res.json();

  const byName = new Map();
  for (const row of results.bindings) {
    const value = valueOf(row);
    for (const label of [row.name?.value, row.alias?.value]) {
      if (!label) continue;
      const key = normalizeName(label);
      if (!byName.has(key)) byName.set(key, new Map());
      byName.get(key).set(row.person.value, value);
    }
  }
  return byName;
}

/** The distinct values Wikidata has for this player's name (0, 1, or many). */
export function lookup(byName, name) {
  const matches = byName.get(normalizeName(name));
  return matches ? [...new Set(matches.values())] : [];
}
