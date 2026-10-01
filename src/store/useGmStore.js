import { create } from "zustand";
import { persist } from "zustand/middleware";

// State for the /gm community protection-list flow. Kept separate from
// useDraftStore because it has nothing to do with draft phases, and
// persisted so a refresh on mobile doesn't wipe someone's progress.
export const useGmStore = create(
  persist(
    (set) => ({
      // Anonymous id sent with submissions so a re-submit replaces the
      // earlier list instead of counting twice.
      clientId: crypto.randomUUID(),
      selectedTeamIds: [],

      toggleTeam: (teamId) =>
        set((s) => ({
          selectedTeamIds: s.selectedTeamIds.includes(teamId)
            ? s.selectedTeamIds.filter((id) => id !== teamId)
            : [...s.selectedTeamIds, teamId],
        })),

      selectTeams: (teamIds) =>
        set((s) => ({
          selectedTeamIds: [...new Set([...s.selectedTeamIds, ...teamIds])],
        })),

      deselectTeams: (teamIds) =>
        set((s) => ({
          selectedTeamIds: s.selectedTeamIds.filter(
            (id) => !teamIds.includes(id),
          ),
        })),
    }),
    { name: "gm-store", version: 1 },
  ),
);
