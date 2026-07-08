import { createHmac } from "crypto";
import { ApiError } from "@/lib/api";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";

// Auto cool-down: this many expired/rejected bookings within the window bars
// the phone/CNIC from holding new slots until the strikes age out.
const STRIKE_LIMIT = 2;
const STRIKE_WINDOW_DAYS = 7;

// One-way CNIC fingerprint for equality checks (blocklists, strike counting).
// Keyed HMAC — without the server key, the hash reveals nothing.
export function cnicFingerprint(normalizedCnic: string): string {
  return createHmac("sha256", Buffer.from(env().CNIC_ENCRYPTION_KEY, "hex"))
    .update(`cnic:${normalizedCnic}`)
    .digest("hex");
}

const BLOCKED_MESSAGE =
  "Online booking isn't available for this number right now. Please call us and we'll book you in directly.";

// Owner-managed blocklist (permanent or timed).
export async function assertNotBlocked(phone: string, cnicHash: string): Promise<void> {
  const { data, error } = await supabaseAdmin()
    .from("blocked_customers")
    .select("id, blocked_until")
    .or(`phone.eq.${phone},cnic_hash.eq.${cnicHash}`)
    .limit(10);
  if (error) throw new ApiError(500, "Could not process the booking");
  const now = Date.now();
  const active = (data ?? []).some((b) => !b.blocked_until || new Date(b.blocked_until).getTime() > now);
  if (active) throw new ApiError(403, BLOCKED_MESSAGE);
}

// Stateless cool-down: repeat no-shows can't keep holding slots.
export async function assertNotOnCooldown(phone: string, cnicHash: string): Promise<void> {
  const since = new Date(Date.now() - STRIKE_WINDOW_DAYS * 24 * 3600_000).toISOString();
  const { count, error } = await supabaseAdmin()
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .or(`phone.eq.${phone},cnic_hash.eq.${cnicHash}`)
    .in("status", ["expired", "rejected"])
    .gte("created_at", since);
  if (error) throw new ApiError(500, "Could not process the booking");
  if ((count ?? 0) >= STRIKE_LIMIT) throw new ApiError(403, BLOCKED_MESSAGE);
}

// Strike counts for a set of phones, so the admin panel can warn the owner.
export async function strikeCounts(phones: string[]): Promise<Record<string, number>> {
  if (phones.length === 0) return {};
  const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
  const { data } = await supabaseAdmin()
    .from("bookings")
    .select("phone")
    .in("phone", phones)
    .in("status", ["expired", "rejected"])
    .gte("created_at", since);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.phone] = (counts[row.phone] ?? 0) + 1;
  return counts;
}
