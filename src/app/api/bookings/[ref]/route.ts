import { NextResponse } from "next/server";
import { ApiError, handle } from "@/lib/api";
import { expireStalePending, findByRefAndPhone, normalizePhone, publicBooking } from "@/lib/bookings";
import { getSettings, paymentInfo } from "@/lib/settings";

// Customer checks their booking with reference code + phone (no accounts needed).
export const GET = handle(async (req, ctx: { params: Promise<{ ref: string }> }) => {
  const { ref } = await ctx.params;
  const rawPhone = new URL(req.url).searchParams.get("phone");
  if (!rawPhone) throw new ApiError(400, "Query param 'phone' is required");
  const phone = normalizePhone(rawPhone);

  await expireStalePending();
  const booking = await findByRefAndPhone(ref, phone);

  const payment =
    booking.status === "pending_payment" || booking.status === "payment_review"
      ? paymentInfo(await getSettings())
      : null;

  return NextResponse.json({ booking: publicBooking(booking), payment });
});
