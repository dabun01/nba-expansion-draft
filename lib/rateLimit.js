// lib/rateLimit.js
// Per-IP rate limiting for the API, without storing anyone's IP address.
//
// Each request's IP is turned into a keyed hash (HMAC) using a secret that
// only the server knows, RATE_LIMIT_SALT. The same IP always gives the same
// hash, so it can be counted, but the hash can't be turned back into the IP.
// A plain unkeyed hash wouldn't be enough: there are only ~4 billion IPv4
// addresses, so anyone with the database could hash them all and match.

import { createHmac } from "crypto";

// Vercel sets x-real-ip to the address that actually connected, and
// overwrites any x-real-ip or x-forwarded-for a client tries to send, so
// these can't be spoofed in production. The socket address is the local
// fallback for when neither header is present.
export function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return (
    req.headers["x-real-ip"] ||
    (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "") ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function hashIp(ip) {
  const secret = process.env.RATE_LIMIT_SALT;
  // Fail loudly rather than quietly hashing without a secret.
  if (!secret) throw new Error("Missing RATE_LIMIT_SALT environment variable");
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

/**
 * Counts this request against a fixed time window, e.g. 30 per hour.
 *
 * One small document per IP per window, e.g.
 *   { _id: "submit:<hash>:<window start>", count: 7, expiresAt }
 * $inc with upsert creates it on the first request and adds 1 atomically
 * on every later one, so simultaneous requests can't undercount. A TTL index
 * on expiresAt (see scripts/createIndexes.js) makes Mongo delete old windows
 * by itself.
 *
 * Returns { allowed, retryAfterSeconds }.
 */
export async function checkRateLimit(db, req, { name, limit, windowMs }) {
  const now = Date.now();
  const windowStart = now - (now % windowMs);
  const windowEnd = windowStart + windowMs;

  const doc = await db
    .collection("rateLimits")
    .findOneAndUpdate(
      { _id: `${name}:${hashIp(clientIp(req))}:${windowStart}` },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowEnd) } },
      { upsert: true, returnDocument: "after" },
    );

  return {
    allowed: doc.count <= limit,
    retryAfterSeconds: Math.ceil((windowEnd - now) / 1000),
  };
}
