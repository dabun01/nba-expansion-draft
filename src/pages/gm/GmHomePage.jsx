import { useState } from "react";
import { useNavigate } from "react-router";
import { useDraftStore } from "../../store/useDraftStore";
import { useGmStore } from "../../store/useGmStore";
import TeamLogo from "../../components/TeamLogo";

const CONFERENCE_FILTERS = [
  { id: "East", label: "Eastern" },
  { id: "West", label: "Western" },
  { id: "All", label: "All" },
];

function CheckIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        d="M3.5 8.5l3 3 6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HowItWorks({ onClose }) {
  const steps = [
    { title: "Pick your teams.", body: "Tap a team \u2014 it turns green when selected." },
    { title: "Protect 8 players.", body: "Swipe left and right between your teams." },
    { title: "Compare & share.", body: "See how other GMs protected, then share your lists." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close how it works"
        className="absolute inset-0 cursor-default bg-tunnel-950/80"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
        className="relative w-full max-w-md rounded-t-2xl border border-tunnel-700 bg-tunnel-900 p-6 sm:rounded-2xl"
      >
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-clock-500">
          How it works
        </p>
        <h2
          id="how-it-works-title"
          className="mb-2 font-display text-3xl font-bold uppercase leading-tight tracking-wide"
        >
          Seattle &amp; Las Vegas are coming
        </h2>
        <p className="mb-5 text-ink-300">
          You&rsquo;re the GM. Each franchise protects 8 players &mdash; everyone
          else is exposed to the expansion draft.
        </p>
        <ol className="mb-6 space-y-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clock-500/15 font-mono text-sm font-semibold text-clock-500">
                {i + 1}
              </span>
              <p className="text-ink-300">
                <strong className="font-semibold text-ink-100">{step.title}</strong>{" "}
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full bg-clock-500 py-3.5 font-display font-bold uppercase tracking-wide text-tunnel-950 transition-colors hover:bg-clock-400"
        >
          Got it &mdash; let&rsquo;s go
        </button>
      </div>
    </div>
  );
}

// Step 1 of the GM flow: choose which franchises to build protection lists for.
export default function GmHomePage() {
  const navigate = useNavigate();
  const teams = useDraftStore((s) => s.teams);
  const selectedTeamIds = useGmStore((s) => s.selectedTeamIds);
  const toggleTeam = useGmStore((s) => s.toggleTeam);
  const selectTeams = useGmStore((s) => s.selectTeams);
  const deselectTeams = useGmStore((s) => s.deselectTeams);
  const [conference, setConference] = useState("All");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const visibleTeams = teams
    .filter((t) => conference === "All" || t.conference === conference)
    .sort((a, b) => a.name.localeCompare(b.name));
  const visibleIds = visibleTeams.map((t) => t.id);
  const allVisibleSelected = visibleIds.every((id) =>
    selectedTeamIds.includes(id),
  );
  const selectedCount = selectedTeamIds.length;

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col border-tunnel-800 bg-tunnel-950 sm:border-x md:max-w-3xl">
      <header className="flex items-center justify-between border-b border-tunnel-800 px-5 py-4">
        <p className="font-display text-xl font-bold uppercase tracking-wide">
          Expansion Draft <span className="text-clock-500">GM</span>
        </p>
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          aria-label="How it works"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-tunnel-700 text-ink-300 transition-colors hover:border-tunnel-500 hover:text-ink-100"
        >
          <span className="font-display text-lg leading-none">?</span>
        </button>
      </header>

      <main className="scrollbar-thin flex-1 overflow-y-auto px-5 pb-6 pt-6">
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-clock-500">
          Step 1 of 3
        </p>
        <h1 className="mb-2 font-display text-4xl font-bold uppercase tracking-wide">
          Pick your teams
        </h1>
        <p className="mb-5 text-ink-500">
          Choose the franchises you want to build protection lists for.
        </p>

        <div className="mb-5 grid grid-cols-3 rounded-xl border border-tunnel-800 bg-tunnel-900 p-1">
          {CONFERENCE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setConference(f.id)}
              aria-pressed={conference === f.id}
              className={`rounded-lg py-2.5 font-display text-sm font-semibold uppercase tracking-wider transition-colors ${
                conference === f.id
                  ? "bg-tunnel-700 text-ink-100"
                  : "text-ink-500 hover:text-ink-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {visibleTeams.map((team) => {
            const selected = selectedTeamIds.includes(team.id);
            return (
              <button
                key={team.id}
                type="button"
                onClick={() => toggleTeam(team.id)}
                aria-pressed={selected}
                className={`relative rounded-xl border-2 p-4 text-left transition-colors ${
                  selected
                    ? "border-protect-500 bg-protect-500/10"
                    : "border-tunnel-800 bg-tunnel-900 hover:border-tunnel-600"
                }`}
              >
                {selected ? (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-protect-500 text-tunnel-950">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                ) : null}
                <TeamLogo team={team} sizeClassName="h-14 w-14" className="mb-3" />
                <p className="font-semibold leading-tight">{team.name}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-500">
                  {team.conference === "East" ? "Eastern" : "Western"} conf
                </p>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="flex items-center gap-3 border-t border-tunnel-800 bg-tunnel-950 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mr-auto">
          <p className="font-mono text-2xl font-semibold text-protect-500">
            {selectedCount} / {teams.length}
          </p>
          <p className="text-sm text-ink-500">teams selected</p>
        </div>
        <button
          type="button"
          onClick={() =>
            allVisibleSelected ? deselectTeams(visibleIds) : selectTeams(visibleIds)
          }
          className="rounded-full border border-tunnel-600 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider transition-colors hover:border-tunnel-500"
        >
          {allVisibleSelected ? "Clear all" : "Select all"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/gm/protect")}
          disabled={selectedCount === 0}
          className="flex items-center gap-1 rounded-full bg-clock-500 px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-tunnel-950 transition-colors hover:bg-clock-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <span aria-hidden="true">›</span>
        </button>
      </footer>

      {isHelpOpen ? <HowItWorks onClose={() => setIsHelpOpen(false)} /> : null}
    </div>
  );
}
