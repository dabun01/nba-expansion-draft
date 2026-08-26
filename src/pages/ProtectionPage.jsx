import { useDraftStore } from "../store/useDraftStore";
import RosterTable from "../components/roster/RosterTable";
import { PROTECT_COUNT } from "../lib/draftEngine";

const MODES = ["random", "preselected", "auto", "manual"];

export default function ProtectionPage() {
  const teams = useDraftStore((s) => s.teams);
  const players = useDraftStore((s) => s.players);
  const selectedTeamId = useDraftStore((s) => s.selectedTeamId);
  const setSelectedTeamId = useDraftStore((s) => s.setSelectedTeamId);
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-2">
        <p className="mb-1 font-display text-xs uppercase tracking-widest text-ink-500">
          Protection mode per team
        </p>
        <div className="max-h-[70vh] space-y-1 overflow-y-auto scrollbar-thin rounded-lg border border-tunnel-700 bg-tunnel-900 p-2">
          {teams.map((t) => {
            const mode = protectionModeByTeam[t.id] || "auto";
            const manualDone = (manualProtectedIdsByTeam[t.id] || []).length;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTeamId(t.id)}
                className={`cursor-pointer rounded-md px-3 py-2 ${
                  selectedTeamId === t.id
                    ? "bg-tunnel-800"
                    : "hover:bg-tunnel-800/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t.name}</span>
                  {mode === "manual" && (
                    <span
                      className={`font-mono text-xs ${
                        manualDone === PROTECT_COUNT
                          ? "text-protect-500"
                          : "text-exposed-500"
                      }`}
                    >
                      {manualDone}/{PROTECT_COUNT}
                    </span>
                  )}
                </div>
                <select
                  value={mode}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setProtectionModeForTeam(t.id, e.target.value)
                  }
                  className="mt-1 w-full rounded border border-tunnel-600 bg-tunnel-950 px-2 py-1 text-xs text-ink-300"
                >
                  {MODES.map((m) => (
                    <option key={m} value={m}>
                      {m[0].toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg uppercase tracking-wide">
            {selectedTeam?.name}
          </h2>
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
    </div>
  );
}
