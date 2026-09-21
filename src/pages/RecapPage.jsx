import { useState } from "react";
import { useDraftStore } from "../store/useDraftStore";
import RosterTable from "../components/roster/RosterTable";
import CapBreakdown from "../components/roster/CapBreakdown";

export default function RecapPage() {
  const [activeRosterViews, setActiveRosterViews] = useState({});
  const expansionTeams = useDraftStore((s) => s.expansionTeams);
  const getRosterForExpansionTeam = useDraftStore(
    (s) => s.getRosterForExpansionTeam,
  );
  const capTotal = useDraftStore((s) => s.salaryCapTotal);
  const userExpansionTeamId = useDraftStore((s) => s.userExpansionTeamId);
  const setPhase = useDraftStore((s) => s.setPhase);

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="font-display text-3xl uppercase tracking-wide">
          Expansion Draft Complete
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Final rosters for both new franchises.
        </p>
      </div>

      {expansionTeams.map((team) => {
        const roster = getRosterForExpansionTeam(team.id);
        const isUser = team.id === userExpansionTeamId;
        return (
          <section key={team.id}>
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  team.id === "SEA" ? "bg-seattle-500" : "bg-vegas-500"
                }`}
              />
              <h2 className="font-display text-xl uppercase tracking-wide">
                {team.name}{" "}
                {isUser && <span className="text-clock-500">(You)</span>}
              </h2>
              <span className="text-sm text-ink-500">
                &middot; {roster.length} players
              </span>
            </div>
            <div className="mb-4 flex w-fit rounded-lg border border-tunnel-700 bg-tunnel-900 p-1">
              {[
                { id: "roster", label: "Roster" },
                { id: "cap", label: "Salary cap space" },
              ].map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() =>
                    setActiveRosterViews((current) => ({
                      ...current,
                      [team.id]: view.id,
                    }))
                  }
                  aria-pressed={
                    (activeRosterViews[team.id] || "roster") === view.id
                  }
                  className={`rounded px-3 py-2 font-display text-xs uppercase tracking-wide transition-colors ${
                    (activeRosterViews[team.id] || "roster") === view.id
                      ? "bg-tunnel-700 text-ink-100"
                      : "text-ink-500 hover:text-ink-300"
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
            {(activeRosterViews[team.id] || "roster") === "cap" ? (
              <CapBreakdown players={roster} capTotal={capTotal} />
            ) : (
              <RosterTable players={roster} />
            )}
          </section>
        );
      })}

      <div className="flex justify-center">
        <button
          onClick={() => setPhase("setup")}
          className="rounded-lg border border-tunnel-600 px-6 py-2.5 text-sm text-ink-300 hover:border-tunnel-500"
        >
          Start a new draft
        </button>
      </div>
    </div>
  );
}
