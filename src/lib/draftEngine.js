import { pickAiProtectedIds, pickAiBestAvailable } from "./valueScore";

export const PROTECT_COUNT = 8;
export const MAX_EXPANSION_ROSTER_SIZE = 15;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns the array of protected player ids for one existing team, per the
 * chosen simulation mode. `preselectedIds`, if provided, is a hand-curated
 * list (used only by "preselected" mode) -- falls back to AI mode if none
 * is defined for a team yet, so preselected mode never breaks on missing data.
 */
export function generateProtectionList({
  mode,
  rosterPlayers,
  preselectedIds,
}) {
  const capped = (ids) => ids.slice(0, PROTECT_COUNT);

  if (mode === "random") {
    return capped(shuffle(rosterPlayers.map((p) => p.id)));
  }
  if (mode === "preselected" && preselectedIds?.length) {
    return capped(preselectedIds);
  }
  // "auto" mode, and the fallback for "preselected" when no curated list exists
  return capped(pickAiProtectedIds(rosterPlayers, PROTECT_COUNT));
}

export function getUnprotectedPlayers(rosterPlayers, protectedIds) {
  const protectedSet = new Set(protectedIds);
  return rosterPlayers.filter((p) => !protectedSet.has(p.id));
}

/**
 * Builds the turn sequence: just *who* is on the clock each pick, alternating
 * between the two expansion teams. Each expansion team gets at most one turn
 * per existing franchise (enforced at pick time via `draftedFromTeamIds`,
 * not baked into this order), so the ceiling is 2 * existingTeamIds.length,
 * but a team's actual pick count may end lower if the pool runs dry.
 *
 * Returns an array of { pickNumber, expansionTeamId }. Note: no `fromTeamId`
 * here anymore -- which franchise a pick comes from is now the *drafting
 * team's choice*, decided at pick time, not fixed in advance.
 */
export function buildExpansionTurnOrder(existingTeamCount, expansionTeamOrder) {
  const order = [];
  let pickNumber = 1;
  const roundCount = Math.min(existingTeamCount, MAX_EXPANSION_ROSTER_SIZE);
  for (let round = 0; round < roundCount; round++) {
    for (const expansionTeamId of expansionTeamOrder) {
      order.push({ pickNumber, expansionTeamId });
      pickNumber++;
    }
  }
  return order;
}

/**
 * The pool of players a given expansion team may choose from *right now*:
 * unprotected, not yet drafted by either expansion team, and not from a
 * franchise this expansion team has already drafted a player from (the
 * one-per-team rule -- enforced here instead of via a fixed turn order).
 */
export function getAvailablePoolForExpansionTeam({
  teams,
  playersById,
  protectedIdsByTeam,
  draftedPlayerIds,
  draftedFromTeamIds, // Set of team ids this expansion team has already picked from
}) {
  const pool = [];
  for (const team of teams) {
    if (draftedFromTeamIds.has(team.id)) continue;
    const protectedSet = new Set(protectedIdsByTeam[team.id] || []);
    for (const playerId of team.playerIds) {
      if (protectedSet.has(playerId)) continue;
      if (draftedPlayerIds.has(playerId)) continue;
      pool.push(playersById.get(playerId));
    }
  }
  return pool;
}

/**
 * Chooses a pick for a *simulated* expansion team on its turn.
 * `availablePlayers` is the pool from `getAvailablePoolForExpansionTeam`,
 * spanning every eligible franchise, not just one.
 */
export function simulatedExpansionPick({ mode, availablePlayers }) {
  if (availablePlayers.length === 0) return null;
  if (mode === "random") {
    return shuffle(availablePlayers)[0];
  }
  // "auto" and "preselected" (no per-pick curation for the opposing expansion
  // team in the MVP -- preselected falls back to AI-best-available)
  return pickAiBestAvailable(availablePlayers);
}
