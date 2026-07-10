import { ApiError } from "@/lib/api";

// Optional extras a customer can add to a booking: fixed add-ons (bonfire,
// private rest room) and homemade food items from the owner-editable menu.
// Prices are snapshotted onto the booking so later menu edits don't change
// what an existing booking owes.

export const ADDONS = [
  { id: "bonfire", label: "Bonfire (40 kg wood)", settingKey: "addon_bonfire_pkr" },
  { id: "room", label: "Private room (resting & changing)", settingKey: "addon_room_pkr" },
] as const;

export type AddonId = (typeof ADDONS)[number]["id"];

export interface FoodMenuItem {
  id: string;
  name: string;
  price_pkr: number;
}

export interface ExtrasSnapshot {
  addons: { id: string; name: string; price_pkr: number }[];
  food: { id: string; name: string; price_pkr: number; qty: number }[];
  total_pkr: number;
}

export function parseFoodMenu(settings: Record<string, string>): FoodMenuItem[] {
  try {
    const raw = JSON.parse(settings["food_menu"] ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (i) =>
          i &&
          typeof i.id === "string" &&
          typeof i.name === "string" &&
          Number.isFinite(Number(i.price_pkr)) &&
          Number(i.price_pkr) > 0
      )
      .slice(0, 30)
      .map((i) => ({ id: i.id, name: String(i.name).slice(0, 80), price_pkr: Math.round(Number(i.price_pkr)) }));
  } catch {
    return [];
  }
}

// Validates the requested extras against current settings and returns a
// priced snapshot. Throws 400 on unknown ids.
export function buildExtras(
  settings: Record<string, string>,
  addonIds: string[],
  food: { id: string; qty: number }[]
): ExtrasSnapshot {
  const addons = addonIds.map((id) => {
    const def = ADDONS.find((a) => a.id === id);
    if (!def) throw new ApiError(400, `Unknown add-on '${id}'`);
    const price = Math.round(Number(settings[def.settingKey]));
    if (!Number.isFinite(price) || price <= 0) throw new ApiError(500, `Add-on '${id}' is not configured`);
    return { id: def.id, name: def.label, price_pkr: price };
  });

  const menu = parseFoodMenu(settings);
  const foodItems = food.map(({ id, qty }) => {
    const item = menu.find((m) => m.id === id);
    if (!item) throw new ApiError(400, `Unknown food item '${id}'`);
    return { id: item.id, name: item.name, price_pkr: item.price_pkr, qty };
  });

  const total =
    addons.reduce((s, a) => s + a.price_pkr, 0) + foodItems.reduce((s, f) => s + f.price_pkr * f.qty, 0);

  return { addons, food: foodItems, total_pkr: total };
}
