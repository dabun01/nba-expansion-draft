// api/protection-stats.js
// GET /api/protection-stats?teamId=ATL
//
// How the community protected one team: for each player on the roster, how
// many submitted lists protected them and what percentage that is.
//
// Response:
// { teamId, totalLists, enoughData, minimumLists,
//   players: [{ playerId, count, pct }] }   // sorted, most protected first

import { getDb } from "../lib/mongodb.js";
import { DATA_VERSION, MIN_LISTS } from "../lib/gmConfig.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const teamId = String(req.query.teamId ?? "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(teamId)) {
    return res.status(400).json({ error: "teamId must be a 3-letter team code like ATL" });
  }

  try {
    const db = await getDb();

    const team = await db.collection("teams").findOne({ id: teamId });
    if (!team) {
      return res.status(404).json({ error: `Unknown team: ${teamId}` });
    }

    // An aggregation is a pipeline: each stage transforms the documents
    // coming out of the previous one, all inside the database.
    //   $match  keep only this team's lists for the current roster version
    //   $facet  run two sub-pipelines over those same lists at once:
    //     total    count the lists
    //     players  $unwind turns one list of 8 ids into 8 documents with one
    //              id each, then $group counts how many times each id appears
    const [result] = await db
      .collection("submissions")
      .aggregate([
        { $match: { teamId, dataVersion: DATA_VERSION } },
        {
          $facet: {
            total: [{ $count: "n" }],
            players: [
              { $unwind: "$playerIds" },
              { $group: { _id: "$playerIds", count: { $sum: 1 } } },
            ],
          },
        },
      ])
      .toArray();

    const totalLists = result.total[0]?.n ?? 0;
    const countById = new Map(result.players.map((p) => [p._id, p.count]));

    // Start from the roster, not from the counts, so players nobody
    // protected still appear with 0%.
    const players = team.playerIds
      .map((playerId) => {
        const count = countById.get(playerId) ?? 0;
        const pct = totalLists ? Math.round((count / totalLists) * 1000) / 10 : 0;
        return { playerId, count, pct };
      })
      .sort((a, b) => b.count - a.count);

    // Let Vercel's CDN serve this response for 60 seconds, then keep serving
    // the old copy for up to 5 more minutes while it fetches a fresh one in
    // the background. However many fans open the page, Mongo runs this
    // query about once a minute per team.
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    return res.status(200).json({
      teamId,
      totalLists,
      enoughData: totalLists >= MIN_LISTS,
      minimumLists: MIN_LISTS,
      players,
    });
  } catch (err) {
    console.error("Failed to compute protection stats:", err);
    return res.status(500).json({ error: "Failed to compute protection stats" });
  }
}
