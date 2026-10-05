// api/teams.js
// Vercel turns this file into the route GET /api/teams automatically —
// no router setup needed, the file path IS the URL path.

import { getDb } from "../lib/mongodb.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = await getDb();
    // Without .sort(), Mongo returns documents in "natural" storage order,
    // which isn't guaranteed and can change over time. Sort explicitly so
    // the sidebar is always alphabetical.
    const teams = await db
      .collection("teams")
      .find({})
      .sort({ name: 1 })
      .toArray();
    res.status(200).json(teams);
  } catch (err) {
    console.error("Failed to fetch teams:", err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
}