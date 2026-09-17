import { getDb } from "../lib/mongodb.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = await getDb();
    const rows = await db.collection("config").find({}).toArray();

    const config = Object.fromEntries(
      rows.map((row) => [row.key, row.value]),
    );

    return res.status(200).json(config);
  } catch (error) {
    console.error("Failed to fetch config:", error);
    return res.status(500).json({ error: "Failed to fetch config" });
  }
}