import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { getSettings, PUBLIC_SETTING_KEYS } from "@/lib/settings";
import { SLOT_LABELS } from "@/lib/slots";

// Public farm info: slot times, prices, and JazzCash payment details.
export const GET = handle(async () => {
  const settings = await getSettings();
  const publicSettings = Object.fromEntries(
    PUBLIC_SETTING_KEYS.filter((k) => k in settings).map((k) => [k, settings[k]])
  );
  return NextResponse.json({ settings: publicSettings, slot_labels: SLOT_LABELS });
});
