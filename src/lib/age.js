// Players store a birthDate ("YYYY-MM-DD") rather than an age, since a birth
// date never goes stale. Age is derived here at render time.

/**
 * Whole years between `birthDate` and `asOf` (defaults to today), or null if
 * the player has no birthDate yet.
 */
export function getAge(birthDate, asOf = new Date()) {
  if (!birthDate) return null;
  // Parse the parts directly: new Date("YYYY-MM-DD") is UTC midnight, which
  // can land on the previous day in US time zones and make birthdays off by one.
  const [y, m, d] = birthDate.split("-").map(Number);
  let age = asOf.getFullYear() - y;
  const month = asOf.getMonth() + 1;
  if (month < m || (month === m && asOf.getDate() < d)) age--;
  return age;
}
