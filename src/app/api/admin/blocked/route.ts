import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handle, readJson } from "@/lib/api";
import { normalizePhone } from "@/lib/bookings";
import { requireAdmin, supabaseAdmin } from "@/lib/supabase";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  const { data, error } = await supabaseAdmin()
    .from("blocked_customers")
    .select("id, phone, reason, blocked_until, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new ApiError(500, "Could not load blocked customers");
  return NextResponse.json({ blocked: data });
});

const createSchema = z
  .object({
    booking_id: z.number().int().positive().optional(),
    phone: z.string().trim().min(10).max(16).optional(),
    reason: z.string().trim().max(200).optional(),
  })
  .strict()
  .refine((v) => v.booking_id || v.phone, "Provide a booking_id or a phone number");

// Block by booking (covers phone + CNIC fingerprint) or by raw phone number.
export const POST = handle(async (req) => {
  await requireAdmin(req);
  const body = createSchema.parse(await readJson(req));
  const db = supabaseAdmin();

  let phone: string | null = null;
  let cnicHash: string | null = null;

  if (body.booking_id) {
    const { data, error } = await db
      .from("bookings")
      .select("phone, cnic_hash")
      .eq("id", body.booking_id)
      .maybeSingle();
    if (error || !data) throw new ApiError(404, "Booking not found");
    phone = data.phone;
    cnicHash = data.cnic_hash;
  } else if (body.phone) {
    phone = normalizePhone(body.phone);
  }

  const { data, error } = await db
    .from("blocked_customers")
    .insert({ phone, cnic_hash: cnicHash, reason: body.reason ?? null })
    .select("id, phone, reason, blocked_until, created_at")
    .single();
  if (error) throw new ApiError(500, "Could not block the customer");
  return NextResponse.json({ blocked: data }, { status: 201 });
});

const deleteSchema = z.object({ id: z.number().int().positive() }).strict();

export const DELETE = handle(async (req) => {
  await requireAdmin(req);
  const body = deleteSchema.parse(await readJson(req));
  const { error } = await supabaseAdmin().from("blocked_customers").delete().eq("id", body.id);
  if (error) throw new ApiError(500, "Could not unblock the customer");
  return NextResponse.json({ ok: true });
});
