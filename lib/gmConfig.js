// lib/gmConfig.js
// Settings shared by the GM community API routes.

// Bump this whenever rosters change (a trade, a reseed with different
// players). Every submission is stamped with the version it was made under
// and results only count the current version, so old votes stop counting
// without being deleted.
export const DATA_VERSION = "2025-26-v1";

// Every list must protect exactly this many players.
export const PROTECT_COUNT = 8;

// Below this many lists, results are too easy for one person to skew, so
// the stats response flags them as not ready to show yet.
export const MIN_LISTS = 10;
