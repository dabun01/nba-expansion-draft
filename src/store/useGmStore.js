import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PROTECT_COUNT } from "../lib/draftEngine";

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
      // teamId -> protected playerIds (at most PROTECT_COUNT)
      protections: {},
      submittedTeamIds: [],

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

      toggleProtection: (teamId, playerId) =>
        set((s) => {
          const current = s.protections[teamId] ?? [];
          let next;
          if (current.includes(playerId)) {
            next = current.filter((id) => id !== playerId);
          } else if (current.length < PROTECT_COUNT) {
            next = [...current, playerId];
          } else {
            return s;
          }
          return {
            protections: { ...s.protections, [teamId]: next },
            // Editing a submitted list means it needs submitting again.
            submittedTeamIds: s.submittedTeamIds.filter((id) => id !== teamId),
          };
        }),

      markSubmitted: (teamId) =>
        set((s) => ({
          submittedTeamIds: s.submittedTeamIds.includes(teamId)
            ? s.submittedTeamIds
            : [...s.submittedTeamIds, teamId],
        })),
    }),
    { name: "gm-store", version: 1 },
  ),
);
