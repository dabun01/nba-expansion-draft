import { useEffect, useRef } from "react";

export default function DraftTicker({
  pickOrder,
  currentPickIndex,
  picks,
  teams,
  players,
}) {
  const currentPickRef = useRef(null);
  const teamAbbr = (id) => teams.find((t) => t.id === id)?.abbreviation || id;
  const playerName = (id) => {
    const name = players.find((player) => player.id === id)?.name;
    if (!name) return null;
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length < 2) return name;
    return `${nameParts[0][0]}. ${nameParts.at(-1)}`;
  };

  useEffect(() => {
    currentPickRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentPickIndex]);

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
        const label = madePick?.playerId
          ? playerName(madePick.playerId) || teamAbbr(madePick.fromTeamId)
          : done
            ? "\u2014"
            : "?";
        return (
          <div
            key={turn.pickNumber}
            ref={isCurrent ? currentPickRef : null}
            title={
              madePick?.playerId
                ? `Pick ${turn.pickNumber}: ${turn.expansionTeamId} selected ${playerName(madePick.playerId) || "a player"}`
                : `Pick ${turn.pickNumber}: ${turn.expansionTeamId} on the clock`
            }
            className={`flex h-14 w-24 shrink-0 flex-col items-center justify-center rounded-md border font-mono text-[10px] transition-colors ${
              isCurrent
                ? "border-clock-500 bg-clock-500/10"
                : done
                  ? doneClass
                  : "border-tunnel-700 bg-tunnel-950"
            }`}
          >
            <span className="text-ink-500">#{turn.pickNumber}</span>
            <span className="max-w-full truncate px-1 text-ink-300">
              {label}
            </span>
            <span
              className={
                turn.expansionTeamId === "SEA"
                  ? "text-seattle-400"
                  : "text-vegas-400"
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
