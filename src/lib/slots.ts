export const SLOTS = ["morning", "afternoon", "evening"] as const;
export type Slot = (typeof SLOTS)[number];

// Farm hours in Pakistan time (UTC+5, no DST). No slot from 12am to 6am.
export const SLOT_HOURS: Record<Slot, { start: number; end: number }> = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 18 },
  evening: { start: 18, end: 24 },
};

export const SLOT_LABELS: Record<Slot, string> = {
  morning: "6:00 am – 12:00 pm",
  afternoon: "12:00 pm – 6:00 pm",
  evening: "6:00 pm – 12:00 am",
};

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

// Current date string (YYYY-MM-DD) in Pakistan time.
export function todayPkt(now: Date = new Date()): string {
  return new Date(now.getTime() + PKT_OFFSET_MS).toISOString().slice(0, 10);
}

// Absolute end time of a slot on a given date.
export function slotEnd(date: string, slot: Slot): Date {
  const { end } = SLOT_HOURS[slot];
  if (end === 24) {
    const next = new Date(`${date}T00:00:00+05:00`);
    next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }
  return new Date(`${date}T${String(end).padStart(2, "0")}:00:00+05:00`);
}

// A slot is bookable until it ends.
export function slotIsPast(date: string, slot: Slot, now: Date = new Date()): boolean {
  return slotEnd(date, slot).getTime() <= now.getTime();
}

// Bookable slot combinations: single slots, consecutive pairs, or the full day.
export const SLOT_COMBOS: readonly Slot[][] = [
  ["morning"],
  ["afternoon"],
  ["evening"],
  ["morning", "afternoon"],
  ["afternoon", "evening"],
  ["morning", "afternoon", "evening"],
];

// Sorts into canonical slot order; returns null if the combination isn't offered.
export function normalizeSlots(slots: Slot[]): Slot[] | null {
  const sorted = [...new Set(slots)].sort((a, b) => SLOTS.indexOf(a) - SLOTS.indexOf(b));
  const match = SLOT_COMBOS.find((c) => c.length === sorted.length && c.every((s, i) => s === sorted[i]));
  return match ? sorted : null;
}

export function slotsLabel(slots: Slot[]): string {
  if (slots.length === 3) return "Full day";
  return slots.map((s) => s[0].toUpperCase() + s.slice(1)).join(" + ");
}

export function isValidDateString(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}
