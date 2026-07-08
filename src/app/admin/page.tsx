"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CalendarCheck2,
  CircleCheck,
  CircleX,
  ExternalLink,
  IdCard,
  Inbox,
  Phone,
  Users,
  Wallet,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import {
  type AdminBooking,
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  PageHeader,
  SkeletonList,
  SLOT_LABELS_UI,
  SLOT_TIMES_UI,
  blockCustomer,
  formatDateLong,
  formatPkr,
} from "./ui";

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">{value}</p>
      </div>
    </Card>
  );
}

function ReviewCard({ booking, onDecided }: { booking: AdminBooking; onDecided: () => void }) {
  const [busy, setBusy] = useState<"confirm" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  async function decide(action: "confirm" | "reject") {
    setBusy(action);
    setError("");
    try {
      await adminFetch(`/api/admin/bookings/${booking.id}`, {
        method: "POST",
        body: JSON.stringify({ action, ...(note.trim() ? { note: note.trim() } : {}) }),
      });
      onDecided();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={booking.customer_name} />
          <div>
            <p className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
              {booking.customer_name}
              {booking.strikes > 0 && (
                <span
                  title="Previously expired or rejected bookings from this phone in the last 30 days"
                  className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20"
                >
                  ⚠ {booking.strikes} previous no-show{booking.strikes > 1 ? "s" : ""}
                </span>
              )}
            </p>
            <p className="text-[13px] text-slate-500">
              {formatDateLong(booking.booking_date)} · {SLOT_LABELS_UI[booking.slot]} (
              {SLOT_TIMES_UI[booking.slot]})
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums tracking-tight text-slate-900">
            {formatPkr(booking.amount_pkr)}
          </p>
          <p className="text-xs text-slate-400">to receive in JazzCash</p>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-5 sm:grid-cols-[1fr_auto]">
        <div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 text-slate-300" />
              <div>
                <dt className="text-xs text-slate-400">Phone</dt>
                <dd className="font-medium text-slate-700">{booking.phone}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <IdCard className="mt-0.5 h-4 w-4 text-slate-300" />
              <div>
                <dt className="text-xs text-slate-400">CNIC</dt>
                <dd className="font-medium tabular-nums text-slate-700">{booking.cnic}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Users className="mt-0.5 h-4 w-4 text-slate-300" />
              <div>
                <dt className="text-xs text-slate-400">Guests</dt>
                <dd className="font-medium text-slate-700">
                  {booking.adults} adults{booking.children > 0 ? ` · ${booking.children} children` : ""}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <BadgeCheck className="mt-0.5 h-4 w-4 text-slate-300" />
              <div>
                <dt className="text-xs text-slate-400">Booking code</dt>
                <dd className="font-mono text-[13px] font-medium text-slate-700">{booking.ref}</dd>
              </div>
            </div>
          </dl>

          <ErrorBanner message={error} />

          {!rejecting ? (
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button variant="success" loading={busy === "confirm"} onClick={() => decide("confirm")}>
                <CircleCheck className="h-4 w-4" />
                Payment received — confirm
              </Button>
              <Button variant="outline-danger" disabled={busy !== null} onClick={() => setRejecting(true)}>
                <CircleX className="h-4 w-4" />
                Not received — reject
              </Button>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-rose-50/60 p-4 ring-1 ring-rose-100">
              <label className="block text-[13px] font-medium text-slate-700">
                Why are you rejecting? <span className="font-normal text-slate-400">(optional — the customer may call to ask)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="e.g. No payment with this amount arrived in JazzCash"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
              />
              <div className="mt-3 flex flex-wrap gap-2.5">
                <Button variant="danger" loading={busy === "reject"} onClick={() => decide("reject")}>
                  Yes, reject this booking
                </Button>
                <Button
                  variant="outline-danger"
                  disabled={busy !== null}
                  onClick={async () => {
                    try {
                      if (await blockCustomer(adminFetch, booking)) await decide("reject");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Could not block");
                    }
                  }}
                >
                  Reject & block customer
                </Button>
                <Button variant="ghost" disabled={busy !== null} onClick={() => setRejecting(false)}>
                  Go back
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="sm:w-[132px]">
          <p className="mb-2 text-xs font-medium text-slate-400">
            Screenshot{booking.proofs.length > 1 ? "s" : ""} · tap to open
          </p>
          <div className="flex gap-2 sm:flex-col">
            {booking.proofs.map((p) =>
              p.url ? (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block overflow-hidden rounded-xl ring-1 ring-slate-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt="Payment screenshot"
                    className="h-40 w-full object-cover transition-transform duration-200 group-hover:scale-105 sm:h-44"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors group-hover:bg-slate-900/30">
                    <ExternalLink className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </a>
              ) : null
            )}
            {booking.proofs.length === 0 && (
              <p className="text-[13px] text-slate-400">No screenshot yet.</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ReviewQueuePage() {
  const [all, setAll] = useState<AdminBooking[] | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminFetch<{ bookings: AdminBooking[] }>("/api/admin/bookings");
        if (!cancelled) {
          setAll(data.bookings);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load");
          setAll([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const queue = (all ?? []).filter((b) => b.status === "payment_review");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  const upcoming = (all ?? []).filter((b) => b.status === "confirmed" && b.booking_date >= today);
  const monthPrefix = today.slice(0, 7);
  const monthRevenue = (all ?? [])
    .filter((b) => b.status === "confirmed" && b.booking_date.startsWith(monthPrefix))
    .reduce((sum, b) => sum + (b.amount_pkr ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Payments to check"
        guide="Customers who paid and uploaded a JazzCash screenshot appear below. Open your JazzCash app, make sure the money really arrived, then confirm or reject."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Inbox className="h-5 w-5 text-indigo-600" />}
          tint="bg-indigo-50"
          label="Waiting for your review"
          value={all === null ? "—" : String(queue.length)}
        />
        <StatCard
          icon={<CalendarCheck2 className="h-5 w-5 text-emerald-600" />}
          tint="bg-emerald-50"
          label="Upcoming confirmed visits"
          value={all === null ? "—" : String(upcoming.length)}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5 text-amber-600" />}
          tint="bg-amber-50"
          label="Confirmed this month"
          value={all === null ? "—" : formatPkr(monthRevenue)}
        />
      </div>

      <ErrorBanner message={error} />

      {all === null ? (
        <SkeletonList rows={2} />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="All caught up"
          hint="When a customer uploads a payment screenshot, it will appear here for you to check."
        />
      ) : (
        <div className="space-y-4">
          {queue.map((b) => (
            <ReviewCard key={b.id} booking={b} onDecided={() => setRefreshKey((k) => k + 1)} />
          ))}
        </div>
      )}
    </div>
  );
}
