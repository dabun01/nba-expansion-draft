import { cloneElement, useEffect, useState } from "react";
import TeamSidebar from "../sidebar/TeamSidebar";
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

  useEffect(() => {
    if (!isInfoOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsInfoOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInfoOpen]);

  return (
    <div className="flex h-screen bg-tunnel-950 text-ink-100">
      <TeamSidebar />
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
          <button
            type="button"
            onClick={() => phase === "setup" && setIsSettingsOpen(true)}
            disabled={phase !== "setup"}
            className="rounded-full border border-tunnel-600 px-4 py-1.5 font-display text-sm uppercase tracking-wider text-ink-300 transition-colors hover:border-clock-500 hover:text-clock-500 disabled:cursor-default disabled:hover:border-tunnel-600 disabled:hover:text-ink-300"
          >
            {PHASE_LABELS[phase] || phase}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {page}
        </main>
      </div>
      {isInfoOpen ? (
        <>
          <button
            type="button"
            onClick={() => setIsInfoOpen(false)}
            aria-label="Close draft guide"
            className="fixed inset-0 z-40 cursor-default bg-tunnel-950/80"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="draft-guide-title"
            className="fixed inset-x-4 top-1/2 z-50 max-h-[calc(100vh-2rem)] max-w-2xl -translate-y-1/2 overflow-y-auto rounded-lg border border-tunnel-600 bg-tunnel-900 shadow-2xl sm:inset-x-8 sm:mx-auto"
          >
            <div className="flex items-start justify-between gap-6 border-b border-tunnel-700 px-5 py-5 sm:px-7">
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-clock-500">
                  Commissioner&apos;s briefing
                </p>
                <h2
                  id="draft-guide-title"
                  className="font-display text-2xl uppercase tracking-wide text-ink-100 sm:text-3xl"
                >
                  What is an expansion draft?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                aria-label="Close draft guide"
                title="Close draft guide"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-tunnel-700 font-mono text-lg text-ink-500 transition-colors hover:border-tunnel-500 hover:text-ink-100"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6 px-5 py-6 sm:px-7">
              <p className="max-w-xl text-sm leading-6 text-ink-300">
                When new franchises join the league, they build their first
                rosters by selecting eligible players from existing teams. You
                are the GM for one expansion team; the other team is simulated
                by the game.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded border border-tunnel-700 bg-tunnel-800/60 p-4">
                  <p className="mb-2 font-display text-sm uppercase tracking-wide text-clock-500">
                    Before the draft
                  </p>
                  <p className="text-sm leading-6 text-ink-300">
                    Every existing franchise protects 8 players. Only its
                    unprotected players can be selected.
                  </p>
                </article>
                <article className="rounded border border-tunnel-700 bg-tunnel-800/60 p-4">
                  <p className="mb-2 font-display text-sm uppercase tracking-wide text-clock-500">
                    On the clock
                  </p>
                  <p className="text-sm leading-6 text-ink-300">
                    The two expansion teams alternate picks. Each can draft up
                    to 15 players in total.
                  </p>
                </article>
              </div>

              <div>
                <p className="mb-3 font-display text-sm uppercase tracking-wide text-ink-100">
                  The rules of the room
                </p>
                <ul className="space-y-3 text-sm leading-6 text-ink-300">
                  <li className="flex gap-3">
                    <span className="font-mono text-clock-500">01</span>
                    <span>
                      Each expansion team may take at most one player from each
                      existing franchise.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-mono text-clock-500">02</span>
                    <span>
                      A player can be selected only once, by whichever expansion
                      team gets to them first.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-mono text-clock-500">03</span>
                    <span>
                      Your choices are manual. The rival team follows the
                      strategy you choose in setup.
                    </span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-full rounded bg-clock-500 px-4 py-3 font-display text-base uppercase tracking-wide text-tunnel-950 transition-colors hover:bg-clock-400"
              >
                Enter the war room
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
