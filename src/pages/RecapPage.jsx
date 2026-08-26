import { useDraftStore } from "../store/useDraftStore";
import RosterTable from "../components/roster/RosterTable";
import CapBreakdown from "../components/roster/CapBreakdown";

export default function RecapPage() {
  const expansionTeams = useDraftStore((s) => s.expansionTeams);
  const getRosterForExpansionTeam = useDraftStore((s) => s.getRosterForExpansionTeam);
  const capTotal = useDraftStore((s) => s.salaryCapTotal);
  const userExpansionTeamId = useDraftStore((s) => s.userExpansionTeamId);
  const setPhase = useDraftStore((s) => s.setPhase);

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="font-display text-3xl uppercase tracking-wide">Expansion Draft Complete</h1>
        <p className="mt-1 text-sm text-ink-500">Final rosters for both new franchises.</p>
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
                {team.name} {isUser && <span className="text-clock-500">(You)</span>}
              </h2>
              <span className="text-sm text-ink-500">&middot; {roster.length} players</span>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <RosterTable players={roster} />
              <CapBreakdown players={roster} capTotal={capTotal} />
            </div>
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
