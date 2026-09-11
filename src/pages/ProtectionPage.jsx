import { useDraftStore } from "../store/useDraftStore";
import RosterTable from "../components/roster/RosterTable";
import TeamLogo from "../components/TeamLogo";
import { PROTECT_COUNT } from "../lib/draftEngine";
import { getTeamColors } from "../lib/teamColors";

export default function ProtectionPage() {
  const teams = useDraftStore((s) => s.teams);
  const players = useDraftStore((s) => s.players);
  const selectedTeamId = useDraftStore((s) => s.selectedTeamId);
  const protectionModeByTeam = useDraftStore((s) => s.protectionModeByTeam);
  const setProtectionModeForTeam = useDraftStore(
    (s) => s.setProtectionModeForTeam,
  );
  const manualProtectedIdsByTeam = useDraftStore(
    (s) => s.manualProtectedIdsByTeam,
  );
  const toggleManualProtect = useDraftStore((s) => s.toggleManualProtect);
  const runProtectionPhase = useDraftStore((s) => s.runProtectionPhase);
  const startDraft = useDraftStore((s) => s.startDraft);
  const advanceUntilUserTurn = useDraftStore((s) => s.advanceUntilUserTurn);
  const setPhase = useDraftStore((s) => s.setPhase);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const rosterPlayers = selectedTeam
    ? selectedTeam.playerIds.map((id) => players.find((p) => p.id === id))
    : [];
  const selectedMode = protectionModeByTeam[selectedTeamId] || "auto";
  const manualSelectedIds = new Set(
    manualProtectedIdsByTeam[selectedTeamId] || [],
  );
  const manualCount = manualSelectedIds.size;
  const [teamPrimary, teamSecondary] = getTeamColors(selectedTeam);

  const manualTeamsIncomplete = teams.filter(
    (t) =>
      (protectionModeByTeam[t.id] || "auto") === "manual" &&
      (manualProtectedIdsByTeam[t.id] || []).length < PROTECT_COUNT,
  );

  const handleStart = () => {
    runProtectionPhase();
    startDraft();
    advanceUntilUserTurn();
  };

  return (
    <div className="space-y-4">
      <div
        className="relative overflow-hidden rounded-lg border p-5 sm:p-6"
        style={{
          backgroundColor: teamPrimary,
          borderColor: teamSecondary,
          boxShadow: `inset 0 -4px 0 ${teamSecondary}`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full border-[18px] opacity-20"
          style={{ borderColor: teamSecondary }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <TeamLogo
              team={selectedTeam}
              sizeClassName="h-20 w-20"
              showFrame={false}
            />
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                {selectedTeam?.abbreviation} · {selectedTeam?.conference}{" "}
                conference
              </p>
              <h2 className="font-display text-3xl uppercase tracking-wide text-white sm:text-4xl">
                {selectedTeam?.name}
              </h2>
            </div>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-white/75">
            {rosterPlayers.length} players
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        {selectedMode === "manual" ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              manualCount === PROTECT_COUNT
                ? "bg-protect-500/15 text-protect-500"
                : "bg-clock-500/15 text-clock-500"
            }`}
          >
            {manualCount} / {PROTECT_COUNT} protected
          </span>
        ) : (
          <span className="rounded-full bg-tunnel-800 px-3 py-1 text-xs text-ink-500">
            Simulated: {selectedMode}
          </span>
        )}
        <select
          aria-label={`${selectedTeam?.name} protection mode`}
          value={selectedMode}
          onChange={(event) =>
            setProtectionModeForTeam(selectedTeamId, event.target.value)
          }
          className="w-24 rounded border border-tunnel-600 bg-tunnel-950 px-2 py-1 text-xs text-ink-300"
        >
          {["random", "preselected", "auto", "manual"].map((mode) => (
            <option key={mode} value={mode}>
              {mode[0].toUpperCase() + mode.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {selectedMode === "manual" ? (
        <>
          <p className="text-sm text-ink-500">
            Click up to {PROTECT_COUNT} players to protect them. Everyone else
            is exposed to both expansion teams.
          </p>
          <RosterTable
            players={rosterPlayers}
            protectedIds={manualSelectedIds}
            onTogglePlayer={(id) => toggleManualProtect(selectedTeamId, id)}
          />
        </>
      ) : (
        <>
          <p className="text-sm text-ink-500">
            This team's protection list will be generated automatically (
            {selectedMode}) when the draft starts.
          </p>
          <RosterTable players={rosterPlayers} />
        </>
      )}

      <div className="flex items-center justify-between border-t border-tunnel-700 pt-4">
        <button
          onClick={() => setPhase("setup")}
          className="rounded-lg border border-tunnel-600 px-4 py-2.5 text-sm text-ink-300 hover:border-tunnel-500"
        >
          Back
        </button>
        <div className="text-right">
          {manualTeamsIncomplete.length > 0 && (
            <p className="mb-2 text-xs text-exposed-500">
              {manualTeamsIncomplete.length} manual team(s) still need players
              protected.
            </p>
          )}
          <button
            onClick={handleStart}
            disabled={manualTeamsIncomplete.length > 0}
            className="rounded-lg bg-clock-500 px-6 py-2.5 font-display text-sm uppercase tracking-wide text-tunnel-950 transition-colors hover:bg-clock-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Lock Protection Lists &amp; Start Draft
          </button>
        </div>
      </div>
    </div>
  );
}
