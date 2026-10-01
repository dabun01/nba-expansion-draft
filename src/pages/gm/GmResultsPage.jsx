import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useDraftStore } from "../../store/useDraftStore";
import { useGmStore } from "../../store/useGmStore";
import TeamLogo from "../../components/TeamLogo";
import { getAge } from "../../lib/age";
import { getTeamColors } from "../../lib/teamColors";
import { fetchProtectionStats } from "../../lib/gmApi";
import { useLoopingCarousel } from "../../lib/useLoopingCarousel";

// "Atlanta Hawks" -> "Hawks", "Portland Trail Blazers" -> "Blazers"
const nickname = (team) => team.name.split(" ").pop();

function ShareIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResultRow({ player, pct, isYourPick }) {
  const age = getAge(player.birthDate);
  const protectedPct = Math.round(pct);
  return (
    <li className="border-b border-tunnel-800 py-3.5 last:border-b-0">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="min-w-0 truncate font-semibold">{player.name}</span>
        <span className="shrink-0 font-mono text-xs text-ink-500">
          {player.position}
          {age !== null ? ` · ${age}y` : ""}
        </span>
        {isYourPick ? (
          <span className="ml-auto shrink-0 rounded-full bg-clock-500/15 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-clock-500">
            Your pick
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3 font-mono text-sm font-semibold">
        <span className="w-10 shrink-0 text-protect-500">{protectedPct}%</span>
        <div
          className="flex h-2.5 flex-1 gap-0.5 overflow-hidden rounded-full"
          role="img"
          aria-label={`${protectedPct}% protected, ${100 - protectedPct}% unprotected`}
        >
          <div
            className="bg-protect-500"
            style={{ width: `${protectedPct}%` }}
          />
          <div className="flex-1 bg-exposed-500/35" />
        </div>
        <span className="w-10 shrink-0 text-right text-exposed-500">
          {100 - protectedPct}%
        </span>
      </div>
    </li>
  );
}

// Stats per team, shared by every panel on this page. A team's panel and
// its looping copy then share one request, and swiping back to a team you
// just saw doesn't refetch. Entries expire after a minute (the same window
// the CDN caches for); failures aren't kept, so a retry can succeed.
const statsCache = new Map();
const STATS_CACHE_MS = 60_000;

function loadStats(teamId) {
  const hit = statsCache.get(teamId);
  if (hit && Date.now() - hit.at < STATS_CACHE_MS) return hit.promise;
  const promise = fetchProtectionStats(teamId);
  statsCache.set(teamId, { promise, at: Date.now() });
  promise.catch(() => statsCache.delete(teamId));
  return promise;
}

// Returns { data } or { error } for this team, or null while loading.
function useTeamStats(teamId) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    // The request is shared through the cache, so instead of aborting it we
    // just ignore its answer if this panel has moved on or unmounted.
    let active = true;
    loadStats(teamId).then(
      (data) => active && setResult({ teamId, data }),
      (err) => active && setResult({ teamId, error: err.message }),
    );
    return () => {
      active = false;
    };
  }, [teamId]);
  return result?.teamId === teamId ? result : null;
}

// One team's results: a full-width panel in the swipeable row.
function ResultsPanel({ team, isClone, onBuild }) {
  const playersById = useDraftStore((s) => s.playersById);
  const yourPicks = useGmStore((s) => s.protections[team.id]);
  const hasSubmitted = useGmStore((s) => s.submittedTeamIds.includes(team.id));
  const current = useTeamStats(team.id);
  const stats = current?.data;
  const [primary, secondary] = getTeamColors(team);

  return (
    <section
      aria-label={isClone ? undefined : `${team.name} results`}
      aria-hidden={isClone || undefined}
      inert={isClone}
      className="scrollbar-thin h-full w-full shrink-0 snap-center snap-always overflow-y-auto px-5 pb-6"
    >
      <div
        className="mb-5 mt-1 flex items-center gap-3 rounded-xl p-4"
        style={{
          backgroundColor: primary,
          boxShadow: `inset 0 -5px 0 ${secondary}`,
        }}
      >
        <TeamLogo team={team} sizeClassName="h-14 w-14" showFrame={false} />
        <h2 className="min-w-0 font-display text-xl font-bold uppercase leading-tight tracking-wide text-white sm:text-2xl">
          {team.name}
        </h2>
      </div>
      <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-clock-500">
        Community picks
      </p>
      <h1 className="mb-2 font-display text-3xl font-bold uppercase tracking-wide">
        How GMs protected
      </h1>
      <p className="mb-4 text-sm text-ink-500">
        Share of submitted {nickname(team)} lists that protected each player
        {stats
          ? ` · ${stats.totalLists} ${stats.totalLists === 1 ? "list" : "lists"}`
          : ""}
      </p>

      {!current ? (
        <p className="py-10 text-center text-ink-500">Loading results…</p>
      ) : current.error ? (
        <p role="alert" className="py-10 text-center text-exposed-500">
          {current.error}
        </p>
      ) : !stats.enoughData ? (
        <div className="rounded-xl border border-tunnel-800 bg-tunnel-900 p-6 text-center">
          <p className="mb-1 font-display text-xl font-bold uppercase tracking-wide">
            Not enough lists yet
          </p>
          <p className="mb-4 text-sm text-ink-500">
            Results appear once {stats.minimumLists} GMs have protected the{" "}
            {nickname(team)}.
          </p>
          <p className="font-mono text-2xl font-semibold text-protect-500">
            {stats.totalLists} / {stats.minimumLists}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-1 flex items-center justify-between font-mono text-xs font-semibold uppercase tracking-[0.15em]">
            <span className="flex items-center gap-2 text-protect-500">
              <span className="h-2.5 w-2.5 rounded-sm bg-protect-500" />
              Protected
            </span>
            <span className="flex items-center gap-2 text-exposed-500">
              Unprotected
              <span className="h-2.5 w-2.5 rounded-sm bg-exposed-500/35" />
            </span>
          </div>
          <ol>
            {stats.players.map((stat) => {
              const player = playersById.get(stat.playerId);
              if (!player) return null;
              return (
                <ResultRow
                  key={stat.playerId}
                  player={player}
                  pct={stat.pct}
                  isYourPick={
                    hasSubmitted && !!yourPicks?.includes(stat.playerId)
                  }
                />
              );
            })}
          </ol>
          <p className="mt-3 text-center text-xs text-ink-500">
            Results refresh about once a minute.
          </p>
        </>
      )}

      {!hasSubmitted ? (
        <button
          type="button"
          onClick={onBuild}
          className="mt-6 w-full rounded-full bg-clock-500 py-4 font-display font-bold uppercase tracking-wider text-tunnel-950 transition-colors hover:bg-clock-400"
        >
          Build your {nickname(team)} list
        </button>
      ) : null}
    </section>
  );
}

// Step 3 of the GM flow: how the community protected one team. Public, so
// a shared /gm/results/ATL link works for visitors who haven't voted.
export default function GmResultsPage() {
  const { teamId: rawTeamId } = useParams();
  const teamId = rawTeamId?.toUpperCase();
  const navigate = useNavigate();
  const teams = useDraftStore((s) => s.teams);
  const selectedTeamIds = useGmStore((s) => s.selectedTeamIds);
  const submittedTeamIds = useGmStore((s) => s.submittedTeamIds);
  const selectTeams = useGmStore((s) => s.selectTeams);
  const [shareNote, setShareNote] = useState(null);
  const team = teams.find((t) => t.id === teamId);

  // If this is one of your completed lists, the row holds all of them (same
  // order as the protect screen) so you can swipe between them. Visitors and
  // unsubmitted teams get just this one team.
  const completed = teams
    .filter((t) => submittedTeamIds.includes(t.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const startIndex = completed.findIndex((t) => t.id === teamId);
  const panelTeams = startIndex !== -1 ? completed : team ? [team] : [];
  const { scrollerProps, slots, index, goTo, looping } = useLoopingCarousel(
    panelTeams.length,
    startIndex,
  );
  const activeTeam = panelTeams[index];

  // Keep the URL on the team you're looking at, so Share and refresh match.
  // replace: swiping shouldn't stack up browser history entries.
  useEffect(() => {
    if (activeTeam && activeTeam.id !== teamId) {
      navigate(`/gm/results/${activeTeam.id}`, { replace: true });
    }
  }, [activeTeam, teamId, navigate]);

  const backTo = selectedTeamIds.length > 0 ? "/gm/protect" : "/gm";

  // Phones open the native share sheet; elsewhere the link is copied.
  const flashNote = (note) => {
    setShareNote(note);
    setTimeout(() => setShareNote(null), 2000);
  };
  const handleShare = async () => {
    // Your own submitted teams go to the share-card screen (an image of
    // your 8). Visitors share the results link instead.
    if (submittedTeamIds.includes(activeTeam.id)) {
      navigate("/gm/share", { state: { teamId: activeTeam.id } });
      return;
    }
    const url = `${window.location.origin}/gm/results/${activeTeam.id}`;
    const text = `How GMs protected the ${activeTeam.name} in the NBA expansion draft. Build your own list:`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `How GMs protected the ${activeTeam.name}`,
          text,
          url,
        });
      } catch (err) {
        // AbortError just means the user closed the share sheet.
        if (err.name !== "AbortError") flashNote("Couldn't open sharing");
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      flashNote("Link copied");
    } catch {
      flashNote("Couldn't copy the link");
    }
  };

  const buildYourOwn = (t) => {
    selectTeams([t.id]);
    navigate("/gm/protect", { state: { teamId: t.id } });
  };

  const prevTeam = looping
    ? panelTeams[(index - 1 + panelTeams.length) % panelTeams.length]
    : null;
  const nextTeam = looping ? panelTeams[(index + 1) % panelTeams.length] : null;

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col border-tunnel-800 bg-tunnel-950 sm:border-x md:max-w-2xl">
      <header className="flex items-center justify-between px-3 py-3">
        <Link
          to={backTo}
          state={{ teamId: activeTeam?.id }}
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-ink-300 transition-colors hover:text-ink-100"
        >
          ‹
        </Link>
        {activeTeam ? (
          <div className="relative">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full border border-tunnel-700 px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider text-ink-100 transition-colors hover:border-tunnel-500"
            >
              <ShareIcon className="h-4 w-4" />
              Share
            </button>
            {shareNote ? (
              <p
                role="status"
                className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg bg-tunnel-700 px-3 py-1.5 text-xs text-ink-100"
              >
                {shareNote}
              </p>
            ) : null}
          </div>
        ) : null}
      </header>

      {!team ? (
        <main className="flex-1 px-5">
          <p className="mt-6 text-ink-300">No team called "{rawTeamId}".</p>
        </main>
      ) : (
        <main
          {...scrollerProps}
          className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-none [scrollbar-width:none]"
        >
          {slots.map(({ index: i, pos, isClone }) => (
            <ResultsPanel
              key={isClone ? `copy-${pos}` : panelTeams[i].id}
              team={panelTeams[i]}
              isClone={isClone}
              onBuild={() => buildYourOwn(panelTeams[i])}
            />
          ))}
        </main>
      )}

      {looping ? (
        <footer className="flex items-center justify-between border-t border-tunnel-800 bg-tunnel-950 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 font-mono text-sm text-ink-300">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label={`Previous team: ${prevTeam.name}`}
            className="flex items-center gap-2 uppercase transition-colors hover:text-ink-100"
          >
            ‹ {prevTeam.abbreviation}
          </button>
          <div className="flex gap-1.5" aria-hidden="true">
            {panelTeams.map((t, i) => (
              <span
                key={t.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-clock-500" : "w-1.5 bg-tunnel-600"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label={`Next team: ${nextTeam.name}`}
            className="flex items-center gap-2 uppercase transition-colors hover:text-ink-100"
          >
            {nextTeam.abbreviation} ›
          </button>
        </footer>
      ) : null}
    </div>
  );
}
