import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handle, readJson } from "@/lib/api";
import { SLOTS, isValidDateString } from "@/lib/slots";
import { requireAdmin, supabaseAdmin } from "@/lib/supabase";

// Special prices for individual dates (Eid, public holidays, ...).

export const GET = handle(async (req) => {
  await requireAdmin(req);
  const month = new URL(req.url).searchParams.get("month") ?? "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new ApiError(400, "Query param 'month' must look like 2026-07");
  }
  const { data, error } = await supabaseAdmin()
    .from("price_overrides")
    .select("price_date, slot, price_pkr")
    .gte("price_date", `${month}-01`)
    .lte("price_date", `${month}-31`);
  if (error) throw new ApiError(500, "Could not load special prices");
  return NextResponse.json({ overrides: data });
});

const bodySchema = z
  .object({
    date: z.string().refine(isValidDateString, "must be a valid YYYY-MM-DD date"),
    slot: z.enum(SLOTS),
    // null clears the special price back to weekend/base pricing
    price_pkr: z.number().int().min(1).max(10_000_000).nullable(),
  })
  .strict();

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const body = bodySchema.parse(await readJson(req));
  const db = supabaseAdmin();

  if (body.price_pkr === null) {
    const { error } = await db
      .from("price_overrides")
      .delete()
      .eq("price_date", body.date)
      .eq("slot", body.slot);
    if (error) throw new ApiError(500, "Could not clear the special price");
  } else {
    const { error } = await db
      .from("price_overrides")
      .upsert({ price_date: body.date, slot: body.slot, price_pkr: body.price_pkr });
    if (error) throw new ApiError(500, "Could not save the special price");
  }

  return NextResponse.json({ date: body.date, slot: body.slot, price_pkr: body.price_pkr });
});
