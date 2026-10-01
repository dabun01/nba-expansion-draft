// Browser-side calls to the GM community API routes. Each throws an Error
// carrying the server's message on failure, so callers can show it as-is.

async function request(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error(
      "Couldn't reach the server. Check your connection and try again.",
    );
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

/** Saves (or replaces) this browser's protection list for one team. */
export function submitList({ teamId, playerIds, clientId }) {
  return request("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamId, playerIds, clientId }),
  });
}

/** Community protection percentages for one team. */
export function fetchProtectionStats(teamId, { signal } = {}) {
  return request(`/api/protection-stats?teamId=${encodeURIComponent(teamId)}`, {
    signal,
  });
}
