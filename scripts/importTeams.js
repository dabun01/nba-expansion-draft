// importTeams.js
// One-time (or re-runnable) script to load teams.json into MongoDB Atlas.
// Run with: node importTeams.js

import { MongoClient } from "mongodb";
import fs from "fs";
import "dotenv/config";

const uri = process.env.MONGODB_URI; // pulled from .env, never hardcode this
const client = new MongoClient(uri);

async function importData() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");

    const db = client.db("expansionDraftSim"); // db is created automatically on first write
    const teamsCollection = db.collection("teams");
    const playersCollection = db.collection("players");
    const configCollection = db.collection("config");

    const raw = fs.readFileSync("./teams.json", "utf-8");
    const data = JSON.parse(raw); // { salaryCapTotal, teams: [...], players: [...] }

    // Wipe existing data first so re-running this script doesn't create duplicates
    await teamsCollection.deleteMany({});
    await playersCollection.deleteMany({});
    await configCollection.deleteMany({});

    // Teams and players both already carry their own app-level "id"
    // (e.g. team.id = "ATL", player.teamId = "ATL"), so no ID-resolution
    // is needed — just insert each collection as-is. That shared string
    // id is what you'll use to join them in queries later (e.g.
    // playersCollection.find({ teamId: "ATL" })).
    await teamsCollection.insertMany(data.teams);
    console.log(`Imported ${data.teams.length} teams`);

    await playersCollection.insertMany(data.players);
    console.log(`Imported ${data.players.length} players`);

    // salaryCapTotal is a league-wide constant, not tied to any one team,
    // so it gets its own small config collection rather than being
    // duplicated onto every team document.
    await configCollection.insertOne({
      key: "salaryCapTotal",
      value: data.salaryCapTotal,
    });
    console.log(`Stored salaryCapTotal: ${data.salaryCapTotal}`);

    console.log("✅ Import complete.");
  } catch (err) {
    console.error("❌ Import failed:", err);
  } finally {
    await client.close();
  }
}

importData();