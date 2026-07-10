import { randomBytes } from "crypto";
import { ApiError } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase";
import type { Slot } from "@/lib/slots";
import type { ExtrasSnapshot } from "@/lib/extras";

export const ACTIVE_STATUSES = ["pending_payment", "payment_review", "confirmed"] as const;

export interface Booking {
  id: number;
  ref: string;
  booking_date: string;
  slot: Slot;
  slots: Slot[] | null;
  extras: Partial<ExtrasSnapshot> | null;
  policies_accepted_at: string | null;
  customer_name: string;
  phone: string;
  adults: number;
  children: number;
  cnic: string;
  status: string;
  amount_pkr: number | null;
  expires_at: string | null;
  admin_note: string | null;
  created_at: string;
}

// Unambiguous alphabet (no 0/O, 1/I) for customer-facing reference codes.
const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function newRef(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const b of bytes) code += REF_ALPHABET[b % REF_ALPHABET.length];
  return `FH-${code}`;
}

// Normalize Pakistani mobile numbers to local 03XXXXXXXXX form.
export function normalizePhone(input: string): string {
  const digits = input.replace(/[\s-]/g, "");
  const m = digits.match(/^(?:\+?92|0)(3\d{9})$/);
  if (!m) throw new ApiError(400, "Phone must be a Pakistani mobile number, e.g. 03001234567");
  return `0${m[1]}`;
}

// Normalize CNIC to the canonical #####-#######-# form. Sensitive PII —
// stored for the owner's records only, never returned by public endpoints.
export function normalizeCnic(input: string): string {
  const m = input.replace(/[\s]/g, "").match(/^(\d{5})-?(\d{7})-?(\d)$/);
  if (!m) throw new ApiError(400, "CNIC must be 13 digits, e.g. 12345-1234567-1");
  return `${m[1]}-${m[2]}-${m[3]}`;
}

// Lazy expiry: release slots held by pending bookings whose payment window has passed.
// Called before availability reads and booking inserts, so no cron job is needed.
export async function expireStalePending(date?: string): Promise<void> {
  let query = supabaseAdmin()
    .from("bookings")
    .update({ status: "expired" })
    .eq("status", "pending_payment")
    .lt("expires_at", new Date().toISOString());
  if (date) query = query.eq("booking_date", date);
  const { error } = await query;
  if (error) throw new ApiError(500, "Could not refresh slot availability");
}

export async function findByRefAndPhone(ref: string, phone: string): Promise<Booking> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("*")
    .eq("ref", ref.toUpperCase())
    .eq("phone", phone)
    .maybeSingle();
  if (error) throw new ApiError(500, "Could not look up booking");
  if (!data) throw new ApiError(404, "No booking found for that reference and phone number");
  return data as Booking;
}

// Fields safe to return to the customer. Deliberately excludes cnic and phone.
export function publicBooking(b: Booking) {
  return {
    ref: b.ref,
    booking_date: b.booking_date,
    slot: b.slot,
    slots: b.slots ?? [b.slot],
    extras: b.extras ?? { addons: [], food: [], total_pkr: 0 },
    customer_name: b.customer_name,
    adults: b.adults,
    children: b.children,
    status: b.status,
    amount_pkr: b.amount_pkr,
    expires_at: b.expires_at,
    created_at: b.created_at,
  };
}
