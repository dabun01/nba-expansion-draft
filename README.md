# Expansion Draft GM

MVP scaffold: simulate an NBA expansion draft (Seattle + Las Vegas) as GM.

## Run it

```bash
npm install
npm run dev
```

## What's wired up

- **Data**: `src/data/teams.sample.json` — 6 teams x 9 players, proves the
  schema (see `src/data/SCHEMA.md`). Extend to all 30 teams before shipping.
- **Value scoring**: `src/lib/valueScore.js` — production vs. salary blend,
  powers "AI-powered" protection and drafting.
- **Draft engine**: `src/lib/draftEngine.js` — protection-list generation
  (random/preselected/ai) and the alternating 30-team x 2-expansion-team
  pick order.
- **State**: `src/store/useDraftStore.js` (Zustand) — single source of
  truth for setup, protection, and draft phases.
- **Flow**: Setup -> Protection -> Draft -> Recap, each a page in
  `src/pages`, rendered inside `src/components/layout/AppShell.jsx`.

## Not yet built (see original planning discussion)

- Full 30-team roster dataset
- Hand-curated "preselected" protection lists per team (currently falls
  back to the AI ranking when none is defined)
- Trade-away-the-pick future features
- Persistence / backend
