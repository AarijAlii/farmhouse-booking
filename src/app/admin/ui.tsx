"use client";

import { Loader2 } from "lucide-react";

// Design system for the admin panel. Audience: a non-technical owner —
// generous spacing, plain language, obvious actions.

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  payment_review: "Needs review",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
};

const STATUS_STYLES: Record<string, { chip: string; dot: string }> = {
  pending_payment: { chip: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  payment_review: { chip: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", dot: "bg-indigo-500" },
  confirmed: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  rejected: { chip: "bg-rose-50 text-rose-700 ring-rose-600/20", dot: "bg-rose-500" },
  cancelled: { chip: "bg-slate-100 text-slate-600 ring-slate-500/20", dot: "bg-slate-400" },
  expired: { chip: "bg-slate-100 text-slate-500 ring-slate-500/20", dot: "bg-slate-300" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.cancelled;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export const SLOT_LABELS_UI: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export const SLOT_TIMES_UI: Record<string, string> = {
  morning: "6:00 am – 12:00 pm",
  afternoon: "12:00 pm – 6:00 pm",
  evening: "6:00 pm – 12:00 am",
};

export function formatPkr(amount: number | null): string {
  if (amount == null) return "—";
  return `Rs ${new Intl.NumberFormat("en-PK").format(amount)}`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00+05:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Karachi",
  });
}

export function formatDateLong(iso: string): string {
  return new Date(`${iso}T00:00:00+05:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Karachi",
  });
}

export function PageHeader({
  title,
  guide,
  children,
}: {
  title: string;
  guide: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">{guide}</p>
      </div>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200/70">
        {icon}
      </div>
      <p className="mt-4 text-[15px] font-medium text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-[13.5px] text-slate-500">{hint}</p>
    </Card>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        </Card>
      ))}
    </div>
  );
}

const BUTTON_STYLES = {
  primary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600 disabled:bg-indigo-300",
  success:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 focus-visible:outline-emerald-600 disabled:bg-emerald-300",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-500 focus-visible:outline-rose-600 disabled:bg-rose-300",
  outline:
    "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:text-slate-400",
  "outline-danger":
    "border border-rose-200 bg-white text-rose-600 shadow-sm hover:bg-rose-50 disabled:text-rose-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-400",
};

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_STYLES;
  loading?: boolean;
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-slate-700">{label}</label>
      {help && <p className="mt-0.5 text-xs text-slate-400">{help}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[13px] font-semibold text-indigo-700 ring-1 ring-indigo-100 ${className}`}
    >
      {initials}
    </span>
  );
}

export interface AdminBooking {
  id: number;
  ref: string;
  booking_date: string;
  slot: string;
  customer_name: string;
  phone: string;
  cnic: string;
  adults: number;
  children: number;
  status: string;
  amount_pkr: number | null;
  expires_at: string | null;
  admin_note: string | null;
  created_at: string;
  proofs: { id: number; mime_type: string; uploaded_at: string; url: string | null }[];
  strikes: number;
}

// Shared "block this customer" action for review cards and booking rows.
export async function blockCustomer(
  adminFetch: <T>(path: string, init?: RequestInit) => Promise<T>,
  booking: { id: number; customer_name: string; phone: string }
): Promise<boolean> {
  const reason = window.prompt(
    `Block ${booking.customer_name} (${booking.phone}) from making online bookings?\n\nOptional: note a reason, then press OK.`,
    ""
  );
  if (reason === null) return false;
  await adminFetch("/api/admin/blocked", {
    method: "POST",
    body: JSON.stringify({ booking_id: booking.id, ...(reason.trim() ? { reason: reason.trim() } : {}) }),
  });
  return true;
}
