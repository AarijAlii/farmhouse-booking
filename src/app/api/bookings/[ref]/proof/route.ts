import { NextResponse } from "next/server";
import { ApiError, handle } from "@/lib/api";
import { findByRefAndPhone, normalizePhone } from "@/lib/bookings";
import { supabaseAdmin } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PROOFS_PER_BOOKING = 3;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Verify the file really is the image type it claims — a renamed executable or
// HTML file must not land in the bucket, whatever its Content-Type header says.
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

// Customer uploads the JazzCash payment screenshot (multipart/form-data:
// fields `phone` and `file`). Moves the booking to payment_review.
export const POST = handle(async (req, ctx: { params: Promise<{ ref: string }> }) => {
  rateLimit("upload-proof", clientIp(req), 15, 60 * 60 * 1000);

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

  if (!ALLOWED_TYPES[file.type]) throw new ApiError(400, "Screenshot must be a JPEG, PNG, or WebP image");
  if (file.size === 0) throw new ApiError(400, "Uploaded file is empty");
  if (file.size > MAX_BYTES) throw new ApiError(400, "Screenshot must be 5 MB or smaller");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const realType = sniffImageType(bytes);
  if (!realType) throw new ApiError(400, "File does not look like a valid image");
  const ext = ALLOWED_TYPES[realType];

  const phone = normalizePhone(rawPhone);
  const booking = await findByRefAndPhone(ref, phone);

  // Allow re-upload while under review (e.g. blurry first screenshot).
  if (booking.status !== "pending_payment" && booking.status !== "payment_review") {
    throw new ApiError(409, `This booking is ${booking.status.replace("_", " ")} and cannot accept payment proof`);
  }

  const db = supabaseAdmin();

  const { count: proofCount } = await db
    .from("payment_proofs")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", booking.id);
  if ((proofCount ?? 0) >= MAX_PROOFS_PER_BOOKING) {
    throw new ApiError(429, "Upload limit reached for this booking. Please contact us if your screenshot needs replacing.");
  }

  const path = `${booking.ref}/${Date.now()}.${ext}`;
  const { error: uploadError } = await db.storage
    .from("payment-proofs")
    .upload(path, bytes, { contentType: realType });
  if (uploadError) throw new ApiError(500, "Could not store the screenshot, please try again");

  const { error: insertError } = await db
    .from("payment_proofs")
    .insert({ booking_id: booking.id, storage_path: path, mime_type: realType });
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
