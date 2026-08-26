import { useState } from "react";
import { useDraftStore } from "../store/useDraftStore";
import RosterTable from "../components/roster/RosterTable";
import CapBreakdown from "../components/roster/CapBreakdown";
import TeamLogo from "../components/TeamLogo";

const MODE_OPTIONS = [
  {
    id: "random",
    label: "Random",
    desc: "No logic, purely random selections.",
  },
  {
    id: "preselected",
    label: "Preselected",
    desc: "Hand-curated, realistic-style lists.",
  },
  {
    id: "auto",
    label: "Auto",
    desc: "Ranks players by production vs. salary.",
  },
];

export default function SetupPage({
  isSettingsOpen = false,
  setIsSettingsOpen,
}) {
  const [activeRosterView, setActiveRosterView] = useState("roster");
  const teams = useDraftStore((s) => s.teams);
  const players = useDraftStore((s) => s.players);
  const capTotal = useDraftStore((s) => s.salaryCapTotal);
  const selectedTeamId = useDraftStore((s) => s.selectedTeamId);
  const userExpansionTeamId = useDraftStore((s) => s.userExpansionTeamId);
  const setUserExpansionTeamId = useDraftStore((s) => s.setUserExpansionTeamId);
  const simulatedExpansionMode = useDraftStore((s) => s.simulatedExpansionMode);
  const setSimulatedExpansionMode = useDraftStore(
    (s) => s.setSimulatedExpansionMode,
  );
  const setDefaultProtectionMode = useDraftStore(
    (s) => s.setDefaultProtectionMode,
  );
  const protectionModeByTeam = useDraftStore((s) => s.protectionModeByTeam);
  const setPhase = useDraftStore((s) => s.setPhase);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const rosterPlayers = selectedTeam.playerIds.map((id) =>
    players.find((p) => p.id === id),
  );

  const defaultMode = protectionModeByTeam[teams[0].id] || "auto";

  return (
    <div className="min-w-0">
      <div className="space-y-6">
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 font-display text-3xl uppercase tracking-wide">
                <TeamLogo team={selectedTeam} sizeClassName="h-20 w-20" />
                {selectedTeam.name}
              </h1>
            </div>
            <p className="text-right text-xs text-ink-500">
              {rosterPlayers.length} players
            </p>
          </div>
          <div className="mb-4 flex w-fit rounded-lg border border-tunnel-700 bg-tunnel-900 p-1">
            {[
              { id: "roster", label: "Roster" },
              { id: "cap", label: "Salary cap space" },
            ].map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveRosterView(view.id)}
                aria-pressed={activeRosterView === view.id}
                className={`rounded px-3 py-2 font-display text-xs uppercase tracking-wide transition-colors ${
                  activeRosterView === view.id
                    ? "bg-tunnel-700 text-ink-100"
                    : "text-ink-500 hover:text-ink-300"
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
          {activeRosterView === "cap" ? (
            <CapBreakdown players={rosterPlayers} capTotal={capTotal} />
          ) : null}
        </section>
        {activeRosterView === "roster" ? (
          <RosterTable players={rosterPlayers} />
        ) : null}
      </div>

      {isSettingsOpen ? (
        <>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Close draft setup settings"
            className="fixed inset-0 z-40 cursor-default bg-tunnel-950/80"
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-tunnel-700 bg-tunnel-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-tunnel-700 px-5 py-4">
              <p className="font-display text-xs uppercase tracking-widest text-ink-500">
                Draft setup
              </p>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close draft setup settings"
                title="Close draft setup settings"
                className="flex h-8 w-8 items-center justify-center rounded border border-tunnel-700 font-mono text-lg text-ink-500 transition-colors hover:border-tunnel-500 hover:text-ink-100"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6 p-5">
              <section className="rounded-lg border border-tunnel-700 bg-tunnel-900 p-5">
                <h2 className="mb-1 font-display text-lg uppercase tracking-wide">
                  Choose your expansion team
                </h2>
                <p className="mb-4 text-sm text-ink-500">
                  You'll build this roster pick by pick during the draft. The
                  other city is simulated.
                </p>
                <div className="flex gap-3">
                  {["SEA", "VGS"].map((id) => {
                    const name = id === "SEA" ? "Seattle" : "Las Vegas";
                    const active = userExpansionTeamId === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setUserExpansionTeamId(id)}
                        className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                          active
                            ? "border-clock-500 bg-clock-500/10"
                            : "border-tunnel-600 hover:border-tunnel-500"
                        }`}
                      >
                        <p className="font-display text-base uppercase">
                          {name}
                        </p>
                        <p className="text-xs text-ink-500">
                          {active ? "You're the GM" : "Click to control"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-lg border border-tunnel-700 bg-tunnel-900 p-5">
                <h2 className="mb-1 font-display text-lg uppercase tracking-wide">
                  Rival city's draft strategy
                </h2>
                <p className="mb-4 text-sm text-ink-500">
                  How the other expansion team picks when it's on the clock.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {MODE_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSimulatedExpansionMode(m.id)}
                      className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                        simulatedExpansionMode === m.id
                          ? "border-seattle-500 bg-seattle-500/10"
                          : "border-tunnel-600 hover:border-tunnel-500"
                      }`}
                    >
                      <p className="font-display text-sm uppercase">
                        {m.label}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-tunnel-700 bg-tunnel-900 p-5">
                <h2 className="mb-1 font-display text-lg uppercase tracking-wide">
                  Default protection mode
                </h2>
                <p className="mb-4 text-sm text-ink-500">
                  How the 30 existing franchises decide their 8 protected
                  players. You can override individual teams to "manual" on the
                  next screen.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {MODE_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setDefaultProtectionMode(m.id)}
                      className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                        defaultMode === m.id
                          ? "border-clock-500 bg-clock-500/10"
                          : "border-tunnel-600 hover:border-tunnel-500"
                      }`}
                    >
                      <p className="font-display text-sm uppercase">
                        {m.label}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </section>

              <button
                onClick={() => {
                  setDefaultProtectionMode(defaultMode); // ensure a mode is set for all teams
                  setPhase("protection");
                }}
                className="w-full rounded-lg bg-clock-500 py-3 text-center font-display text-base uppercase tracking-wide text-tunnel-950 transition-colors hover:bg-clock-400"
              >
                Continue to Protection Review
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
