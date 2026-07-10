import { ApiError } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase";

// Keys the public settings endpoint may expose (no secrets live in settings today,
// but the allowlist keeps future additions private by default).
export const PUBLIC_SETTING_KEYS = [
  "price_morning_pkr",
  "price_afternoon_pkr",
  "price_evening_pkr",
  "price_morning_weekend_pkr",
  "price_afternoon_weekend_pkr",
  "price_evening_weekend_pkr",
  "price_two_slots_pkr",
  "price_two_slots_weekend_pkr",
  "price_full_day_pkr",
  "price_full_day_weekend_pkr",
  "addon_bonfire_pkr",
  "addon_room_pkr",
  "food_menu",
  "jazzcash_name",
  "jazzcash_number",
  "payment_instructions",
] as const;

export const ALL_SETTING_KEYS = [...PUBLIC_SETTING_KEYS, "pending_payment_hours"] as const;
export type SettingKey = (typeof ALL_SETTING_KEYS)[number];

export async function getSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabaseAdmin().from("settings").select("key, value");
  if (error) throw new ApiError(500, "Could not load settings");
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

export function pendingPaymentHours(settings: Record<string, string>): number {
  const hours = Number(settings["pending_payment_hours"]);
  return Number.isFinite(hours) && hours > 0 ? hours : 1;
}

export function paymentInfo(settings: Record<string, string>) {
  return {
    jazzcash_name: settings["jazzcash_name"] ?? "",
    jazzcash_number: settings["jazzcash_number"] ?? "",
    instructions: settings["payment_instructions"] ?? "",
  };
}
