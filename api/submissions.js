// api/submissions.js
// POST /api/submissions  { teamId, playerIds: [8 ids], clientId }
//
// Saves one fan's protection list for one team. Everything in the request
// comes from the browser, which anyone can fake, so every field is checked
// here against the database before anything is written.

import { getDb } from "../lib/mongodb.js";
import { DATA_VERSION, PROTECT_COUNT } from "../lib/gmConfig.js";

// A real list is ~200 bytes. Anything far bigger is junk or abuse.
const MAX_BODY_BYTES = 2048;

// crypto.randomUUID() (what useGmStore uses) always produces this shape.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Checks the request's shape. Returns an error message, or null if valid.
// Database checks (does the team exist, are these its players) come after.
function validateShape(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Body must be a JSON object";
  }
  const { teamId, playerIds, clientId } = body;

  if (typeof teamId !== "string" || !/^[A-Z]{3}$/.test(teamId)) {
    return "teamId must be a 3-letter team code like ATL";
  }
  if (typeof clientId !== "string" || !UUID_RE.test(clientId)) {
    return "clientId must be a UUID";
  }
  if (!Array.isArray(playerIds) || playerIds.length !== PROTECT_COUNT) {
    return `playerIds must be an array of exactly ${PROTECT_COUNT} ids`;
  }
  if (!playerIds.every((id) => typeof id === "string" && /^\d+$/.test(id))) {
    return "playerIds must be NBA.com player ids (digits only)";
  }
  if (new Set(playerIds).size !== playerIds.length) {
    return "playerIds must not contain duplicates";
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check the size the client declared before reading the body at all.
  if (Number(req.headers["content-length"] ?? 0) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Request body too large" });
  }

  // Vercel parses JSON bodies for us, but reading req.body throws if the
  // JSON is malformed, so that read is guarded too.
  let body;
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: "Body must be valid JSON" });
  }

  const shapeError = validateShape(body);
  if (shapeError) {
    return res.status(400).json({ error: shapeError });
  }
  const { teamId, playerIds, clientId } = body;

  try {
    const db = await getDb();

    const team = await db.collection("teams").findOne({ id: teamId });
    if (!team) {
      return res.status(400).json({ error: `Unknown team: ${teamId}` });
    }

    // Ask the database which of these ids really are on this team, rather
    // than trusting the browser's claim. All 8 must come back.
    const onTeam = await db
      .collection("players")
      .countDocuments({ id: { $in: playerIds }, teamId });
    if (onTeam !== PROTECT_COUNT) {
      return res
        .status(400)
        .json({ error: `All ${PROTECT_COUNT} players must be on the ${team.name} roster` });
    }

    // Upsert = "update the matching document, or insert it if none exists".
    // The filter is the same three fields as the unique index, so a fan who
    // edits their Hawks list replaces their earlier one instead of voting
    // twice. $setOnInsert only applies when a new document is created, so
    // createdAt keeps the original submission time across edits.
    const filter = { clientId, teamId, dataVersion: DATA_VERSION };
    const now = new Date();
    const update = {
      $set: { playerIds, updatedAt: now },
      $setOnInsert: { createdAt: now },
    };

    let result;
    try {
      result = await db.collection("submissions").updateOne(filter, update, { upsert: true });
    } catch (err) {
      // Two identical first-time submits racing each other can both try to
      // insert; the unique index rejects the loser with code 11000. By then
      // the document exists, so retrying turns it into a normal update.
      if (err.code !== 11000) throw err;
      result = await db.collection("submissions").updateOne(filter, update, { upsert: true });
    }

    const created = result.upsertedCount === 1;
    return res.status(created ? 201 : 200).json({ ok: true, created, teamId });
  } catch (err) {
    console.error("Failed to save submission:", err);
    return res.status(500).json({ error: "Failed to save submission" });
  }
}
