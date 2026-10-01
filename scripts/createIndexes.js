// createIndexes.js
// Creates the indexes the GM submission routes rely on. Safe to re-run:
// createIndex does nothing if an identical index already exists.
// Run with: npm run data:indexes

import { MongoClient } from "mongodb";
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_URI);

async function createIndexes() {
  try {
    await client.connect();
    const submissions = client
      .db("expansionDraftSim")
      .collection("submissions");

    // One list per fan, per team, per roster version. "unique" makes Mongo
    // itself reject a second document with the same three values, so even
    // two requests arriving at the same instant can't create a duplicate
    // vote. The submit route's upsert relies on this.
    await submissions.createIndex(
      { clientId: 1, teamId: 1, dataVersion: 1 },
      { unique: true, name: "one_list_per_client_team_version" },
    );

    // The stats route filters by team + version. Without an index Mongo
    // would read every submission for every team to find them.
    await submissions.createIndex(
      { teamId: 1, dataVersion: 1 },
      { name: "by_team_version" },
    );

    // Rate-limit counters (lib/rateLimit.js) carry an expiresAt date. A TTL
    // index with expireAfterSeconds: 0 tells Mongo to delete each document
    // once that date passes, so old windows clean themselves up. Mongo's
    // cleanup runs about once a minute, so deletion isn't instant.
    const rateLimits = client.db("expansionDraftSim").collection("rateLimits");
    await rateLimits.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "expire_old_windows" },
    );
    console.log("✅ TTL index ready on rateLimits.expiresAt");

    console.log("✅ Indexes ready on submissions:");
    for (const idx of await submissions.indexes()) {
      console.log(
        `  ${idx.name}  ${JSON.stringify(idx.key)}${idx.unique ? "  (unique)" : ""}`,
      );
    }
  } catch (err) {
    console.error("❌ Creating indexes failed:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

createIndexes();
