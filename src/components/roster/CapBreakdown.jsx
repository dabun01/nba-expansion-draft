const fmtMoney = (n) => `$${(n / 1_000_000).toFixed(1)}M`;

const SEGMENT_COLORS = [
  "#e8a33d", "#2fa8d6", "#d6a02f", "#4caf7d", "#d64545",
  "#6fc7e8", "#f2b84d", "#333c4e",
];

/** players: Player[], capTotal: number (league salary cap) */
export default function CapBreakdown({ players, capTotal }) {
  const used = players.reduce((sum, p) => sum + p.contract.salaryByYear[0], 0);
  const pctUsed = Math.min((used / capTotal) * 100, 100);
  const sorted = [...players].sort(
    (a, b) => b.contract.salaryByYear[0] - a.contract.salaryByYear[0]
  );

  return (
    <div className="rounded-lg border border-tunnel-700 bg-tunnel-900 p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="font-display text-sm uppercase tracking-wide text-ink-500">
          Salary cap usage
        </p>
        <p className="font-mono text-sm text-ink-300">
          {fmtMoney(used)} <span className="text-ink-500">/ {fmtMoney(capTotal)}</span>{" "}
          <span className={pctUsed >= 100 ? "text-exposed-500" : "text-clock-500"}>
            ({pctUsed.toFixed(1)}%)
          </span>
        </p>
      </div>

      <div className="mb-5 flex h-3 w-full overflow-hidden rounded-full bg-tunnel-800">
        {sorted.map((p, i) => {
          const width = (p.contract.salaryByYear[0] / capTotal) * 100;
          return (
            <div
              key={p.id}
              title={`${p.name}: ${fmtMoney(p.contract.salaryByYear[0])}`}
              style={{ width: `${width}%`, backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
            />
          );
        })}
      </div>

      <ul className="space-y-1.5">
        {sorted.map((p, i) => {
          const pct = (p.contract.salaryByYear[0] / capTotal) * 100;
          return (
            <li key={p.id} className="flex items-center gap-3 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
              />
              <span className="flex-1 truncate text-ink-300">{p.name}</span>
              <span className="font-mono text-ink-500">{fmtMoney(p.contract.salaryByYear[0])}</span>
              <span className="w-12 text-right font-tabular text-xs text-ink-500">
                {pct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
