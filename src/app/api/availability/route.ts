import { NextResponse } from "next/server";
import { ApiError, handle } from "@/lib/api";
import { expireStalePending } from "@/lib/bookings";
import { SLOTS, type Slot, slotIsPast } from "@/lib/slots";
import { supabaseAdmin } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { fetchOverrides, packagePricesForDate, pricesForDate } from "@/lib/pricing";

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
  // slot_holds is the physical truth of occupancy (multi-slot bookings hold
  // one row per slot), maintained by a database trigger.
  const [holds, blocks, settings, overrides] = await Promise.all([
    db.from("slot_holds").select("booking_date, slot").gte("booking_date", first).lte("booking_date", last),
    db.from("slot_blocks").select("block_date, slot").gte("block_date", first).lte("block_date", last),
    getSettings(),
    fetchOverrides(first, last),
  ]);
  if (holds.error || blocks.error) throw new ApiError(500, "Could not load availability");

  const booked = new Set(holds.data.map((b) => `${b.booking_date}|${b.slot}`));
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
    return {
      date,
      slots,
      prices: pricesForDate(settings, overrides, date),
      package_prices: packagePricesForDate(settings, overrides, date),
    };
  });

  return NextResponse.json(
    { month, days },
    // Tiny edge cache: keeps a burst of visitors from hammering the database
    // while staying fresh enough for a booking calendar.
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } }
  );
});
