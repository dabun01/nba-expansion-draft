// Player valuation used by the "AI-powered" protection mode and the
// "AI-powered" simulated-expansion-team draft strategy.
//
// production_score: weighted, league-normalized blend of the four stats.
// salary_efficiency: production relative to what the player is paid.
// value_score: blend of both -- a well-paid star and a cheap role player
// can land close together; an overpaid, declining vet should sink.

const STAT_WEIGHTS = { pts: 1.5, reb: 0.9, ast: 0.9, fgPct: 1.0 };

function mean(nums) {
  return nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
}
function stdDev(nums, avg) {
  const variance = mean(nums.map((n) => (n - avg) ** 2));
  return Math.sqrt(variance) || 1;
}

/**
 * Computes production/efficiency/value scores for every player in `players`,
 * normalized against the league averages within that same player list.
 * Returns a Map of playerId -> { productionScore, salaryEfficiency, valueScore }
 */
export function computeValueScores(players) {
  const statKeys = Object.keys(STAT_WEIGHTS);
  const means = {};
  const stds = {};

  for (const key of statKeys) {
    const vals = players.map((p) => p.stats[key]);
    means[key] = mean(vals);
    stds[key] = stdDev(vals, means[key]);
  }

  const capHits = players.map((p) => p.contract.salaryByYear[0]);
  const capMean = mean(capHits);
  const capStd = stdDev(capHits, capMean);

  const scores = new Map();

  for (const p of players) {
    // z-score each stat, weight, and sum -> production_score
    let production = 0;
    for (const key of statKeys) {
      const z = (p.stats[key] - means[key]) / stds[key];
      production += z * STAT_WEIGHTS[key];
    }

    const capHit = p.contract.salaryByYear[0];
    const capZ = (capHit - capMean) / capStd;

    // salary_efficiency: production above/below what their cap hit would predict.
    // A high earner needs high production to avoid a negative efficiency score.
    const salaryEfficiency = production - capZ;

    // value_score: mostly "how good are they," tempered by "are they worth it."
    const valueScore = 0.70 * production + 0.30 * salaryEfficiency;

    scores.set(p.id, {
      productionScore: round(production),
      salaryEfficiency: round(salaryEfficiency),
      valueScore: round(valueScore),
      capHit,
    });
  }

  return scores;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Given a roster of players (full Player objects), returns the ids of the
 * top 8 by value_score -- used by the "AI-powered" protection mode.
 */
export function pickAiProtectedIds(rosterPlayers, protectCount = 8) {
  const scores = computeValueScores(rosterPlayers);
  return [...rosterPlayers]
    .sort((a, b) => scores.get(b.id).valueScore - scores.get(a.id).valueScore)
    .slice(0, protectCount)
    .map((p) => p.id);
}

/**
 * Given a pool of available (unprotected, undrafted) players, returns the
 * single best pick by value_score -- used by the "AI-powered" simulated
 * expansion-team draft strategy.
 */
export function pickAiBestAvailable(availablePlayers) {
  if (availablePlayers.length === 0) return null;
  const scores = computeValueScores(availablePlayers);
  return [...availablePlayers].sort(
    (a, b) => scores.get(b.id).valueScore - scores.get(a.id).valueScore
  )[0];
}
