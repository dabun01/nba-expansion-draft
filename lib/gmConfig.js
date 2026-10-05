// lib/gmConfig.js
// Settings shared by the GM community API routes.

// Bump this whenever rosters change (a trade, a reseed with different
// players). Every submission is stamped with the version it was made under
// and results only count the current version, so old votes stop counting
// without being deleted.
// Last updated: October 5th, 2026
export const DATA_VERSION = "2026-27-v2";

// Every list must protect exactly this many players.
export const PROTECT_COUNT = 8;

// Below this many lists, results are too easy for one person to skew, so
// the stats response flags them as not ready to show yet.
export const MIN_LISTS = 5;
