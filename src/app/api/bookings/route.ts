import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handle, readJson } from "@/lib/api";
import {
  expireStalePending,
  newRef,
  normalizeCnic,
  normalizePhone,
  publicBooking,
  type Booking,
} from "@/lib/bookings";
import { SLOTS, isValidDateString, normalizeSlots, slotIsPast, todayPkt } from "@/lib/slots";
import { getSettings, paymentInfo, pendingPaymentHours } from "@/lib/settings";
import { supabaseAdmin } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { encryptPii } from "@/lib/crypto";
import { assertNotBlocked, assertNotOnCooldown, cnicFingerprint } from "@/lib/abuse";
import { fetchOverrides, resolvePackagePrice } from "@/lib/pricing";
import { buildExtras } from "@/lib/extras";

const MAX_DAYS_AHEAD = 90;
const MAX_BOOKINGS_PER_PHONE_PER_DAY = 3;

const bodySchema = z
  .object({
    booking_date: z.string().refine(isValidDateString, "must be a valid YYYY-MM-DD date"),
    slots: z.array(z.enum(SLOTS)).min(1).max(3),
    customer_name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(10).max(16),
    cnic: z.string().trim().min(13).max(15),
    adults: z.number().int().min(1).max(100),
    children: z.number().int().min(0).max(100),
    addons: z.array(z.string().max(30)).max(5).default([]),
    food: z.array(z.object({ id: z.string().max(50), qty: z.number().int().min(1).max(20) }).strict()).max(15).default([]),
    policies_accepted: z.literal(true, { error: "You must accept the farm policies to book" }),
  })
  .strict();

export const POST = handle(async (req) => {
  rateLimit("create-booking", clientIp(req), 10, 60 * 60 * 1000);

  const body = bodySchema.parse(await readJson(req));
  const phone = normalizePhone(body.phone);
  const cnic = normalizeCnic(body.cnic);
  const cnicHash = cnicFingerprint(cnic);

  const slots = normalizeSlots(body.slots);
  if (!slots) {
    throw new ApiError(400, "Slots must be a single slot, two consecutive slots, or the full day");
  }

  // Owner blocklist and repeat-no-show cool-down, before anything else.
  await assertNotBlocked(phone, cnicHash);
  await assertNotOnCooldown(phone, cnicHash);

  if (slots.some((s) => slotIsPast(body.booking_date, s))) {
    throw new ApiError(400, "Part of that booking is already in the past — pick a later slot or date");
  }
  const horizon = new Date(`${todayPkt()}T00:00:00+05:00`);
  horizon.setUTCDate(horizon.getUTCDate() + MAX_DAYS_AHEAD);
  if (new Date(`${body.booking_date}T00:00:00+05:00`) > horizon) {
    throw new ApiError(400, `Bookings open up to ${MAX_DAYS_AHEAD} days in advance`);
  }

  const db = supabaseAdmin();

  const { data: blocks } = await db
    .from("slot_blocks")
    .select("slot")
    .eq("block_date", body.booking_date)
    .in("slot", slots);
  if ((blocks ?? []).length > 0) throw new ApiError(409, "That time is not available for booking");

  await expireStalePending();

  // DB-backed abuse caps (these hold across serverless instances, unlike the
  // in-memory limiter): one pending booking per phone, and a daily cap.
  const [{ count: pendingCount }, { count: dailyCount }] = await Promise.all([
    db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .eq("status", "pending_payment"),
    db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString()),
  ]);
  if ((pendingCount ?? 0) >= 1) {
    throw new ApiError(429, "You already have a booking awaiting payment. Complete or wait for it to expire first.");
  }
  if ((dailyCount ?? 0) >= MAX_BOOKINGS_PER_PHONE_PER_DAY) {
    throw new ApiError(429, "Booking limit reached for this phone number. Please try again tomorrow.");
  }

  const settings = await getSettings();
  const overrides = await fetchOverrides(body.booking_date, body.booking_date);
  const packagePrice = resolvePackagePrice(settings, overrides, body.booking_date, slots);
  const extras = buildExtras(settings, body.addons, body.food);
  const amount = packagePrice + extras.total_pkr;
  const expiresAt = new Date(Date.now() + pendingPaymentHours(settings) * 3600_000).toISOString();

  const { data, error } = await db
    .from("bookings")
    .insert({
      ref: newRef(),
      booking_date: body.booking_date,
      slot: slots[0],
      slots,
      extras,
      policies_accepted_at: new Date().toISOString(),
      customer_name: body.customer_name,
      phone,
      cnic: encryptPii(cnic),
      cnic_hash: cnicHash,
      adults: body.adults,
      children: body.children,
      status: "pending_payment",
      amount_pkr: amount,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error) {
    // 23505 = slot_holds primary key violation: someone else holds a slot.
    if (error.code === "23505") throw new ApiError(409, "Sorry, that time was just taken. Please pick another.");
    throw new ApiError(500, "Could not create the booking");
  }

  return NextResponse.json(
    { booking: publicBooking(data as Booking), payment: paymentInfo(settings) },
    { status: 201 }
  );
});
