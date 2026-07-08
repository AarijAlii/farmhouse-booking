"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ListChecks, Search } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import {
  type AdminBooking,
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  INPUT_CLASS,
  PageHeader,
  SkeletonList,
  SLOT_LABELS_UI,
  SLOT_TIMES_UI,
  StatusBadge,
  formatDate,
  formatPkr,
} from "../ui";

const FILTERS = [
  { value: "", label: "All" },
  { value: "payment_review", label: "Needs review" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

function DetailPanel({ booking, onChanged }: { booking: AdminBooking; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cancellable = ["confirmed", "payment_review", "pending_payment"].includes(booking.status);

  async function cancel() {
    if (!window.confirm(`Cancel the booking for ${booking.customer_name}? The slot will open up again.`))
      return;
    setBusy(true);
    setError("");
    try {
      await adminFetch(`/api/admin/bookings/${booking.id}`, {
        method: "POST",
        body: JSON.stringify({ action: "cancel" }),
      });
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-400">Booking code</dt>
          <dd className="mt-0.5 font-mono text-[13px] font-medium text-slate-700">{booking.ref}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Phone</dt>
          <dd className="mt-0.5 font-medium text-slate-700">{booking.phone}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">CNIC</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-slate-700">{booking.cnic}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Booked on</dt>
          <dd className="mt-0.5 font-medium text-slate-700">
            {new Date(booking.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Karachi",
            })}
          </dd>
        </div>
        {booking.admin_note && (
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-xs text-slate-400">Your note</dt>
            <dd className="mt-0.5 text-slate-700">{booking.admin_note}</dd>
          </div>
        )}
      </dl>

      {booking.proofs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {booking.proofs.map((p) =>
            p.url ? (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg ring-1 ring-slate-200 transition-opacity hover:opacity-90"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="Payment screenshot" className="h-24 w-[68px] object-cover" />
              </a>
            ) : null
          )}
        </div>
      )}

      <ErrorBanner message={error} />

      {cancellable && (
        <div className="mt-4">
          <Button variant="outline-danger" loading={busy} onClick={cancel}>
            Cancel this booking
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AllBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (date) params.set("date", date);
        const data = await adminFetch<{ bookings: AdminBooking[] }>(`/api/admin/bookings?${params}`);
        if (!cancelled) {
          setBookings(data.bookings);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load");
          setBookings([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, date, refreshKey]);

  const q = search.trim().toLowerCase();
  const visible = (bookings ?? []).filter(
    (b) =>
      !q ||
      b.customer_name.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.ref.toLowerCase().includes(q)
  );

  return (
    <div>
      <PageHeader
        title="All bookings"
        guide="Every booking, past and present. Click a row to see full details, screenshots, and actions."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              status === f.value
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, or booking code"
            className={`${INPUT_CLASS} !pl-9`}
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${INPUT_CLASS} !w-auto`}
          title="Show one date only"
        />
        {date && (
          <button onClick={() => setDate("")} className="text-[13px] font-medium text-indigo-600 hover:underline">
            Clear date
          </button>
        )}
      </div>

      <ErrorBanner message={error} />

      {bookings === null ? (
        <SkeletonList rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-5 w-5" />}
          title="No bookings found"
          hint={q ? "Try a different search." : "New bookings will appear here as customers make them."}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.6fr_1.3fr_0.8fr_0.9fr_1fr_40px] gap-3 border-b border-slate-100 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 md:grid">
            <span>Customer</span>
            <span>Visit</span>
            <span>Guests</span>
            <span className="text-right">Amount</span>
            <span>Status</span>
            <span />
          </div>
          <ul className="divide-y divide-slate-100">
            {visible.map((b) => {
              const open = openId === b.id;
              return (
                <li key={b.id}>
                  <button
                    onClick={() => setOpenId(open ? null : b.id)}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50/70 md:grid-cols-[1.6fr_1.3fr_0.8fr_0.9fr_1fr_40px]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={b.customer_name} className="max-md:hidden" />
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-medium text-slate-800">
                          {b.customer_name}
                        </span>
                        <span className="block truncate text-xs text-slate-400 md:hidden">
                          {formatDate(b.booking_date)} · {SLOT_LABELS_UI[b.slot]}
                        </span>
                        <span className="hidden text-xs text-slate-400 md:block">{b.phone}</span>
                      </span>
                    </span>
                    <span className="hidden text-[13.5px] text-slate-600 md:block">
                      {formatDate(b.booking_date)}
                      <span className="block text-xs text-slate-400">
                        {SLOT_LABELS_UI[b.slot]} · {SLOT_TIMES_UI[b.slot]}
                      </span>
                    </span>
                    <span className="hidden text-[13.5px] text-slate-600 md:block">
                      {b.adults + b.children}
                    </span>
                    <span className="hidden text-right text-[13.5px] font-medium tabular-nums text-slate-800 md:block">
                      {formatPkr(b.amount_pkr)}
                    </span>
                    <span className="flex items-center justify-end gap-2 md:justify-start">
                      <StatusBadge status={b.status} />
                    </span>
                    <ChevronDown
                      className={`hidden h-4 w-4 text-slate-300 transition-transform md:block ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open && <DetailPanel booking={b} onChanged={() => setRefreshKey((k) => k + 1)} />}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
