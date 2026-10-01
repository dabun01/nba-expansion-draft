import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useDraftStore } from "../../store/useDraftStore";
import { useGmStore } from "../../store/useGmStore";
import TeamLogo from "../../components/TeamLogo";
import { getTeamColors } from "../../lib/teamColors";
import { PROTECT_COUNT } from "../../lib/draftEngine";
import { fetchProtectionStats } from "../../lib/gmApi";

// "Atlanta Hawks" -> "Hawks", "Portland Trail Blazers" -> "Blazers"
const nickname = (team) => team.name.split(" ").pop();

function Shell({ backTo, backState, children }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col border-tunnel-800 bg-tunnel-950 sm:border-x md:max-w-2xl">
      <header className="flex items-center px-3 py-3">
        <Link
          to={backTo}
          state={backState}
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-ink-300 transition-colors hover:text-ink-100"
        >
          ‹
        </Link>
        <p className="font-display text-lg font-bold uppercase tracking-wide">
          Expansion Draft <span className="text-clock-500">GM</span>
        </p>
      </header>
      <main className="flex-1 px-5 pb-8">{children}</main>
    </div>
  );
}

function ResultRow({ player, stat, rank, isYourPick }) {
  const inCrowdTop = rank < PROTECT_COUNT && stat.count > 0;
  return (
    <li className="rounded-xl border border-tunnel-800 bg-tunnel-900 p-4">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="w-5 shrink-0 font-mono text-xs text-ink-500">
          {rank + 1}
        </span>
        <span className="min-w-0 truncate font-semibold">{player.name}</span>
        <span className="shrink-0 font-mono text-xs text-ink-500">
          {player.position}
        </span>
        {isYourPick ? (
          <span className="shrink-0 rounded-full bg-clock-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-clock-500">
            Your pick
          </span>
        ) : null}
        <span
          className={`ml-auto shrink-0 font-display text-xl font-bold ${
            inCrowdTop ? "text-protect-500" : "text-ink-300"
          }`}
        >
          {stat.pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-tunnel-800">
        <div
          className={`h-full rounded-full ${inCrowdTop ? "bg-protect-500" : "bg-tunnel-500"}`}
          style={{ width: `${stat.pct}%` }}
        />
      </div>
    </li>
  );
}

// Step 3 of the GM flow: how the community protected one team. Public, so
// a shared /gm/results/ATL link works for visitors who haven't voted.
export default function GmResultsPage() {
  const { teamId: rawTeamId } = useParams();
  const teamId = rawTeamId?.toUpperCase();
  const navigate = useNavigate();
  const teams = useDraftStore((s) => s.teams);
  const playersById = useDraftStore((s) => s.playersById);
  const selectedTeamIds = useGmStore((s) => s.selectedTeamIds);
  const yourPicks = useGmStore((s) => s.protections[teamId]);
  const hasSubmitted = useGmStore((s) => s.submittedTeamIds.includes(teamId));
  const selectTeams = useGmStore((s) => s.selectTeams);
  const team = teams.find((t) => t.id === teamId);

  // { teamId, data } or { teamId, error }. Tagging with the team means a
  // result for the previous team is never shown while the next one loads.
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!team) return;
    // Abort the request if the user leaves or switches team before it
    // finishes, so a slow old response can't overwrite the new one.
    const controller = new AbortController();
    fetchProtectionStats(team.id, { signal: controller.signal })
      .then((data) => setResult({ teamId: team.id, data }))
      .catch((err) => {
        if (!controller.signal.aborted) {
          setResult({ teamId: team.id, error: err.message });
        }
      });
    return () => controller.abort();
  }, [team]);

  const backTo = selectedTeamIds.length > 0 ? "/gm/protect" : "/gm";

  if (!team) {
    return (
      <Shell backTo={backTo} backState={{ teamId }}>
        <p className="mt-6 text-ink-300">No team called "{rawTeamId}".</p>
      </Shell>
    );
  }

  const current = result?.teamId === team.id ? result : null;
  const stats = current?.data;
  const [primary, secondary] = getTeamColors(team);

  const buildYourOwn = () => {
    selectTeams([team.id]);
    navigate("/gm/protect", { state: { teamId: team.id } });
  };

  return (
    <Shell backTo={backTo} backState={{ teamId }}>
      <p className="mb-2 mt-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-clock-500">
        Compare
      </p>
      <h1 className="mb-4 font-display text-3xl font-bold uppercase tracking-wide">
        How GMs protected
      </h1>

      <div
        className="mb-5 flex items-center gap-3 rounded-xl p-4"
        style={{
          backgroundColor: primary,
          boxShadow: `inset 0 -5px 0 ${secondary}`,
        }}
      >
        <TeamLogo team={team} sizeClassName="h-14 w-14" showFrame={false} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold uppercase leading-tight tracking-wide text-white sm:text-2xl">
            {team.name}
          </h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/80">
            {stats
              ? `${stats.totalLists} ${stats.totalLists === 1 ? "list" : "lists"}`
              : " "}
          </p>
        </div>
      </div>

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
          <p className="mb-3 text-sm text-ink-500">
            <span className="font-semibold text-protect-500">Green</span> is the
            crowd's protected 8.
            {hasSubmitted ? " Your picks are tagged." : ""}
          </p>
          <ol className="space-y-2">
            {stats.players.map((stat, rank) => {
              const player = playersById.get(stat.playerId);
              if (!player) return null;
              return (
                <ResultRow
                  key={stat.playerId}
                  player={player}
                  stat={stat}
                  rank={rank}
                  isYourPick={
                    hasSubmitted && !!yourPicks?.includes(stat.playerId)
                  }
                />
              );
            })}
          </ol>
          <p className="mt-4 text-center text-xs text-ink-500">
            Results refresh about once a minute.
          </p>
        </>
      )}

      {!hasSubmitted ? (
        <button
          type="button"
          onClick={buildYourOwn}
          className="mt-6 w-full rounded-full bg-clock-500 py-4 font-display font-bold uppercase tracking-wider text-tunnel-950 transition-colors hover:bg-clock-400"
        >
          Build your {nickname(team)} list
        </button>
      ) : null}
    </Shell>
  );
}
