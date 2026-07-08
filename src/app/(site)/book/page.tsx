"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Copy,
  Loader2,
  PartyPopper,
  Wallet,
} from "lucide-react";
import { SLOT_KEYS, SLOT_META, type SlotKey, formatPkr } from "../site-ui";
import { UploadProof } from "../upload-proof";

type SlotStatus = "available" | "booked" | "blocked" | "past";
type Day = { date: string; slots: Record<SlotKey, SlotStatus> };

interface BookingResult {
  booking: {
    ref: string;
    booking_date: string;
    slot: SlotKey;
    amount_pkr: number;
    expires_at: string | null;
  };
  payment: { jazzcash_name: string; jazzcash_number: string; instructions: string };
}

const STEPS = ["Choose a slot", "Your details", "Pay & upload", "Done"];

function monthString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function StepBar({ current }: { current: number }) {
  return (
    <ol className="mx-auto mb-10 flex max-w-xl items-center gap-2">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 flex-col items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold ${
              i < current
                ? "bg-emerald-900 text-emerald-50"
                : i === current
                  ? "bg-emerald-900 text-emerald-50 ring-4 ring-emerald-900/15"
                  : "bg-stone-200 text-stone-500"
            }`}
          >
            {i < current ? <CircleCheck className="h-4 w-4" /> : i + 1}
          </span>
          <span
            className={`text-center text-[11.5px] font-medium max-sm:hidden ${
              i <= current ? "text-stone-800" : "text-stone-400"
            }`}
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function BookWizard() {
  const params = useSearchParams();
  const preferredSlot = (SLOT_KEYS as readonly string[]).includes(params.get("slot") ?? "")
    ? (params.get("slot") as SlotKey)
    : null;

  const [step, setStep] = useState(0);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [days, setDays] = useState<Day[] | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotKey | null>(preferredSlot);
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState({ name: "", phone: "", cnic: "", adults: "2", children: "0" });
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [copied, setCopied] = useState(false);

  const month = monthString(monthDate);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setSettings(d.settings ?? {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/availability?month=${month}`);
        const data = await res.json();
        if (!cancelled && res.ok) setDays(data.days);
      } catch {
        if (!cancelled) setDays([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, refreshKey]);

  const selectedDay = useMemo(() => days?.find((d) => d.date === date) ?? null, [days, date]);
  const price = slot ? settings[SLOT_META[slot].priceKey] : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !slot) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_date: date,
          slot,
          customer_name: form.name.trim(),
          phone: form.phone.trim(),
          cnic: form.cnic.trim(),
          adults: Number(form.adults),
          children: Number(form.children),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          setSubmitError("Sorry — that slot was just taken by someone else. Please pick another one.");
          setStep(0);
          setSlot(null);
          setRefreshKey((k) => k + 1);
        } else {
          setSubmitError(body.error ?? "Something went wrong. Please try again.");
        }
        setSubmitting(false);
        return;
      }
      setResult(body as BookingResult);
      setStep(2);
    } catch {
      setSubmitError("Could not reach the server. Please check your internet and try again.");
    }
    setSubmitting(false);
  }

  const firstWeekday = new Date(`${month}-01T00:00:00`).getDay();
  const inputClass =
    "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10";

  const deadline = result?.booking.expires_at
    ? new Date(result.booking.expires_at).toLocaleString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        weekday: "short",
        timeZone: "Asia/Karachi",
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl text-stone-900">Book your day at the farm</h1>
        <p className="mt-2 text-[15px] text-stone-500">
          No account needed — it takes about five minutes.
        </p>
      </div>

      <StepBar current={step} />

      {submitError && step === 0 && (
        <p className="mb-6 rounded-2xl bg-amber-50 px-5 py-4 text-[14px] text-amber-800 ring-1 ring-amber-200">
          {submitError}
        </p>
      )}

      {/* Step 1: pick date + slot */}
      {step === 0 && (
        <div className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 ring-1 ring-stone-200 transition-colors hover:bg-stone-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-display text-xl text-stone-900">
              {monthDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </p>
            <button
              onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 ring-1 ring-stone-200 transition-colors hover:bg-stone-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          {days === null ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-800" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map((day) => {
                const openCount = SLOT_KEYS.filter((s) => day.slots[s] === "available").length;
                const disabled = openCount === 0;
                const isSelected = date === day.date;
                return (
                  <button
                    key={day.date}
                    disabled={disabled}
                    onClick={() => setDate(day.date)}
                    className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[14px] transition-all ${
                      isSelected
                        ? "bg-emerald-900 font-semibold text-white shadow-md shadow-emerald-900/20"
                        : disabled
                          ? "cursor-not-allowed text-stone-300"
                          : "text-stone-700 hover:bg-emerald-900/5 hover:ring-1 hover:ring-emerald-900/20"
                    }`}
                  >
                    {Number(day.date.slice(8))}
                    {!disabled && (
                      <span className={`text-[10px] font-medium ${isSelected ? "text-emerald-200" : "text-emerald-700"}`}>
                        {openCount} open
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedDay && (
            <div className="mt-7 border-t border-stone-100 pt-6">
              <p className="text-[14px] font-medium text-stone-600">
                Slots on{" "}
                <span className="font-semibold text-stone-900">
                  {new Date(`${selectedDay.date}T00:00:00+05:00`).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    timeZone: "Asia/Karachi",
                  })}
                </span>
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {SLOT_KEYS.map((key) => {
                  const meta = SLOT_META[key];
                  const st = selectedDay.slots[key];
                  const open = st === "available";
                  const active = slot === key && open;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={key}
                      disabled={!open}
                      onClick={() => setSlot(key)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-emerald-900 bg-emerald-900 text-white shadow-md shadow-emerald-900/20"
                          : open
                            ? "border-stone-200 bg-white hover:border-emerald-800/40"
                            : "cursor-not-allowed border-stone-100 bg-stone-50 opacity-60"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "text-emerald-200" : "text-emerald-800"}`} />
                      <p className={`mt-2.5 text-[15px] font-semibold ${active ? "text-white" : "text-stone-900"}`}>
                        {meta.label}
                      </p>
                      <p className={`text-[12px] ${active ? "text-emerald-200" : "text-stone-400"}`}>{meta.time}</p>
                      <p className={`mt-2 text-[14px] font-semibold ${active ? "text-white" : "text-emerald-900"}`}>
                        {open ? formatPkr(settings[meta.priceKey]) : st === "past" ? "Passed" : "Unavailable"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-7 flex justify-end">
            <button
              disabled={!date || !slot || selectedDay?.slots[slot!] !== "available"}
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-900 px-7 py-3.5 text-[15px] font-medium text-emerald-50 transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: details */}
      {step === 1 && date && slot && (
        <form onSubmit={submit} className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F4F0E6] px-5 py-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-emerald-900" />
              <p className="text-[14.5px] font-medium text-stone-800">
                {new Date(`${date}T00:00:00+05:00`).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "Asia/Karachi",
                })}{" "}
                · {SLOT_META[slot].label} ({SLOT_META[slot].time})
              </p>
            </div>
            <p className="font-display text-lg text-emerald-950">{formatPkr(price)}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[13.5px] font-medium text-stone-700">Your full name</label>
              <input
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="e.g. Ahmed Khan"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-stone-700">Mobile number</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
                placeholder="03XX XXXXXXX"
              />
              <p className="mt-1 text-[12px] text-stone-400">We’ll use this to identify your booking.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-stone-700">CNIC</label>
              <input
                required
                value={form.cnic}
                onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                className={inputClass}
                placeholder="XXXXX-XXXXXXX-X"
              />
              <p className="mt-1 text-[12px] text-stone-400">Kept private and encrypted — owner’s records only.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-stone-700">Adults</label>
              <input
                required
                type="number"
                min={1}
                max={100}
                value={form.adults}
                onChange={(e) => setForm({ ...form, adults: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-stone-700">Children</label>
              <input
                required
                type="number"
                min={0}
                max={100}
                value={form.children}
                onChange={(e) => setForm({ ...form, children: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {submitError && (
            <p className="mt-5 rounded-2xl bg-rose-50 px-5 py-4 text-[14px] text-rose-700 ring-1 ring-rose-200">
              {submitError}
            </p>
          )}

          <div className="mt-7 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-2 text-[14.5px] font-medium text-stone-500 transition-colors hover:text-stone-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-900 px-7 py-3.5 text-[15px] font-medium text-emerald-50 transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-900/50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Reserving your slot..." : "Reserve & continue to payment"}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: pay & upload */}
      {step === 2 && result && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
              Slot reserved — your booking code
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="font-display text-4xl tracking-wide text-stone-900">{result.booking.ref}</p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(result.booking.ref);
                  setCopied(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3.5 py-1.5 text-[13px] font-medium text-stone-600 transition-colors hover:bg-stone-50"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-stone-500">
              Save this code — you’ll use it with your phone number to check your booking anytime.
              {deadline && (
                <>
                  {" "}
                  Please pay and upload your receipt <span className="font-semibold text-stone-800">by {deadline}</span>,
                  or the slot opens up again.
                </>
              )}
            </p>
          </div>

          <div className="rounded-3xl bg-emerald-950 p-6 text-emerald-50 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800/60">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Step 1 · Send payment
                </p>
                <p className="font-display text-2xl">{formatPkr(result.booking.amount_pkr)} via JazzCash</p>
              </div>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-900/60 px-5 py-4">
                <dt className="text-[12px] font-medium uppercase tracking-wider text-emerald-300/80">Account name</dt>
                <dd className="mt-1 text-[16px] font-semibold">{result.payment.jazzcash_name}</dd>
              </div>
              <div className="rounded-2xl bg-emerald-900/60 px-5 py-4">
                <dt className="text-[12px] font-medium uppercase tracking-wider text-emerald-300/80">JazzCash number</dt>
                <dd className="mt-1 text-[16px] font-semibold tabular-nums">{result.payment.jazzcash_number}</dd>
              </div>
            </dl>
            {result.payment.instructions && (
              <p className="mt-4 text-[13.5px] leading-relaxed text-emerald-100/70">{result.payment.instructions}</p>
            )}
          </div>

          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
              Step 2 · Upload your receipt
            </p>
            <p className="mb-5 mt-1.5 text-[14px] text-stone-500">
              Take a screenshot of the JazzCash receipt and attach it here.
            </p>
            <UploadProof bookingRef={result.booking.ref} phone={form.phone} onUploaded={() => setStep(3)} />
          </div>
        </div>
      )}

      {/* Step 4: done */}
      {step === 3 && result && (
        <div className="rounded-3xl border border-stone-200/80 bg-white px-6 py-14 text-center sm:px-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/5 text-emerald-900 ring-1 ring-emerald-900/10">
            <PartyPopper className="h-7 w-7" />
          </span>
          <h2 className="font-display mt-6 text-3xl text-stone-900">All done — we’re checking your payment</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-stone-500">
            The owner personally verifies every payment. Once confirmed, your booking status changes to{" "}
            <span className="font-semibold text-emerald-800">Confirmed</span> — usually within a few hours.
          </p>
          <div className="mx-auto mt-8 max-w-xs rounded-2xl bg-[#F4F0E6] px-6 py-4">
            <p className="text-[12px] font-medium uppercase tracking-wider text-stone-400">Your booking code</p>
            <p className="font-display mt-1 text-2xl tracking-wide text-stone-900">{result.booking.ref}</p>
          </div>
          <div className="mt-8">
            <Link
              href={`/booking?ref=${result.booking.ref}&phone=${encodeURIComponent(form.phone)}`}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-900 px-7 py-3.5 text-[15px] font-medium text-emerald-50 transition-colors hover:bg-emerald-800"
            >
              Track my booking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-800" />
        </div>
      }
    >
      <BookWizard />
    </Suspense>
  );
}
