import { ApiError } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase";
import type { Slot } from "@/lib/slots";
import { SLOTS } from "@/lib/slots";

// Price resolution, highest priority first:
//   1. per-date override (price_overrides table)
//   2. weekend price (Saturday/Sunday, from settings)
//   3. base price (settings)

export function isWeekend(date: string): boolean {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  return dow === 0 || dow === 6;
}

function settingPrice(settings: Record<string, string>, key: string): number | null {
  const n = Number(settings[key]);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export function resolvePrice(
  settings: Record<string, string>,
  overrides: Map<string, number>,
  date: string,
  slot: Slot
): number {
  const override = overrides.get(`${date}|${slot}`);
  if (override) return override;
  if (isWeekend(date)) {
    const weekend = settingPrice(settings, `price_${slot}_weekend_pkr`);
    if (weekend) return weekend;
  }
  const base = settingPrice(settings, `price_${slot}_pkr`);
  if (!base) throw new ApiError(500, `Price for ${slot} slot is not configured`);
  return base;
}

export async function fetchOverrides(first: string, last: string): Promise<Map<string, number>> {
  const { data, error } = await supabaseAdmin()
    .from("price_overrides")
    .select("price_date, slot, price_pkr")
    .gte("price_date", first)
    .lte("price_date", last);
  if (error) throw new ApiError(500, "Could not load pricing");
  return new Map((data ?? []).map((r) => [`${r.price_date}|${r.slot}`, r.price_pkr]));
}

export function pricesForDate(
  settings: Record<string, string>,
  overrides: Map<string, number>,
  date: string
): Record<Slot, number> {
  const out = {} as Record<Slot, number>;
  for (const slot of SLOTS) out[slot] = resolvePrice(settings, overrides, date, slot);
  return out;
}
