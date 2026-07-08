"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock3,
  Loader2,
  Search,
  Wallet,
} from "lucide-react";
import { SLOT_META, type SlotKey, formatPkr } from "../site-ui";
import { UploadProof } from "../upload-proof";

interface PublicBooking {
  ref: string;
  booking_date: string;
  slot: SlotKey;
  customer_name: string;
  adults: number;
  children: number;
  status: string;
  amount_pkr: number | null;
  expires_at: string | null;
}

interface LookupResult {
  booking: PublicBooking;
  payment: { jazzcash_name: string; jazzcash_number: string; instructions: string } | null;
}

const STATUS_VIEW: Record<
  string,
  { label: string; tone: "wait" | "good" | "bad"; copy: string }
> = {
  pending_payment: {
    label: "Waiting for your payment",
    tone: "wait",
    copy: "Your slot is held. Send the payment via JazzCash and upload your receipt screenshot below before the deadline.",
  },
  payment_review: {
    label: "Payment under review",
    tone: "wait",
    copy: "We received your screenshot and the owner is verifying the payment. This usually takes a few hours.",
  },
  confirmed: {
    label: "Confirmed — see you at the farm!",
    tone: "good",
    copy: "Your payment is verified and the farm is booked for you. Bring this booking code with you on the day.",
  },
  rejected: {
    label: "Payment could not be verified",
    tone: "bad",
    copy: "We couldn't match your screenshot to a received payment. Please call us — if this is a mistake we'll fix it together.",
  },
  cancelled: {
    label: "Booking cancelled",
    tone: "bad",
    copy: "This booking was cancelled. If that's unexpected, please call us.",
  },
  expired: {
    label: "Booking expired",
    tone: "bad",
    copy: "The payment window passed, so the slot was released. You're welcome to book again anytime.",
  },
};

function StatusTracker() {
  const params = useSearchParams();
  const [ref, setRef] = useState(params.get("ref") ?? "");
  const [phone, setPhone] = useState(params.get("phone") ?? "");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const autoLooked = useRef(false);

  const lookup = useCallback(
    async (r: string, p: string) => {
      setBusy(true);
      setError("");
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(r.trim())}?phone=${encodeURIComponent(p.trim())}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Could not find that booking");
        setResult(body as LookupResult);
      } catch (e) {
        setResult(null);
        setError(e instanceof Error ? e.message : "Could not find that booking");
      }
      setBusy(false);
    },
    []
  );

  useEffect(() => {
    if (!autoLooked.current && ref && phone) {
      autoLooked.current = true;
      lookup(ref, phone);
    }
  }, [ref, phone, lookup]);

  const b = result?.booking;
  const view = b ? STATUS_VIEW[b.status] : null;
  const meta = b ? SLOT_META[b.slot] : null;

  const deadline = b?.expires_at
    ? new Date(b.expires_at).toLocaleString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        weekday: "short",
        timeZone: "Asia/Karachi",
      })
    : null;

  const toneStyles = {
    wait: { ring: "ring-amber-200", bg: "bg-amber-50", text: "text-amber-800", icon: Clock3 },
    good: { ring: "ring-emerald-200", bg: "bg-emerald-50", text: "text-emerald-800", icon: CircleCheck },
    bad: { ring: "ring-rose-200", bg: "bg-rose-50", text: "text-rose-700", icon: CircleX },
  };

  return (
    <div className="mx-auto max-w-xl px-5 py-14 sm:px-8">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl text-stone-900">Find my booking</h1>
        <p className="mt-2 text-[15px] text-stone-500">
          Enter your booking code and the phone number you booked with.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(ref, phone);
        }}
        className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-stone-700">Booking code</label>
            <input
              required
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase())}
              placeholder="FH-XXXXXX"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 font-mono text-[15px] uppercase tracking-wide text-stone-900 outline-none placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-medium text-stone-700">Phone number</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03XX XXXXXXX"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
            />
          </div>
        </div>
        {error && (
          <p className="mt-4 rounded-2xl bg-rose-50 px-5 py-3.5 text-[14px] text-rose-700 ring-1 ring-rose-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-900 px-7 py-3.5 text-[15px] font-medium text-emerald-50 transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-900/50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {busy ? "Looking up..." : "Check my booking"}
        </button>
      </form>

      {b && view && meta && (
        <div className="mt-6 space-y-5">
          <div className={`rounded-3xl ${toneStyles[view.tone].bg} p-6 ring-1 sm:p-8 ${toneStyles[view.tone].ring}`}>
            <div className="flex items-start gap-4">
              {(() => {
                const Icon = toneStyles[view.tone].icon;
                return (
                  <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/70 ${toneStyles[view.tone].text}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                );
              })()}
              <div>
                <p className={`font-display text-2xl ${toneStyles[view.tone].text}`}>{view.label}</p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-stone-600">{view.copy}</p>
                {b.status === "pending_payment" && deadline && (
                  <p className="mt-2 text-[14px] font-semibold text-stone-800">Deadline: {deadline}</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-emerald-900" />
                <p className="text-[15px] font-medium text-stone-800">
                  {new Date(`${b.booking_date}T00:00:00+05:00`).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "Asia/Karachi",
                  })}
                </p>
              </div>
              <p className="font-mono text-[14px] font-semibold tracking-wide text-stone-500">{b.ref}</p>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-[14px] sm:grid-cols-3">
              <div>
                <dt className="text-[12px] text-stone-400">Slot</dt>
                <dd className="mt-0.5 font-medium text-stone-800">
                  {meta.label} · {meta.time}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-stone-400">Guests</dt>
                <dd className="mt-0.5 font-medium text-stone-800">
                  {b.adults} adults{b.children > 0 ? `, ${b.children} children` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-stone-400">Amount</dt>
                <dd className="mt-0.5 font-medium text-stone-800">{formatPkr(b.amount_pkr)}</dd>
              </div>
            </dl>
          </div>

          {(b.status === "pending_payment" || b.status === "payment_review") && result?.payment && (
            <>
              {b.status === "pending_payment" && (
                <div className="rounded-3xl bg-emerald-950 p-6 text-emerald-50 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800/60">
                      <Wallet className="h-4.5 w-4.5" />
                    </span>
                    <p className="font-display text-xl">Send {formatPkr(b.amount_pkr)} via JazzCash</p>
                  </div>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-emerald-900/60 px-5 py-4">
                      <dt className="text-[12px] font-medium uppercase tracking-wider text-emerald-300/80">
                        Account name
                      </dt>
                      <dd className="mt-1 text-[15px] font-semibold">{result.payment.jazzcash_name}</dd>
                    </div>
                    <div className="rounded-2xl bg-emerald-900/60 px-5 py-4">
                      <dt className="text-[12px] font-medium uppercase tracking-wider text-emerald-300/80">
                        JazzCash number
                      </dt>
                      <dd className="mt-1 text-[15px] font-semibold tabular-nums">{result.payment.jazzcash_number}</dd>
                    </div>
                  </dl>
                </div>
              )}
              <div className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8">
                <p className="mb-4 text-[14.5px] font-medium text-stone-700">
                  {b.status === "pending_payment"
                    ? "Upload your receipt screenshot"
                    : "Need to replace your screenshot? Upload a clearer one:"}
                </p>
                <UploadProof bookingRef={b.ref} phone={phone} onUploaded={() => lookup(ref, phone)} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-800" />
        </div>
      }
    >
      <StatusTracker />
    </Suspense>
  );
}
