import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handle, readJson } from "@/lib/api";
import { expireStalePending, newRef, normalizePhone, publicBooking, type Booking } from "@/lib/bookings";
import { SLOTS, isValidDateString, slotIsPast, todayPkt } from "@/lib/slots";
import { getSettings, paymentInfo, pendingPaymentHours, slotPricePkr } from "@/lib/settings";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_DAYS_AHEAD = 90;

const bodySchema = z.object({
  booking_date: z.string().refine(isValidDateString, "must be a valid YYYY-MM-DD date"),
  slot: z.enum(SLOTS),
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(16),
  guests: z.number().int().min(1).max(100).optional(),
});

export const POST = handle(async (req) => {
  const body = bodySchema.parse(await readJson(req));
  const phone = normalizePhone(body.phone);

  if (slotIsPast(body.booking_date, body.slot)) {
    throw new ApiError(400, "That slot is already in the past");
  }
  const horizon = new Date(`${todayPkt()}T00:00:00+05:00`);
  horizon.setUTCDate(horizon.getUTCDate() + MAX_DAYS_AHEAD);
  if (new Date(`${body.booking_date}T00:00:00+05:00`) > horizon) {
    throw new ApiError(400, `Bookings open up to ${MAX_DAYS_AHEAD} days in advance`);
  }

  const db = supabaseAdmin();

  const { data: block } = await db
    .from("slot_blocks")
    .select("slot")
    .eq("block_date", body.booking_date)
    .eq("slot", body.slot)
    .maybeSingle();
  if (block) throw new ApiError(409, "That slot is not available for booking");

  // Cap slot-holding abuse: one active pending booking per phone number.
  await expireStalePending();
  const { count: pendingCount } = await db
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .eq("status", "pending_payment");
  if ((pendingCount ?? 0) >= 1) {
    throw new ApiError(429, "You already have a booking awaiting payment. Complete or wait for it to expire first.");
  }

  const settings = await getSettings();
  const amount = slotPricePkr(settings, body.slot);
  const expiresAt = new Date(Date.now() + pendingPaymentHours(settings) * 3600_000).toISOString();

  const { data, error } = await db
    .from("bookings")
    .insert({
      ref: newRef(),
      booking_date: body.booking_date,
      slot: body.slot,
      customer_name: body.customer_name,
      phone,
      guests: body.guests ?? null,
      status: "pending_payment",
      amount_pkr: amount,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error) {
    // 23505 = unique violation on the partial index: someone else holds the slot.
    if (error.code === "23505") throw new ApiError(409, "Sorry, that slot was just taken. Please pick another.");
    throw new ApiError(500, "Could not create the booking");
  }

  return NextResponse.json(
    { booking: publicBooking(data as Booking), payment: paymentInfo(settings) },
    { status: 201 }
  );
});
