# NBA Expansion Draft Simulator

Run the NBA's next expansion draft yourself. Pick a franchise, Seattle or Las Vegas, and build its first roster from the players left unprotected by the league's 30 existing teams. An AI general manager runs the other expansion team and drafts against you in real time.

**Live demo:** [nba-expansion-draft.vercel.app](https://nba-expansion-draft.vercel.app)

---

## How it plays

The draft runs in four phases.

1. **Setup.** Choose which expansion team you control and how the AI GM on the other side should draft (value-based, random, or preselected). Set a default protection mode for the 30 existing franchises.
2. **Protection.** Each existing team protects 8 players. You can let every team protect automatically, or take over any team and hand-pick its 8 yourself.
3. **Draft.** Seattle and Las Vegas alternate picks from the full pool of unprotected players across the league. You get 90 seconds per pick; if the clock runs out, the best available player by value score is taken for you. Each expansion team can take at most one player from any single franchise, and rosters cap at 15.
4. **Recap.** Compare both finished rosters side by side, including salary commitments against the $165M cap.

## Features

- **Full 2025–26 league data:** all 30 teams, about 395 rotation-level players, with per-game stats and multi-year contracts (salary by year, player/team options, years remaining)
- **Value scoring:** each player gets a production score (z-scored, weighted blend of points, rebounds, assists, and FG%) and a salary-efficiency score (production relative to cap hit), combined into one value score that drives AI protection and AI drafting
- **Flexible protection modes per team:** auto (value-based), random, preselected, or manual
- **Live draft room:** pick timer, draft ticker, pick announcement overlay, cap breakdown, and roster views for both expansion teams
- **Team branding:** logos and color theming for all 30 franchises, inside a dark "draft-night war room" UI

## Tech stack

| Layer      | Tools                                                         |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React 19, Vite, Tailwind CSS v4                                |
| State      | Zustand                                                       |
| API        | Vercel Serverless Functions (`/api`)                          |
| Database   | MongoDB Atlas                                                 |
| Hosting    | Vercel, with automatic deploys on push to `main`              |
| Linting    | oxlint                                                        |

## Project structure

```
nba-expansion-draft/
├── api/                    # Vercel serverless functions
│   ├── teams.js            # GET /api/teams
│   ├── players.js          # GET /api/players (optional ?teamId=ATL)
│   └── config.js           # GET /api/config (league-wide values like the cap)
├── lib/
│   └── mongodb.js          # Cached MongoDB client shared by the API routes
├── scripts/
│   └── importTeams.js      # Loads teams.json into MongoDB
├── src/
│   ├── components/         # AppShell, RosterTable, CapBreakdown, DraftTicker, TeamSidebar, TeamLogo
│   ├── data/
│   │   ├── teams.json      # Source dataset: teams, players, salary cap
│   │   └── SCHEMA.md       # Data shape reference
│   ├── lib/
│   │   ├── valueScore.js   # Player valuation
│   │   ├── draftEngine.js  # Protection lists, turn order, available pool, AI picks
│   │   └── teamColors.js   # Franchise color mapping
│   ├── pages/              # SetupPage, ProtectionPage, DraftPage, RecapPage
│   ├── store/
│   │   └── useDraftStore.js # Single source of truth for all draft phases
│   └── App.jsx             # Loads data from the API and renders the current phase
└── vite.config.js
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- A MongoDB Atlas cluster (the free tier works)
- The Vercel CLI (`npm i -g vercel`), so the `/api` routes run locally

### 1. Install

```bash
git clone https://github.com/dabun01/nba-expansion-draft.git
cd nba-expansion-draft
npm install
```

### 2. Configure the database connection

Create a `.env` file in the project root:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
```

`.env` files are gitignored. For the deployed site, add the same variable under **Project Settings → Environment Variables** in Vercel.

### 3. Seed the database

The import script reads `teams.json` from the current working directory and writes the `teams`, `players`, and `config` collections in the `expansionDraftSim` database. It clears those collections first, so it is safe to re-run after editing the data.

```bash
cd src/data
MONGODB_URI="<your connection string>" node ../../scripts/importTeams.js
```

### 4. Run locally

```bash
vercel dev
```

The app needs `/api/teams`, `/api/players`, and `/api/config` to load. `npm run dev` starts only the Vite frontend, so use `vercel dev` to run the frontend and the serverless functions together.

### Other scripts

| Command           | What it does                         |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Vite dev server (frontend only)      |
| `npm run build`   | Production build into `dist/`        |
| `npm run preview` | Serve the production build locally   |
| `npm run lint`    | Lint with oxlint                     |

## Data

`src/data/teams.json` is the source of truth for rosters and contracts and is imported into MongoDB for the app to read.

```json
{
  "id": "atl01",
  "name": "Jalen Johnson",
  "teamId": "ATL",
  "position": "PF",
  "stats": { "pts": 22.5, "reb": 10.3, "ast": 7.9, "fgPct": 0.489 },
  "contract": {
    "salaryByYear": [30000000, 30000000, 30000000, 30000000],
    "optionType": [null, null, null, null],
    "yearsRemaining": 4
  }
}
```

A few conventions hold across the dataset:

- Stat keys are camelCase, and `fgPct` is stored as a decimal
- `salaryByYear` starts with the current season, and `optionType` runs parallel to it with `null`, `"player"`, or `"team"`
- Two-way contracts are excluded; rookies are included with zeroed stats
- Stats come from Basketball-Reference and contracts from NBA Cap Tracker. Headline contracts are sourced precisely, while some depth-player salaries are estimates

## Roadmap

- [ ] Rookie stats pass using Summer League data
- [ ] Smarter AI GM behavior (positional need, cap awareness)
- [ ] Hand-curated "preselected" protection lists for each team
- [ ] Saved drafts and multi-session support
- [ ] Trading picks and other post-draft moves
- [ ] Multiplayer: two human GMs drafting head to head

## Disclaimer

This is a fan-made project and is not affiliated with or endorsed by the NBA or any of its teams. Team names and logos are trademarks of their respective owners.
