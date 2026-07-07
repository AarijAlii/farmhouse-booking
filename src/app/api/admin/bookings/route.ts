import { NextResponse } from "next/server";
import { ApiError, handle } from "@/lib/api";
import { expireStalePending } from "@/lib/bookings";
import { requireAdmin, supabaseAdmin } from "@/lib/supabase";
import { decryptPii } from "@/lib/crypto";

const STATUSES = ["pending_payment", "payment_review", "confirmed", "rejected", "cancelled", "expired"];
const SIGNED_URL_SECONDS = 600;

// Admin booking list, filterable by ?status= and ?date=, screenshots as signed URLs.
export const GET = handle(async (req) => {
  await requireAdmin(req);
  await expireStalePending();

  const params = new URL(req.url).searchParams;
  const status = params.get("status");
  const date = params.get("date");
  if (status && !STATUSES.includes(status)) throw new ApiError(400, `Unknown status '${status}'`);

  const db = supabaseAdmin();
  let query = db
    .from("bookings")
    .select("*, payment_proofs (id, storage_path, mime_type, uploaded_at)")
    .order("booking_date", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  if (date) query = query.eq("booking_date", date);

  const { data, error } = await query;
  if (error) throw new ApiError(500, "Could not load bookings");

  const bookings = await Promise.all(
    (data ?? []).map(async (b) => {
      const proofs = await Promise.all(
        (b.payment_proofs ?? []).map(async (p: { id: number; storage_path: string; mime_type: string; uploaded_at: string }) => {
          const { data: signed } = await db.storage
            .from("payment-proofs")
            .createSignedUrl(p.storage_path, SIGNED_URL_SECONDS);
          return { id: p.id, mime_type: p.mime_type, uploaded_at: p.uploaded_at, url: signed?.signedUrl ?? null };
        })
      );
      const rest = { ...b };
      delete rest.payment_proofs;
      return { ...rest, cnic: decryptPii(b.cnic), proofs };
    })
  );

  return NextResponse.json({ bookings });
});
