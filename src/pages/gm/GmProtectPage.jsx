import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useDraftStore } from "../../store/useDraftStore";
import { useGmStore } from "../../store/useGmStore";
import TeamLogo from "../../components/TeamLogo";
import { getTeamColors } from "../../lib/teamColors";
import { computeValueScores } from "../../lib/valueScore";
import { getAge } from "../../lib/age";
import { PROTECT_COUNT } from "../../lib/draftEngine";

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

function PlayerCard({ player, value, isProtected, isFull, onToggle }) {
  const age = getAge(player.birthDate);
  const { salaryByYear, yearsRemaining } = player.contract;

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
        isProtected
          ? "border-protect-500/70 bg-protect-500/10"
          : "border-tunnel-800 bg-tunnel-900"
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
          PTS{" "}
          <span className="text-ink-100">{player.stats.reb.toFixed(1)}</span>{" "}
          REB{" "}
          <span className="text-ink-100">{player.stats.ast.toFixed(1)}</span>{" "}
          AST
        </p>
        <p className="mt-1 truncate font-mono text-xs text-ink-500">
          {fmtMoney(salaryByYear[0])} · {yearsRemaining} yr{" "}
          <span className={value < 0 ? "text-exposed-500" : "text-clock-500"}>
            VAL {value.toFixed(2)}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={!isProtected && isFull}
        aria-pressed={isProtected}
        aria-label={`${isProtected ? "Unprotect" : "Protect"} ${player.name}`}
        className={`flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
          isProtected
            ? "bg-protect-500 text-tunnel-950 hover:bg-protect-500/85"
            : "border border-tunnel-600 hover:border-tunnel-500"
        }`}
      >
        {isProtected ? <CheckIcon className="h-4 w-4" /> : null}
        {/* Below 380px the check alone marks a protected player, leaving room for stats. */}
        <span className={isProtected ? "hidden min-[380px]:inline" : undefined}>
          {isProtected ? "Protected" : "Protect"}
        </span>
      </button>
    </li>
  );
}

function TeamPanel({ team, prevTeam, nextTeam, onPrev, onNext, showNav }) {
  const playersById = useDraftStore((s) => s.playersById);
  const protectedIds = useGmStore((s) => s.protections[team.id]) ?? [];
  const toggleProtection = useGmStore((s) => s.toggleProtection);

  const roster = team.playerIds
    .map((id) => playersById.get(id))
    .filter(Boolean);
  const values = computeValueScores(roster);
  const [primary, secondary] = getTeamColors(team);
  const isFull = protectedIds.length >= PROTECT_COUNT;

  return (
    <section
      aria-label={team.name}
      className="scrollbar-thin h-full w-full shrink-0 snap-center overflow-y-auto px-5 pb-6"
    >
      <div
        className="relative mt-2 overflow-hidden rounded-xl p-4"
        style={{
          backgroundColor: primary,
          boxShadow: `inset 0 -5px 0 ${secondary}`,
        }}
      >
        <div className="relative flex items-center gap-3">
          {/* Padding keeps the square logo inside the circle so corners aren't clipped. */}
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white p-1.5">
            <TeamLogo
              team={team}
              sizeClassName="h-full w-full"
              showFrame={false}
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-white/80">
              {team.conference} · {roster.length} players
            </p>
            <h2 className="font-display text-xl font-bold uppercase leading-tight tracking-wide text-white sm:text-2xl">
              {team.name}
            </h2>
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
            value={values.get(player.id)?.valueScore ?? 0}
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
  const allTeams = useDraftStore((s) => s.teams);
  const selectedTeamIds = useGmStore((s) => s.selectedTeamIds);
  const protections = useGmStore((s) => s.protections);
  const submittedTeamIds = useGmStore((s) => s.submittedTeamIds);
  const markSubmitted = useGmStore((s) => s.markSubmitted);
  const scrollerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const teams = allTeams
    .filter((t) => selectedTeamIds.includes(t.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (teams.length === 0) return <Navigate to="/gm" replace />;

  const index = Math.min(activeIndex, teams.length - 1);
  const team = teams[index];
  const count = protections[team.id]?.length ?? 0;
  const isSubmitted = submittedTeamIds.includes(team.id);

  // Wraps around, so "previous" from the first team is the last one.
  const goTo = (i) => {
    const target = (i + teams.length) % teams.length;
    const el = scrollerRef.current;
    const isAdjacent = Math.abs(target - index) === 1;
    el.scrollTo({
      left: target * el.clientWidth,
      behavior: isAdjacent ? "smooth" : "instant",
    });
    setActiveIndex(target);
  };

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setActiveIndex(i);
  };

  const handleSubmit = () => {
    // Saved locally for now; posting to /api/submissions comes with the API.
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
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none]"
      >
        {teams.map((t, i) => (
          <TeamPanel
            key={t.id}
            team={t}
            prevTeam={teams[(i - 1 + teams.length) % teams.length]}
            nextTeam={teams[(i + 1) % teams.length]}
            onPrev={() => goTo(i - 1)}
            onNext={() => goTo(i + 1)}
            showNav={teams.length > 1}
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
          <button
            type="button"
            onClick={handleSubmit}
            disabled={count < PROTECT_COUNT}
            className="w-full rounded-full bg-clock-500 py-4 font-display font-bold uppercase tracking-wider text-tunnel-950 transition-colors hover:bg-clock-400 disabled:cursor-not-allowed disabled:bg-tunnel-700 disabled:text-ink-300"
          >
            Submit {nickname(team)} list · {count}/{PROTECT_COUNT}
          </button>
        )}
      </footer>
    </div>
  );
}
