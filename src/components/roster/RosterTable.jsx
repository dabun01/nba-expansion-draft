import { useState } from "react";
import { computeValueScores } from "../../lib/valueScore";

const fmtMoney = (n) => `$${(n / 1_000_000).toFixed(1)}M`;

const SORT_FIELDS = {
  name: { label: "Player", getValue: (p) => p.name },
  team: { label: "Team", getValue: (p) => p.teamId },
  position: { label: "Pos", getValue: (p) => p.position },
  pts: { label: "Pts", getValue: (p) => p.stats.pts, numeric: true },
  reb: { label: "Reb", getValue: (p) => p.stats.reb, numeric: true },
  ast: { label: "Ast", getValue: (p) => p.stats.ast, numeric: true },
  fgPct: { label: "FG%", getValue: (p) => p.stats.fgPct, numeric: true },
  salary: {
    label: "Salary",
    getValue: (p) => p.contract.salaryByYear[0],
    numeric: true,
  },
  yearsRemaining: {
    label: "Yrs Left",
    getValue: (p) => p.contract.yearsRemaining,
    numeric: true,
  },
  valueScore: {
    label: "Value",
    numeric: true,
  },
};

/**
 * players: Player[]
 * protectedIds: Set<string> | null -- if provided, shows a protected/exposed badge
 * onTogglePlayer: (playerId) => void -- if provided, rows become clickable (manual protection / draft pick)
 * disabledIds: Set<string> -- rows shown but not clickable (e.g. already drafted)
 * showTeam: boolean -- shows a franchise column; use when the list spans multiple teams
 */
export default function RosterTable({
  players,
  protectedIds = null,
  onTogglePlayer = null,
  disabledIds = null,
  showTeam = false,
}) {
  const [sort, setSort] = useState({ field: null, direction: "asc" });
  const valueScores = computeValueScores(players);
  const sortableFields = {
    ...SORT_FIELDS,
    valueScore: {
      ...SORT_FIELDS.valueScore,
      getValue: (p) => valueScores.get(p.id)?.valueScore ?? 0,
    },
  };

  const handleSort = (field) => {
    setSort((current) => ({
      field,
      direction:
        current.field === field
          ? current.direction === "asc"
            ? "desc"
            : "asc"
          : sortableFields[field].numeric
            ? "desc"
            : "asc",
    }));
  };

  const sortedPlayers = [...players].sort((a, b) => {
    if (!sort.field) return 0;
    const field = sortableFields[sort.field];
    const first = field.getValue(a);
    const second = field.getValue(b);
    const comparison = field.numeric
      ? first - second
      : String(first).localeCompare(String(second));
    return sort.direction === "asc" ? comparison : -comparison;
  });

  const renderHeader = (field, className) => {
    const isActive = sort.field === field;
    return (
      <th className={className} aria-sort={isActive ? sort.direction : "none"}>
        <button
          type="button"
          onClick={() => handleSort(field)}
          className="inline-flex items-center gap-1 hover:text-ink-100"
        >
          {sortableFields[field].label}
          <span aria-hidden="true" className="text-[10px]">
            {isActive ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-tunnel-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-tunnel-700 bg-tunnel-800 text-left text-xs uppercase tracking-wide text-ink-500">
            {renderHeader("name", "px-4 py-2.5 font-display font-medium")}
            {showTeam &&
              renderHeader("team", "px-3 py-2.5 font-display font-medium")}
            {renderHeader("position", "px-3 py-2.5 font-display font-medium")}
            {renderHeader(
              "pts",
              "px-3 py-2.5 font-display font-medium text-right",
            )}
            {renderHeader(
              "reb",
              "px-3 py-2.5 font-display font-medium text-right",
            )}
            {renderHeader(
              "ast",
              "px-3 py-2.5 font-display font-medium text-right",
            )}
            {renderHeader(
              "fgPct",
              "px-3 py-2.5 font-display font-medium text-right",
            )}
            {renderHeader(
              "salary",
              "px-3 py-2.5 font-display font-medium text-right",
            )}
            {renderHeader(
              "yearsRemaining",
              "px-3 py-2.5 font-display font-medium text-right",
            )}
            {renderHeader(
              "valueScore",
              "px-3 py-2.5 font-display font-medium text-right",
            )}
            {(protectedIds || onTogglePlayer) && (
              <th className="px-4 py-2.5 font-display font-medium text-right">
                Status
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((p) => {
            const isProtected = protectedIds?.has(p.id);
            const isDisabled = disabledIds?.has(p.id);
            const clickable = !!onTogglePlayer && !isDisabled;
            return (
              <tr
                key={p.id}
                onClick={() => clickable && onTogglePlayer(p.id)}
                className={`border-b border-tunnel-800 last:border-0 ${
                  clickable ? "cursor-pointer hover:bg-tunnel-800/60" : ""
                } ${isDisabled ? "opacity-35" : ""}`}
              >
                <td className="px-4 py-2.5 font-medium text-ink-100">
                  {p.name}
                </td>
                {showTeam && (
                  <td className="px-3 py-2.5 font-mono text-xs text-ink-500">
                    {p.teamId}
                  </td>
                )}
                <td className="px-3 py-2.5 text-ink-500">{p.position}</td>
                <td className="px-3 py-2.5 text-right font-tabular text-ink-300">
                  {p.stats.pts.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-right font-tabular text-ink-300">
                  {p.stats.reb.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-right font-tabular text-ink-300">
                  {p.stats.ast.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-right font-tabular text-ink-300">
                  {(p.stats.fgPct * 100).toFixed(1)}%
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-ink-300">
                  {fmtMoney(p.contract.salaryByYear[0])}
                </td>
                <td className="px-3 py-2.5 text-right font-tabular text-ink-300">
                  {p.contract.yearsRemaining}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-clock-500">
                  {(valueScores.get(p.id)?.valueScore ?? 0).toFixed(2)}
                </td>
                {(protectedIds || onTogglePlayer) && (
                  <td className="px-4 py-2.5 text-right">
                    {protectedIds && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isProtected
                            ? "bg-protect-500/15 text-protect-500"
                            : "bg-exposed-500/15 text-exposed-500"
                        }`}
                      >
                        {isProtected ? "Protected" : "Exposed"}
                      </span>
                    )}
                    {isDisabled && (
                      <span className="text-xs text-ink-500">Drafted</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
