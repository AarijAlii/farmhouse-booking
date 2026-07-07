import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handle, readJson } from "@/lib/api";
import { requireAdmin, supabaseAdmin } from "@/lib/supabase";

const bodySchema = z.object({
  action: z.enum(["confirm", "reject", "cancel"]),
  note: z.string().trim().max(500).optional(),
});

// Which statuses each admin action may act on. Cancel covers a confirmed
// booking the customer backs out of; it releases the slot.
const ALLOWED_FROM: Record<string, string[]> = {
  confirm: ["payment_review"],
  reject: ["payment_review", "pending_payment"],
  cancel: ["confirmed", "payment_review", "pending_payment"],
};
const TARGET: Record<string, string> = {
  confirm: "confirmed",
  reject: "rejected",
  cancel: "cancelled",
};

export const POST = handle(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin(req);
  const { id: rawId } = await ctx.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid booking id");

  const body = bodySchema.parse(await readJson(req));

  // Guarding on current status in the WHERE clause makes the transition atomic —
  // two admins clicking at once can't double-apply.
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .update({
      status: TARGET[body.action],
      admin_note: body.note ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ALLOWED_FROM[body.action])
    .select("*")
    .maybeSingle();

  if (error) throw new ApiError(500, "Could not update the booking");
  if (!data) {
    throw new ApiError(409, `Booking not found or its current status does not allow '${body.action}'`);
  }

  return NextResponse.json({ booking: data });
});
