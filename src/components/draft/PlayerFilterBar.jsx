import TeamLogo from "../TeamLogo";

// "Atlanta Hawks" -> "Hawks", "Portland Trail Blazers" -> "Blazers"
const nickname = (team) => team.name.split(" ").pop();

/**
 * Search box plus team chips for narrowing the draft's available players.
 * Chips are multi-select; with none selected, every team is shown.
 *
 * teams: teams that currently have available players
 * selectedTeamIds: string[]
 * onToggleTeam(teamId), onClear()
 * query, onQueryChange(text)
 * shownCount, totalCount: for the "Showing x of y" line
 */
export default function PlayerFilterBar({
  teams,
  selectedTeamIds,
  onToggleTeam,
  onClear,
  query,
  onQueryChange,
  shownCount,
  totalCount,
}) {
  const isFiltering = selectedTeamIds.length > 0 || query.trim() !== "";

  return (
    <div className="space-y-3 rounded-lg border border-tunnel-700 bg-tunnel-900 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <label htmlFor="draft-player-search" className="sr-only">
            Search players
          </label>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-500"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4">
              <circle
                cx="8.5"
                cy="8.5"
                r="5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M13 13l4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            id="draft-player-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onQueryChange("")}
            placeholder="Search players..."
            autoComplete="off"
            className="w-full rounded-full border border-tunnel-600 bg-tunnel-950 py-2 pl-9 pr-4 text-sm text-ink-100 outline-none transition-colors placeholder:text-ink-500 focus:border-seattle-500"
          />
        </div>
        <p className="font-mono text-xs text-ink-500" aria-live="polite">
          Showing {shownCount} of {totalCount}
        </p>
        {isFiltering ? (
          <button
            type="button"
            onClick={onClear}
            className="font-display text-xs uppercase tracking-wider text-seattle-400 transition-colors hover:text-seattle-500"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by team"
      >
        {teams.map((team) => {
          const selected = selectedTeamIds.includes(team.id);
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => onToggleTeam(team.id)}
              aria-pressed={selected}
              title={team.name}
              className={`flex items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-3 text-sm font-medium transition-colors ${
                selected
                  ? "border-seattle-500 bg-seattle-500 text-white"
                  : "border-tunnel-600 bg-tunnel-800 text-ink-300 hover:border-tunnel-500 hover:text-ink-100"
              }`}
            >
              <TeamLogo team={team} sizeClassName="h-5 w-5" showFrame={false} />
              {nickname(team)}
              {selected ? (
                <span
                  aria-hidden="true"
                  className="-mr-1 ml-0.5 text-base leading-none"
                >
                  ×
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
