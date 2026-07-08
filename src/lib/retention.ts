import { supabaseAdmin } from "@/lib/supabase";
import { todayPkt } from "@/lib/slots";

const RETENTION_DAYS = 7;
const BATCH = 200;

// Payment screenshots are kept until 7 days after the booked visit date, then
// deleted (from storage and the proofs table). Booking records are kept —
// only the images go. Runs from the daily cron hit on /api/health.
export async function sweepOldProofs(): Promise<number> {
  const db = supabaseAdmin();
  const cutoffMs = new Date(`${todayPkt()}T00:00:00+05:00`).getTime() - RETENTION_DAYS * 24 * 3600_000;
  const cutoff = new Date(cutoffMs).toISOString().slice(0, 10);

  const { data, error } = await db
    .from("payment_proofs")
    .select("id, storage_path, bookings!inner(booking_date)")
    .lt("bookings.booking_date", cutoff)
    .limit(BATCH);
  if (error || !data || data.length === 0) return 0;

  const { error: storageError } = await db.storage
    .from("payment-proofs")
    .remove(data.map((p) => p.storage_path));
  if (storageError) return 0;

  const { error: deleteError } = await db
    .from("payment_proofs")
    .delete()
    .in("id", data.map((p) => p.id));
  return deleteError ? 0 : data.length;
}
