export default function DraftTicker({ pickOrder, currentPickIndex, picks, teams }) {
  const teamAbbr = (id) => teams.find((t) => t.id === id)?.abbreviation || id;

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-thin rounded-lg border border-tunnel-700 bg-tunnel-900 p-3">
      {pickOrder.map((turn, i) => {
        const done = i < currentPickIndex;
        const isCurrent = i === currentPickIndex;
        const madePick = picks[i]; // only exists once this turn has been resolved
        const doneClass =
          turn.expansionTeamId === "SEA"
            ? "border-seattle-500/40 bg-seattle-500/10"
            : "border-vegas-500/40 bg-vegas-500/10";
        const label = madePick?.fromTeamId ? teamAbbr(madePick.fromTeamId) : done ? "\u2014" : "?";
        return (
          <div
            key={turn.pickNumber}
            title={
              madePick?.fromTeamId
                ? `Pick ${turn.pickNumber}: ${turn.expansionTeamId} took a player from ${teamAbbr(madePick.fromTeamId)}`
                : `Pick ${turn.pickNumber}: ${turn.expansionTeamId} on the clock`
            }
            className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border font-mono text-[10px] transition-colors ${
              isCurrent
                ? "border-clock-500 bg-clock-500/10"
                : done
                ? doneClass
                : "border-tunnel-700 bg-tunnel-950"
            }`}
          >
            <span className="text-ink-500">#{turn.pickNumber}</span>
            <span className="text-ink-300">{label}</span>
            <span
              className={
                turn.expansionTeamId === "SEA" ? "text-seattle-400" : "text-vegas-400"
              }
            >
              {turn.expansionTeamId}
            </span>
          </div>
        );
      })}
    </div>
  );
}
