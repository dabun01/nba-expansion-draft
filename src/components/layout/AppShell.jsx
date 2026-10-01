import { cloneElement, useCallback, useState } from "react";
import TeamSidebar from "../sidebar/TeamSidebar";
import ModeSwitch from "../ModeSwitch";
import DraftRulesDialog from "../DraftRulesDialog";
import { useDraftStore } from "../../store/useDraftStore";

const PHASE_LABELS = {
  setup: "Start Setup",
  protection: "Protection",
  draft: "Expansion Draft",
  recap: "Draft Recap",
};

export default function AppShell({ children }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const phase = useDraftStore((s) => s.phase);
  const showTeamSidebar = phase !== "draft";
  const teams = useDraftStore((s) => s.teams);
  const expansionTeams = useDraftStore((s) => s.expansionTeams);
  const players = useDraftStore((s) => s.players);
  const setSelectedTeamId = useDraftStore((s) => s.setSelectedTeamId);
  const page = cloneElement(children, {
    isSettingsOpen,
    setIsSettingsOpen,
  });
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const allTeams = [...teams, ...expansionTeams];
  const matchingTeams = normalizedQuery
    ? allTeams
        .filter(
          (team) =>
            team.name.toLowerCase().includes(normalizedQuery) ||
            team.abbreviation?.toLowerCase().includes(normalizedQuery),
        )
        .slice(0, 5)
    : [];
  const matchingPlayers = normalizedQuery
    ? players
        .filter((player) => player.name.toLowerCase().includes(normalizedQuery))
        .slice(0, 8)
    : [];
  const hasSearchResults =
    matchingTeams.length > 0 || matchingPlayers.length > 0;

  const selectSearchResult = (teamId) => {
    setSelectedTeamId(teamId);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setSearchQuery("");
      setIsSearchFocused(false);
    }
    if (event.key === "Enter" && hasSearchResults) {
      event.preventDefault();
      selectSearchResult(matchingTeams[0]?.id || matchingPlayers[0].teamId);
    }
  };

  // Stable function so the dialog's Escape listener isn't re-added each render.
  const closeInfo = useCallback(() => setIsInfoOpen(false), []);

  return (
    <div className="flex h-screen bg-tunnel-950 text-ink-100">
      {showTeamSidebar ? <TeamSidebar /> : null}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-tunnel-700 bg-tunnel-900 px-6 py-4">
          <div className="min-w-0 shrink-0">
            <p className="font-display text-2xl uppercase tracking-wide text-ink-100">
              Expansion Draft <span className="text-clock-500">GM</span>
            </p>
            <p className="text-xs text-ink-500">
              Seattle &amp; Las Vegas expansion simulation
            </p>
          </div>
          <div className="relative mx-4 hidden min-w-0 flex-1 max-w-xl md:block">
            <form
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                if (hasSearchResults) {
                  selectSearchResult(
                    matchingTeams[0]?.id || matchingPlayers[0].teamId,
                  );
                }
              }}
            >
              <label htmlFor="global-search" className="sr-only">
                Search teams and players
              </label>
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-sm text-ink-500">
                /
              </span>
              <input
                id="global-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search teams or players..."
                autoComplete="off"
                className="w-full rounded border border-tunnel-600 bg-tunnel-950 py-2 pl-8 pr-3 text-sm text-ink-100 outline-none transition-colors placeholder:text-ink-500 focus:border-clock-500"
              />
            </form>
            {isSearchFocused && normalizedQuery ? (
              <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded border border-tunnel-600 bg-tunnel-900 p-2 shadow-2xl">
                {matchingTeams.length > 0 ? (
                  <div>
                    <p className="px-3 py-2 font-display text-[10px] uppercase tracking-widest text-ink-500">
                      Teams
                    </p>
                    {matchingTeams.map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSearchResult(team.id)}
                        className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-ink-100 transition-colors hover:bg-tunnel-800"
                      >
                        <span>{team.name}</span>
                        <span className="font-mono text-[10px] text-ink-500">
                          {team.abbreviation || team.id}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {matchingPlayers.length > 0 ? (
                  <div
                    className={
                      matchingTeams.length > 0
                        ? "mt-2 border-t border-tunnel-700 pt-2"
                        : ""
                    }
                  >
                    <p className="px-3 py-2 font-display text-[10px] uppercase tracking-widest text-ink-500">
                      Players
                    </p>
                    {matchingPlayers.map((player) => {
                      const team = allTeams.find(
                        (item) => item.id === player.teamId,
                      );
                      return (
                        <button
                          key={player.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectSearchResult(player.teamId)}
                          className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-ink-100 transition-colors hover:bg-tunnel-800"
                        >
                          <span>{player.name}</span>
                          <span className="text-xs text-ink-500">
                            {team?.abbreviation || team?.name || player.teamId}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {!hasSearchResults ? (
                  <p className="px-3 py-3 text-sm text-ink-500">
                    No teams or players found.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <ModeSwitch className="mr-3 shrink-0" />
          <button
            type="button"
            onClick={() => phase === "setup" && setIsSettingsOpen(true)}
            disabled={phase !== "setup"}
            className="rounded-full border border-tunnel-600 px-4 py-1.5 font-display text-sm uppercase tracking-wider text-ink-300 transition-colors hover:border-clock-500 hover:text-clock-500 disabled:cursor-default disabled:hover:border-tunnel-600 disabled:hover:text-ink-300"
          >
            {PHASE_LABELS[phase] || phase}
          </button>
        </header>
        <main
          className={`flex-1 overflow-y-auto scrollbar-thin p-6 ${phase === "setup" ? "pb-24" : ""}`}
        >
          {page}
        </main>
      </div>
      {isInfoOpen ? <DraftRulesDialog onClose={closeInfo} /> : null}
      {/* Floating ? to reopen the rules, on the setup screen only. */}
      {phase === "setup" && !isInfoOpen ? (
        <button
          type="button"
          onClick={() => setIsInfoOpen(true)}
          aria-label="Draft rules"
          title="Draft rules"
          className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-tunnel-600 bg-tunnel-800 font-display text-xl font-bold text-ink-100 shadow-lg shadow-black/40 transition-colors hover:border-clock-500 hover:text-clock-500"
        >
          ?
        </button>
      ) : null}
    </div>
  );
}
