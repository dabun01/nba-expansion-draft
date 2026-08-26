# Data schema

This MVP uses a static bundled JSON dataset (no live NBA API / backend).
`teams.sample.json` ships with 6 teams x 9 players as a working proof of the
shape. To finish the app, extend it to all 30 teams x ~12-15 players each.

## Team

```json
{
  "id": "SEA_OLD" | "LAL" | ...,       // existing-franchise id, 3-letter code
  "name": "Los Angeles Lakers",
  "abbreviation": "LAL",
  "salaryCapTotal": 141000000,          // league cap for the season, same for all teams
  "playerIds": ["lal_01", "lal_02", ...]
}
```

## Player

```json
{
  "id": "lal_01",
  "name": "Player Name",
  "teamId": "LAL",
  "position": "PG" | "SG" | "SF" | "PF" | "C",
  "stats": {
    "pts": 24.1,
    "reb": 5.3,
    "ast": 6.8,
    "fgPct": 0.482
  },
  "contract": {
    "salaryByYear": [38000000, 40000000, 42000000],  // this year first
    "yearsRemaining": 3
  }
}
```

Derived/computed fields (not stored, calculated in `src/lib/valueScore.js`):
- `cap_hit` = `contract.salaryByYear[0]`
- `production_score` = weighted, league-normalized blend of pts/reb/ast/fgPct
- `salary_efficiency` = production_score relative to cap_hit
- `value_score` = combination of the two, used by AI protection/draft mode

## ExpansionTeam (runtime only, lives in the zustand store, not this dataset)

```json
{
  "id": "SEA" | "VGS",
  "name": "Seattle" | "Las Vegas",
  "controlledBy": "user" | "simulated",
  "draftStrategyMode": "random" | "preselected" | "ai",  // only used if simulated
  "roster": ["player_id", ...],
  "capSpaceUsed": 0
}
```

## DraftPick (runtime only)

```json
{
  "pickNumber": 1,
  "expansionTeamId": "SEA",
  "fromTeamId": "LAL",
  "playerId": "lal_07"
}
```
