// api/players.js
// GET /api/players           -> all players
// GET /api/players?teamId=ATL -> only that team's players

import { getDb } from "../lib/mongodb.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = await getDb();
    const { teamId } = req.query;

    // Build the filter conditionally: {} matches everything if no
    // teamId was passed, { teamId: "ATL" } narrows it down if it was.
    const filter = teamId ? { teamId } : {};

    const players = await db.collection("players").find(filter).toArray();
    res.status(200).json(players);
  } catch (err) {
    console.error("Failed to fetch players:", err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
}