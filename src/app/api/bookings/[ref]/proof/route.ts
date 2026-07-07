import { NextResponse } from "next/server";
import { ApiError, handle } from "@/lib/api";
import { findByRefAndPhone, normalizePhone } from "@/lib/bookings";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Customer uploads the JazzCash payment screenshot (multipart/form-data:
// fields `phone` and `file`). Moves the booking to payment_review.
export const POST = handle(async (req, ctx: { params: Promise<{ ref: string }> }) => {
  const { ref } = await ctx.params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "Expected multipart/form-data with 'phone' and 'file' fields");
  }

  const rawPhone = form.get("phone");
  const file = form.get("file");
  if (typeof rawPhone !== "string") throw new ApiError(400, "Field 'phone' is required");
  if (!(file instanceof File)) throw new ApiError(400, "Field 'file' must be an image");

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new ApiError(400, "Screenshot must be a JPEG, PNG, or WebP image");
  if (file.size === 0) throw new ApiError(400, "Uploaded file is empty");
  if (file.size > MAX_BYTES) throw new ApiError(400, "Screenshot must be 5 MB or smaller");

  const phone = normalizePhone(rawPhone);
  const booking = await findByRefAndPhone(ref, phone);

  // Allow re-upload while under review (e.g. blurry first screenshot).
  if (booking.status !== "pending_payment" && booking.status !== "payment_review") {
    throw new ApiError(409, `This booking is ${booking.status.replace("_", " ")} and cannot accept payment proof`);
  }

  const db = supabaseAdmin();
  const path = `${booking.ref}/${Date.now()}.${ext}`;
  const { error: uploadError } = await db.storage
    .from("payment-proofs")
    .upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (uploadError) throw new ApiError(500, "Could not store the screenshot, please try again");

  const { error: insertError } = await db
    .from("payment_proofs")
    .insert({ booking_id: booking.id, storage_path: path, mime_type: file.type });
  if (insertError) throw new ApiError(500, "Could not record the screenshot, please try again");

  // Clear the payment deadline: the customer has paid and is now waiting on us.
  const { error: updateError } = await db
    .from("bookings")
    .update({ status: "payment_review", expires_at: null })
    .eq("id", booking.id)
    .in("status", ["pending_payment", "payment_review"]);
  if (updateError) throw new ApiError(500, "Could not update the booking status");

  return NextResponse.json({ ref: booking.ref, status: "payment_review" });
});
