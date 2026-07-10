import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handle, readJson } from "@/lib/api";
import { ALL_SETTING_KEYS, getSettings } from "@/lib/settings";
import { requireAdmin, supabaseAdmin } from "@/lib/supabase";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  return NextResponse.json({ settings: await getSettings() });
});

const bodySchema = z.object({
  settings: z.record(z.enum(ALL_SETTING_KEYS), z.string().trim().min(1).max(5000)),
});

export const PUT = handle(async (req) => {
  await requireAdmin(req);
  const body = bodySchema.parse(await readJson(req));

  const entries = Object.entries(body.settings);
  if (entries.length === 0) throw new ApiError(400, "No settings provided");

  for (const [key, value] of entries) {
    if (key.startsWith("price_") || key.startsWith("addon_") || key === "pending_payment_hours") {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) throw new ApiError(400, `'${key}' must be a positive number`);
    }
    if (key === "food_menu") {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error();
      } catch {
        throw new ApiError(400, "'food_menu' must be a JSON array of menu items");
      }
    }
  }

  const rows = entries.map(([key, value]) => ({ key, value }));
  const { error } = await supabaseAdmin().from("settings").upsert(rows);
  if (error) throw new ApiError(500, "Could not save settings");

  return NextResponse.json({ settings: await getSettings() });
});
