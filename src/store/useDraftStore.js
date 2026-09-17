import { create } from "zustand";

import {
  generateProtectionList,
  buildExpansionTurnOrder,
  getAvailablePoolForExpansionTeam,
  simulatedExpansionPick,
  PROTECT_COUNT,
  MAX_EXPANSION_ROSTER_SIZE,
} from "../lib/draftEngine";

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${url}`);
  }

  return response.json();
}

const EXPANSION_TEAMS = [
  { id: "SEA", name: "Seattle" },
  { id: "VGS", name: "Las Vegas" },
];

export const useDraftStore = create((set, get) => ({
  // ---- static data ----
  teams: [],
  players: [],
  playersById: new Map(),
  salaryCapTotal: 0,
  isDataLoading: true,
  dataError: null,
  expansionTeams: EXPANSION_TEAMS,

  initializeData: async () => {
    const state = get();

    if (!state.isDataLoading && state.teams.length > 0) {
      return;
    }

    try {
      set({ isDataLoading: true, dataError: null });

      const [teams, players, config] = await Promise.all([
        fetchJson("/api/teams"),
        fetchJson("/api/players"),
        fetchJson("/api/config"),
      ]);

      set({
        teams,
        players,
        playersById: new Map(players.map((player) => [player.id, player])),
        salaryCapTotal: config.salaryCapTotal,
        selectedTeamId: teams[0]?.id || null,
        isDataLoading: false,
      });
    } catch (error) {
      console.error("Failed to load draft data:", error);

      set({
        isDataLoading: false,
        dataError: error.message,
      });
    }
  },

  // ---- setup ----
  phase: "setup", // setup | protection | draft | recap
  setPhase: (phase) => set({ phase }),
  userExpansionTeamId: "SEA", // which of the two the user controls
  simulatedExpansionMode: "auto", // random | preselected | auto, for the OTHER expansion team
  protectionModeByTeam: {}, // teamId -> "random" | "preselected" | "auto" | "manual"
  selectedTeamId: null, // sidebar team selector, for browsing rosters

  setSelectedTeamId: (teamId) => set({ selectedTeamId: teamId }),
  setUserExpansionTeamId: (id) => set({ userExpansionTeamId: id }),
  setSimulatedExpansionMode: (mode) => set({ simulatedExpansionMode: mode }),
  setProtectionModeForTeam: (teamId, mode) =>
    set((s) => ({
      protectionModeByTeam: { ...s.protectionModeByTeam, [teamId]: mode },
    })),
  setDefaultProtectionMode: (mode) =>
    set((s) => {
      const next = {};
      for (const t of s.teams) next[t.id] = mode;
      return { protectionModeByTeam: next };
    }),

  // ---- protection results ----
  protectedIdsByTeam: {}, // teamId -> [playerId, ...] up to 8
  manualProtectedIdsByTeam: {}, // in-progress manual selections, teamId -> [playerId]

  toggleManualProtect: (teamId, playerId) =>
    set((s) => {
      const current = s.manualProtectedIdsByTeam[teamId] || [];
      const isProtected = current.includes(playerId);
      let next;
      if (isProtected) {
        next = current.filter((id) => id !== playerId);
      } else if (current.length < PROTECT_COUNT) {
        next = [...current, playerId];
      } else {
        next = current; // already at 8, no-op
      }
      return {
        manualProtectedIdsByTeam: {
          ...s.manualProtectedIdsByTeam,
          [teamId]: next,
        },
      };
    }),

  /** Runs protection for every team per its selected mode (manual teams use
   *  whatever they've toggled so far in manualProtectedIdsByTeam). */
  runProtectionPhase: () =>
    set((s) => {
      const result = {};
      for (const team of s.teams) {
        const mode = s.protectionModeByTeam[team.id] || "auto";
        if (mode === "manual") {
          result[team.id] = s.manualProtectedIdsByTeam[team.id] || [];
          continue;
        }
        const rosterPlayers = team.playerIds.map((id) => s.playersById.get(id));
        result[team.id] = generateProtectionList({ mode, rosterPlayers });
      }
      return { protectedIdsByTeam: result, phase: "draft" };
    }),

  // ---- draft phase ----
  pickOrder: [], // built when draft starts: [{ pickNumber, expansionTeamId }]
  currentPickIndex: 0,
  picks: [], // { pickNumber, expansionTeamId, fromTeamId, playerId }
  draftedPlayerIds: new Set(),
  // which franchises each expansion team has already taken a player from --
  // this is what actually enforces the one-per-franchise rule now
  draftedFromTeamIdsByExpansionTeam: { SEA: new Set(), VGS: new Set() },

  startDraft: () =>
    set((s) => {
      const otherTeamId = s.expansionTeams.find(
        (t) => t.id !== s.userExpansionTeamId,
      ).id;
      const order =
        Math.random() < 0.5
          ? [s.userExpansionTeamId, otherTeamId]
          : [otherTeamId, s.userExpansionTeamId];
      return {
        pickOrder: buildExpansionTurnOrder(s.teams.length, order),
        currentPickIndex: 0,
        picks: [],
        draftedPlayerIds: new Set(),
        draftedFromTeamIdsByExpansionTeam: { SEA: new Set(), VGS: new Set() },
      };
    }),

  /** The full pool of players available to whichever expansion team is
   *  currently on the clock: unprotected, undrafted, spanning every
   *  franchise that team hasn't already picked from. */
  getCurrentAvailablePlayers: () => {
    const s = get();
    const current = s.pickOrder[s.currentPickIndex];
    if (!current) return [];
    const draftedCount = s.picks.filter(
      (pick) =>
        pick.expansionTeamId === current.expansionTeamId && pick.playerId,
    ).length;
    if (draftedCount >= MAX_EXPANSION_ROSTER_SIZE) return [];
    return getAvailablePoolForExpansionTeam({
      teams: s.teams,
      playersById: s.playersById,
      protectedIdsByTeam: s.protectedIdsByTeam,
      draftedPlayerIds: s.draftedPlayerIds,
      draftedFromTeamIds:
        s.draftedFromTeamIdsByExpansionTeam[current.expansionTeamId],
    });
  },

  /** User makes a selection for their own expansion team's turn. Any player
   *  in the current pool is fair game -- which franchise it comes from is
   *  read off the player itself, not dictated by the turn. */
  makeUserPick: (playerId) => {
    const s = get();
    const current = s.pickOrder[s.currentPickIndex];
    if (
      !current ||
      current.expansionTeamId !== s.userExpansionTeamId ||
      s.draftedPlayerIds.has(playerId)
    ) {
      return;
    }
    get()._commitPick(current, playerId);
  },

  /** Advances the draft, auto-resolving the simulated team's turns, and
   *  stopping when it's the user's turn (or the draft is complete). */
  advanceUntilUserTurn: () => {
    const s = get();
    let current = s.pickOrder[s.currentPickIndex];
    while (current && current.expansionTeamId !== s.userExpansionTeamId) {
      const available = get().getCurrentAvailablePlayers();
      const chosen = simulatedExpansionPick({
        mode: get().simulatedExpansionMode,
        availablePlayers: available,
      });
      get()._commitPick(current, chosen ? chosen.id : null);
      current = get().pickOrder[get().currentPickIndex];
    }
    if (!current) set({ phase: "recap" });
  },

  _commitPick: (current, playerId) =>
    set((s) => {
      const draftedPlayerIds = new Set(s.draftedPlayerIds);
      const draftedFromTeamIdsByExpansionTeam = {
        SEA: new Set(s.draftedFromTeamIdsByExpansionTeam.SEA),
        VGS: new Set(s.draftedFromTeamIdsByExpansionTeam.VGS),
      };
      const picks = [...s.picks];
      const playersById = s.playersById;
      const player = playerId ? playersById.get(playerId) : null;
      const draftedCount = picks.filter(
        (pick) =>
          pick.expansionTeamId === current.expansionTeamId && pick.playerId,
      ).length;

      if (
        draftedCount >= MAX_EXPANSION_ROSTER_SIZE ||
        (playerId && s.draftedPlayerIds.has(playerId))
      ) {
        return {};
      }

      if (player) {
        draftedPlayerIds.add(playerId);
        draftedFromTeamIdsByExpansionTeam[current.expansionTeamId].add(
          player.teamId,
        );
        picks.push({ ...current, fromTeamId: player.teamId, playerId });
      } else {
        // pool was empty for this team on this turn -- nothing left to take
        picks.push({ ...current, fromTeamId: null, playerId: null });
      }

      const nextIndex = s.currentPickIndex + 1;
      const isDone = nextIndex >= s.pickOrder.length;
      return {
        draftedPlayerIds,
        draftedFromTeamIdsByExpansionTeam,
        picks,
        currentPickIndex: nextIndex,
        phase: isDone ? "recap" : s.phase,
      };
    }),

  // ---- helpers ----
  getPlayer: (id) => get().playersById.get(id),
  getRosterForExpansionTeam: (expansionTeamId) => {
    const s = get();
    return s.picks
      .filter((p) => p.expansionTeamId === expansionTeamId && p.playerId)
      .map((p) => get().playersById.get(p.playerId));
  },
}));
