import { useEffect, useRef, useState } from "react";
import { useDraftStore } from "../store/useDraftStore";
import RosterTable from "../components/roster/RosterTable";
import CapBreakdown from "../components/roster/CapBreakdown";
import DraftTicker from "../components/draft/DraftTicker";
import TeamLogo from "../components/TeamLogo";
import { simulatedExpansionPick } from "../lib/draftEngine";

const PICK_TIME_LIMIT = 90;

function DraftTimer({ onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(PICK_TIME_LIMIT);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          onExpireRef.current();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const isUrgent = secondsLeft <= 15;

  return (
    <div
      className={`shrink-0 text-right font-mono text-2xl tabular-nums ${isUrgent ? "text-exposed-500" : "text-clock-500"}`}
      role="timer"
      aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
    >
      <span className="block text-[10px] uppercase tracking-widest text-ink-500">
        Time remaining
      </span>
      {minutes}:{seconds}
    </div>
  );
}

export default function DraftPage() {
  const teams = useDraftStore((s) => s.teams);
  const players = useDraftStore((s) => s.players);
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
  const getPlayer = useDraftStore((s) => s.getPlayer);
  const draftedPlayerIds = useDraftStore((s) => s.draftedPlayerIds);
  const [pickQueue, setPickQueue] = useState([]);
  const [activeRosterViews, setActiveRosterViews] = useState({});
  const previousPickCount = useRef(picks.length);

  const currentPick = pickOrder[currentPickIndex];
  const isUserTurn = currentPick?.expansionTeamId === userExpansionTeamId;
  const available = currentPick ? getCurrentAvailablePlayers() : [];

  const handlePick = (playerId) => {
    makeUserPick(playerId);
    advanceUntilUserTurn();
  };

  const handleTimerExpired = () => {
    if (!isUserTurn || available.length === 0) return;
    const timedOutPick = simulatedExpansionPick({
      mode: "auto",
      availablePlayers: available,
    });
    if (timedOutPick) handlePick(timedOutPick.id);
  };

  useEffect(() => {
    if (picks.length < previousPickCount.current) {
      previousPickCount.current = picks.length;
      setPickQueue([]);
      return;
    }

    const newPicks = picks
      .slice(previousPickCount.current)
      .filter((pick) => pick.playerId);
    if (newPicks.length > 0) {
      setPickQueue((current) => [...current, ...newPicks]);
    }
    previousPickCount.current = picks.length;
  }, [picks]);

  const activePick = pickQueue[0];
  const selectedPlayer = activePick ? getPlayer(activePick.playerId) : null;
  const selectingTeam = activePick
    ? expansionTeams.find((team) => team.id === activePick.expansionTeamId)
    : null;

  useEffect(() => {
    if (!activePick) return undefined;

    const removeTimer = window.setTimeout(
      () => setPickQueue((current) => current.slice(1)),
      2200,
    );

    return () => {
      window.clearTimeout(removeTimer);
    };
  }, [activePick]);

  const userRoster = getRosterForExpansionTeam(userExpansionTeamId);
  const otherTeam = expansionTeams.find((t) => t.id !== userExpansionTeamId);
  const otherRoster = getRosterForExpansionTeam(otherTeam.id);

  return (
    <>
      {selectedPlayer && selectingTeam ? (
        <div
          className="pick-overlay-backdrop fixed inset-0 z-50 flex items-center justify-center bg-tunnel-950/80 px-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="pick-overlay-card w-full max-w-md rounded-lg border border-clock-500/50 bg-tunnel-900 p-8 text-center shadow-2xl shadow-black/40">
            <p className="font-display text-xs uppercase tracking-[0.2em] text-clock-500">
              {selectingTeam.name} has selected
            </p>
            <div className="my-5 flex justify-center">
              <TeamLogo team={selectingTeam} sizeClassName="h-20 w-20" />
            </div>
            <p className="font-display text-3xl uppercase tracking-wide text-ink-100">
              {selectedPlayer.name}
            </p>
            <p className="mt-2 text-sm text-ink-500">
              Pick #{activePick.pickNumber}
            </p>
          </div>
        </div>
      ) : null}
      <div className="space-y-6">
        <DraftTicker
          pickOrder={pickOrder}
          currentPickIndex={currentPickIndex}
          picks={picks}
          teams={teams}
          players={players}
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
              ) : roster.length > 0 ? (
                <RosterTable players={roster} />
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
                  <div className="flex items-start justify-between gap-4">
                    <p className="min-w-0 font-display text-base uppercase tracking-widest text-clock-500">
                      Pick #{currentPick.pickNumber} &middot; on the clock: {""}
                      {currentPick.expansionTeamId === "SEA"
                        ? "Seattle"
                        : "Las Vegas"}
                    </p>
                    {isUserTurn ? (
                      <DraftTimer
                        key={currentPick.pickNumber}
                        onExpire={handleTimerExpired}
                      />
                    ) : null}
                  </div>
                  {!isUserTurn && (
                    <p className="mt-1 text-sm text-ink-500">
                      Simulated pick resolved automatically.
                    </p>
                  )}
                </div>
                {available.length === 0 ? (
                  <p className="rounded-lg border border-tunnel-700 bg-tunnel-900 p-6 text-center text-sm text-ink-500">
                    No eligible players remain for this team &mdash; every
                    remaining franchise has already been drafted from, or the
                    pool is exhausted. No pick made this turn.
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
    </>
  );
}
