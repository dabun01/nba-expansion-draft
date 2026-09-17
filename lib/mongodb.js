// lib/mongodb.js
// Shared connection helper. Serverless functions can be invoked many times
// per minute, each a fresh execution — without caching, every request would
// open a brand new MongoDB connection, which is slow and can exhaust your
// cluster's connection limit. Caching the client on `global` lets warm
// function instances reuse the same connection instead of reconnecting.

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

let cachedClient = global._mongoClient;

export async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
    global._mongoClient = cachedClient; // survives across warm invocations
  }
  return cachedClient.db("expansionDraftSim");
}