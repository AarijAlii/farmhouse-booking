import { ApiError } from "@/lib/api";

// Fixed-window in-memory rate limiter. Serverless caveat: each warm instance
// has its own counters, so this is best-effort abuse damping, not a hard
// guarantee — the hard guarantees (unique slot index, per-phone caps, proof
// caps) live in the database. Swap for Upstash Redis if traffic ever demands it.
const windows = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 10_000;

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

export function rateLimit(bucket: string, key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const mapKey = `${bucket}:${key}`;

  if (windows.size > MAX_KEYS) {
    for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    if (windows.size > MAX_KEYS) windows.clear();
  }

  const entry = windows.get(mapKey);
  if (!entry || entry.resetAt <= now) {
    windows.set(mapKey, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > limit) {
    throw new ApiError(429, "Too many requests. Please wait a bit and try again.");
  }
}
