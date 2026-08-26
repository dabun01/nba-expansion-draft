import { useDraftStore } from "../store/useDraftStore";
import RosterTable from "../components/roster/RosterTable";
import CapBreakdown from "../components/roster/CapBreakdown";
import DraftTicker from "../components/draft/DraftTicker";

export default function DraftPage() {
  const teams = useDraftStore((s) => s.teams);
  const capTotal = useDraftStore((s) => s.salaryCapTotal);
  const pickOrder = useDraftStore((s) => s.pickOrder);
  const currentPickIndex = useDraftStore((s) => s.currentPickIndex);
  const picks = useDraftStore((s) => s.picks);
  const userExpansionTeamId = useDraftStore((s) => s.userExpansionTeamId);
  const expansionTeams = useDraftStore((s) => s.expansionTeams);
  const getCurrentAvailablePlayers = useDraftStore(
    (s) => s.getCurrentAvailablePlayers,
  );
  const makeUserPick = useDraftStore((s) => s.makeUserPick);
  const advanceUntilUserTurn = useDraftStore((s) => s.advanceUntilUserTurn);
  const getRosterForExpansionTeam = useDraftStore(
    (s) => s.getRosterForExpansionTeam,
  );
  const draftedPlayerIds = useDraftStore((s) => s.draftedPlayerIds);

  const currentPick = pickOrder[currentPickIndex];
  const isUserTurn = currentPick?.expansionTeamId === userExpansionTeamId;
  const available = currentPick ? getCurrentAvailablePlayers() : [];
  const remainingFranchiseCount = new Set(available.map((p) => p.teamId)).size;

  const handlePick = (playerId) => {
    makeUserPick(playerId);
    advanceUntilUserTurn();
  };

  const userRoster = getRosterForExpansionTeam(userExpansionTeamId);
  const otherTeam = expansionTeams.find((t) => t.id !== userExpansionTeamId);
  const otherRoster = getRosterForExpansionTeam(otherTeam.id);

  return (
    <div className="space-y-6">
      <DraftTicker
        pickOrder={pickOrder}
        currentPickIndex={currentPickIndex}
        picks={picks}
        teams={teams}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[
          {
            team: expansionTeams.find((t) => t.id === userExpansionTeamId),
            roster: userRoster,
          },
          { team: otherTeam, roster: otherRoster },
        ].map(({ team, roster }) => (
          <div key={team.id}>
            <p className="mb-2 font-display text-xs uppercase tracking-widest text-ink-500">
              {team.name} ({roster.length} drafted)
            </p>
            {roster.length > 0 ? (
              <CapBreakdown players={roster} capTotal={capTotal} />
            ) : (
              <p className="rounded-lg border border-tunnel-700 bg-tunnel-900 p-4 text-xs text-ink-500">
                No players drafted yet.
              </p>
            )}
          </div>
        ))}
      </div>

      <div>
        <div className="space-y-4">
          {currentPick ? (
            <>
              <div className="rounded-lg border border-clock-500/40 bg-clock-500/5 p-4">
                <p className="font-display text-xs uppercase tracking-widest text-clock-500">
                  Pick #{currentPick.pickNumber} &middot; on the clock:{" "}
                  {currentPick.expansionTeamId === "SEA"
                    ? "Seattle"
                    : "Las Vegas"}
                </p>
                <p className="mt-1 text-lg font-medium">
                  Choose any available player &mdash; {available.length}{" "}
                  eligible across {remainingFranchiseCount} franchise
                  {remainingFranchiseCount === 1 ? "" : "s"}
                </p>
                {!isUserTurn && (
                  <p className="mt-1 text-sm text-ink-500">
                    Simulated pick resolved automatically.
                  </p>
                )}
              </div>
              {available.length === 0 ? (
                <p className="rounded-lg border border-tunnel-700 bg-tunnel-900 p-6 text-center text-sm text-ink-500">
                  No eligible players remain for this team &mdash; every
                  remaining franchise has already been drafted from, or the pool
                  is exhausted. No pick made this turn.
                </p>
              ) : (
                <RosterTable
                  players={available}
                  showTeam
                  onTogglePlayer={isUserTurn ? handlePick : null}
                  disabledIds={draftedPlayerIds}
                />
              )}
            </>
          ) : (
            <p className="rounded-lg border border-protect-500/40 bg-protect-500/5 p-6 text-center text-ink-100">
              Draft complete — check the recap.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
