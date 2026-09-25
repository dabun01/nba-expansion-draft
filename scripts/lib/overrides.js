// Loads a hand-maintained overrides file keyed by player id. Each entry can be
// a bare value or an object carrying the player's name for readability:
//
//   { "bos01": { "name": "Jayson Tatum", "nbaId": "1628369" } }
//   { "bos01": "1628369" }
//
// When a name is given it must match the player with that id in teams.json,
// which catches a value pasted under the wrong key.

import fs from "fs";
import { normalizeName } from "./wikidata.js";

/** Returns Map(playerId -> value). Throws listing every bad entry. */
export function loadOverrides(url, field, players) {
  if (!fs.existsSync(url)) return new Map();
  const file = JSON.parse(fs.readFileSync(url, "utf-8"));
  const byId = new Map(players.map((p) => [p.id, p]));
  const fileName = url.pathname.split("/").pop();

  const overrides = new Map();
  const errors = [];
  for (const [id, entry] of Object.entries(file)) {
    const isObject = entry !== null && typeof entry === "object";
    const value = isObject ? entry[field] : entry;
    const player = byId.get(id);
    if (!player) {
      errors.push(`${id}: no player with this id in teams.json`);
    } else if (isObject && entry.name && normalizeName(entry.name) !== normalizeName(player.name)) {
      errors.push(`${id}: says "${entry.name}" but this id is ${player.name}`);
    } else if (value === undefined || value === null || String(value).trim() === "") {
      errors.push(`${id} (${player.name}): "${field}" is empty`);
    } else {
      overrides.set(id, String(value).trim());
    }
  }

  if (errors.length) {
    throw new Error(`Fix these entries in ${fileName}:\n  ${errors.join("\n  ")}`);
  }
  return overrides;
}

/** Paste-ready overrides JSON for players that still need a value. */
export function overridesTemplate(players, field) {
  const entries = Object.fromEntries(
    players.map((p) => [p.id, { name: p.name, [field]: "" }]),
  );
  return JSON.stringify(entries, null, 2);
}
