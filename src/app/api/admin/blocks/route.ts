import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handle, readJson } from "@/lib/api";
import { SLOTS, isValidDateString } from "@/lib/slots";
import { requireAdmin, supabaseAdmin } from "@/lib/supabase";

const bodySchema = z.object({
  date: z.string().refine(isValidDateString, "must be a valid YYYY-MM-DD date"),
  slots: z.array(z.enum(SLOTS)).min(1),
  blocked: z.boolean(),
  reason: z.string().trim().max(200).optional(),
});

// Admin opens or closes slots (maintenance, personal use). Blocking does not
// touch existing bookings — decide those explicitly via confirm/reject/cancel.
export const POST = handle(async (req) => {
  await requireAdmin(req);
  const body = bodySchema.parse(await readJson(req));
  const db = supabaseAdmin();

  if (body.blocked) {
    const rows = body.slots.map((slot) => ({
      block_date: body.date,
      slot,
      reason: body.reason ?? null,
    }));
    const { error } = await db.from("slot_blocks").upsert(rows);
    if (error) throw new ApiError(500, "Could not block the slots");
  } else {
    const { error } = await db
      .from("slot_blocks")
      .delete()
      .eq("block_date", body.date)
      .in("slot", body.slots);
    if (error) throw new ApiError(500, "Could not unblock the slots");
  }

  return NextResponse.json({ date: body.date, slots: body.slots, blocked: body.blocked });
});
