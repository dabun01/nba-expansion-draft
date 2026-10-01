import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useDraftStore } from "../../store/useDraftStore";
import { useGmStore } from "../../store/useGmStore";
import TeamLogo from "../../components/TeamLogo";
import { getTeamColors } from "../../lib/teamColors";
import { getAge } from "../../lib/age";
import { PROTECT_COUNT } from "../../lib/draftEngine";
import { submitList } from "../../lib/gmApi";
import { useLoopingCarousel } from "../../lib/useLoopingCarousel";

const fmtMoney = (n) => `$${(n / 1_000_000).toFixed(1)}M`;

// "Atlanta Hawks" -> "Hawks", "Portland Trail Blazers" -> "Blazers"
const nickname = (team) => team.name.split(" ").pop();

function CheckIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        d="M3.5 8.5l3 3 6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M4 4v16h16M8 16v-4M12 16V8M16 16v-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayerCard({ player, isProtected, isFull, onToggle }) {
  const age = getAge(player.birthDate);
  const { salaryByYear, yearsRemaining } = player.contract;

  // The whole card is the toggle, so a tap anywhere on it (easy on a phone)
  // protects or unprotects the player. The pill is just its visual label.
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        disabled={!isProtected && isFull}
        aria-pressed={isProtected}
        className={`group flex w-full touch-manipulation items-center gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
          isProtected
            ? "border-protect-500/70 bg-protect-500/10"
            : "border-tunnel-800 bg-tunnel-900 enabled:hover:border-tunnel-600"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className="truncate font-semibold">{player.name}</span>
            <span className="shrink-0 font-mono text-xs text-ink-500">
              {player.position}
              {age !== null ? ` · ${age}y` : ""}
            </span>
          </p>
          <p className="mt-1 truncate font-mono text-xs text-ink-500">
            <span className="text-ink-100">{player.stats.pts.toFixed(1)}</span>{" "}
            PTS{" | "}
            <span className="text-ink-100">
              {player.stats.ast.toFixed(1)}
            </span>{" "}
            AST{" | "}
            <span className="text-ink-100">
              {player.stats.reb.toFixed(1)}
            </span>{" "}
            REB{" "}
          </p>
          <p className="mt-1 truncate font-mono text-xs text-ink-500">
            {fmtMoney(salaryByYear[0])} · {yearsRemaining} yr
          </p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider transition-colors group-disabled:opacity-30 ${
            isProtected
              ? "bg-protect-500 text-tunnel-950 group-hover:bg-protect-500/85"
              : "border border-tunnel-600 group-enabled:group-hover:border-tunnel-500"
          }`}
        >
          {isProtected ? <CheckIcon className="h-4 w-4" /> : null}
          {/* Below 380px the check alone marks a protected player, leaving room
              for stats; the label stays readable to screen readers. */}
          <span
            className={
              isProtected ? "sr-only min-[380px]:not-sr-only" : undefined
            }
          >
            {isProtected ? "Protected" : "Protect"}
          </span>
        </span>
      </button>
    </li>
  );
}

function TeamPanel({
  team,
  prevTeam,
  nextTeam,
  onPrev,
  onNext,
  showNav,
  isClone = false,
}) {
  const playersById = useDraftStore((s) => s.playersById);
  const protectedIds = useGmStore((s) => s.protections[team.id]) ?? [];
  const toggleProtection = useGmStore((s) => s.toggleProtection);

  const roster = team.playerIds
    .map((id) => playersById.get(id))
    .filter(Boolean);
  const [primary, secondary] = getTeamColors(team);
  const isFull = protectedIds.length >= PROTECT_COUNT;

  return (
    <section
      aria-label={isClone ? undefined : team.name}
      aria-hidden={isClone || undefined}
      inert={isClone}
      className="scrollbar-thin h-full w-full shrink-0 snap-center snap-always overflow-y-auto px-5 pb-6"
    >
      <div
        className="relative mt-2 overflow-hidden rounded-xl p-4"
        style={{
          backgroundColor: primary,
          boxShadow: `inset 0 -5px 0 ${secondary}`,
        }}
      >
        <div className="relative flex items-center gap-3">
          <TeamLogo team={team} sizeClassName="h-14 w-14" showFrame={false} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold uppercase leading-tight tracking-wide text-white sm:text-2xl">
              {team.name}
            </h2>
            <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.2em] text-white/80">
              {team.conference === "East" ? "Eastern" : "Western"} Conference
            </p>
          </div>
          <div className="shrink-0 text-right text-white">
            <p className="font-display text-3xl font-bold leading-none">
              {protectedIds.length}/{PROTECT_COUNT}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">
              Protected
            </p>
          </div>
        </div>
      </div>

      {showNav ? (
        <div className="my-4 flex items-center justify-between font-mono text-sm text-ink-500">
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center gap-1.5 uppercase transition-colors hover:text-ink-100"
            aria-label={`Previous team: ${prevTeam.name}`}
          >
            ‹ {prevTeam.abbreviation}
          </button>
          <span className="font-sans">Swipe to switch teams</span>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-1.5 uppercase transition-colors hover:text-ink-100"
            aria-label={`Next team: ${nextTeam.name}`}
          >
            {nextTeam.abbreviation} ›
          </button>
        </div>
      ) : (
        <div className="h-4" />
      )}

      <ul className="space-y-3">
        {roster.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isProtected={protectedIds.includes(player.id)}
            isFull={isFull}
            onToggle={() => toggleProtection(team.id, player.id)}
          />
        ))}
      </ul>
    </section>
  );
}

// Step 2 of the GM flow: protect 8 players on each selected team, swiping
// between teams.
export default function GmProtectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const allTeams = useDraftStore((s) => s.teams);
  const selectedTeamIds = useGmStore((s) => s.selectedTeamIds);
  const protections = useGmStore((s) => s.protections);
  const submittedTeamIds = useGmStore((s) => s.submittedTeamIds);
  const markSubmitted = useGmStore((s) => s.markSubmitted);
  const clientId = useGmStore((s) => s.clientId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Tagged with the team so an error doesn't follow you to the next team.
  const [submitError, setSubmitError] = useState(null);

  const teams = allTeams
    .filter((t) => selectedTeamIds.includes(t.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const n = teams.length;

  // Links from a results page pass { teamId } so we open on that team.
  const { scrollerProps, slots, index, goTo, looping } = useLoopingCarousel(
    n,
    teams.findIndex((t) => t.id === location.state?.teamId),
  );

  if (n === 0) return <Navigate to="/gm" replace />;

  const team = teams[index];
  const count = protections[team.id]?.length ?? 0;
  const isSubmitted = submittedTeamIds.includes(team.id);

  const handleSubmit = async () => {
    if (isSubmitting) return; // ignore a double tap while the first is in flight
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitList({
        teamId: team.id,
        playerIds: protections[team.id],
        clientId,
      });
    } catch (err) {
      setSubmitError({ teamId: team.id, message: err.message });
      return;
    } finally {
      setIsSubmitting(false);
    }

    // Only mark it submitted once the server has accepted it.
    markSubmitted(team.id);
    const nextOpen = teams.findIndex(
      (t, i) => i !== index && !submittedTeamIds.includes(t.id),
    );
    if (nextOpen === -1) navigate(`/gm/results/${team.id}`);
    else goTo(nextOpen);
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col border-tunnel-800 bg-tunnel-950 sm:border-x md:max-w-2xl">
      <header className="flex items-center justify-between px-3 py-3">
        <Link
          to="/gm"
          aria-label="Back to team selection"
          className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-ink-300 transition-colors hover:text-ink-100"
        >
          ‹
        </Link>
        <div className="flex flex-col items-center gap-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
            Team {index + 1} of {teams.length}
          </p>
          <div className="flex gap-1.5" aria-hidden="true">
            {teams.map((t, i) => (
              <span
                key={t.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-clock-500" : "w-1.5 bg-tunnel-600"
                }`}
              />
            ))}
          </div>
        </div>
        {isSubmitted ? (
          <Link
            to={`/gm/results/${team.id}`}
            aria-label={`See how GMs protected the ${team.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-300 transition-colors hover:text-ink-100"
          >
            <ChartIcon className="h-6 w-6" />
          </Link>
        ) : (
          <span
            title="Submit this list to see how other GMs protected"
            className="flex h-11 w-11 items-center justify-center text-tunnel-600"
          >
            <ChartIcon className="h-6 w-6" />
          </span>
        )}
      </header>

      <main
        {...scrollerProps}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-none [scrollbar-width:none]"
      >
        {slots.map(({ index: i, pos, isClone }) => (
          <TeamPanel
            key={isClone ? `copy-${pos}` : teams[i].id}
            team={teams[i]}
            prevTeam={teams[(i - 1 + n) % n]}
            nextTeam={teams[(i + 1) % n]}
            onPrev={() => goTo(i - 1)}
            onNext={() => goTo(i + 1)}
            showNav={looping}
            isClone={isClone}
          />
        ))}
      </main>

      <footer className="border-t border-tunnel-800 bg-tunnel-950 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        {isSubmitted ? (
          <p className="flex w-full items-center justify-center gap-2 rounded-full border border-protect-500 py-4 font-display font-bold uppercase tracking-wider text-protect-500">
            <CheckIcon className="h-5 w-5" />
            {nickname(team)} list submitted
          </p>
        ) : (
          <>
            {submitError?.teamId === team.id ? (
              <p
                role="alert"
                className="mb-3 text-center text-sm text-exposed-500"
              >
                {submitError.message}
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={count < PROTECT_COUNT || isSubmitting}
              className="w-full rounded-full bg-clock-500 py-4 font-display font-bold uppercase tracking-wider text-tunnel-950 transition-colors hover:bg-clock-400 disabled:cursor-not-allowed disabled:bg-tunnel-700 disabled:text-ink-300"
            >
              {isSubmitting
                ? "Submitting…"
                : `Submit ${nickname(team)} list · ${count}/${PROTECT_COUNT}`}
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
