import { NextResponse } from "next/server";
import { ApiError, handle } from "@/lib/api";
import { ACTIVE_STATUSES, expireStalePending } from "@/lib/bookings";
import { SLOTS, type Slot, slotIsPast } from "@/lib/slots";
import { supabaseAdmin } from "@/lib/supabase";

type SlotStatus = "available" | "booked" | "blocked" | "past";

export const GET = handle(async (req) => {
  const month = new URL(req.url).searchParams.get("month") ?? "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new ApiError(400, "Query param 'month' must look like 2026-07");
  }

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const first = `${month}-01`;
  const last = `${month}-${String(daysInMonth).padStart(2, "0")}`;

  await expireStalePending();

  const db = supabaseAdmin();
  const [bookings, blocks] = await Promise.all([
    db
      .from("bookings")
      .select("booking_date, slot")
      .gte("booking_date", first)
      .lte("booking_date", last)
      .in("status", [...ACTIVE_STATUSES]),
    db.from("slot_blocks").select("block_date, slot").gte("block_date", first).lte("block_date", last),
  ]);
  if (bookings.error || blocks.error) throw new ApiError(500, "Could not load availability");

  const booked = new Set(bookings.data.map((b) => `${b.booking_date}|${b.slot}`));
  const blocked = new Set(blocks.data.map((b) => `${b.block_date}|${b.slot}`));
  const now = new Date();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, "0")}`;
    const slots = {} as Record<Slot, SlotStatus>;
    for (const slot of SLOTS) {
      if (slotIsPast(date, slot, now)) slots[slot] = "past";
      else if (blocked.has(`${date}|${slot}`)) slots[slot] = "blocked";
      else if (booked.has(`${date}|${slot}`)) slots[slot] = "booked";
      else slots[slot] = "available";
    }
    return { date, slots };
  });

  return NextResponse.json({ month, days });
});
