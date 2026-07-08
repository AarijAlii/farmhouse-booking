"use client";

import { useEffect, useState } from "react";
import { CircleCheck, Clock3, ShieldBan, Wallet2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import { Button, Card, ErrorBanner, Field, INPUT_CLASS, PageHeader, SkeletonList } from "../ui";

interface BlockedCustomer {
  id: number;
  phone: string | null;
  reason: string | null;
  blocked_until: string | null;
  created_at: string;
}

function BlockedCustomersCard() {
  const [blocked, setBlocked] = useState<BlockedCustomer[] | null>(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminFetch<{ blocked: BlockedCustomer[] }>("/api/admin/blocked")
      .then((d) => {
        if (!cancelled) setBlocked(d.blocked);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load blocked customers");
          setBlocked([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function blockPhone() {
    if (!phone.trim()) return;
    setBusy(true);
    setError("");
    try {
      await adminFetch("/api/admin/blocked", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim(), reason: "Blocked manually from settings" }),
      });
      setPhone("");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not block");
    }
    setBusy(false);
  }

  async function unblock(id: number) {
    setError("");
    try {
      await adminFetch("/api/admin/blocked", { method: "DELETE", body: JSON.stringify({ id }) });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not unblock");
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
          <ShieldBan className="h-5 w-5 text-rose-600" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">Blocked customers</h2>
          <p className="text-[13px] text-slate-500">
            These numbers can’t make online bookings. Block from a booking’s details, or add a number here.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="03XX XXXXXXX"
          className={`${INPUT_CLASS} !w-52`}
        />
        <Button variant="outline-danger" loading={busy} onClick={blockPhone}>
          Block number
        </Button>
      </div>

      <ErrorBanner message={error} />

      {blocked === null ? (
        <p className="mt-4 text-[13px] text-slate-400">Loading…</p>
      ) : blocked.length === 0 ? (
        <p className="mt-4 text-[13px] text-slate-400">Nobody is blocked right now.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {blocked.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="text-[14px] font-medium text-slate-800">{b.phone ?? "(blocked by CNIC)"}</p>
                <p className="text-xs text-slate-400">
                  {b.reason ?? "No reason noted"} ·{" "}
                  {new Date(b.created_at).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi" })}
                </p>
              </div>
              <button
                onClick={() => unblock(b.id)}
                className="text-[13px] font-medium text-indigo-600 hover:underline"
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminFetch<{ settings: Record<string, string> }>("/api/admin/settings")
      .then((d) => {
        if (!cancelled) setValues(d.settings);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load settings");
          setValues({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSaved(false);
      setValues((v) => ({ ...v, [key]: e.target.value }));
    };
  }

  async function save() {
    if (!values) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const data = await adminFetch<{ settings: Record<string, string> }>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ settings: values }),
      });
      setValues(data.settings);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
    setBusy(false);
  }

  const priceInput = (key: string) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
        Rs
      </span>
      <input type="number" min={1} value={values?.[key] ?? ""} onChange={set(key)} className={`${INPUT_CLASS} !pl-10 tabular-nums`} />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Prices & account"
        guide="Your slot prices and the JazzCash details customers see when they book. Price changes only affect new bookings."
      />

      {values === null ? (
        <SkeletonList rows={2} />
      ) : (
        <div className="space-y-5">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <Clock3 className="h-5 w-5 text-indigo-600" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Slot prices & timing</h2>
                <p className="text-[13px] text-slate-500">What each slot costs, and how long customers get to pay.</p>
              </div>
            </div>
            <p className="mb-3 text-[12.5px] font-semibold uppercase tracking-wide text-slate-400">
              Weekdays (Mon – Fri)
            </p>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Morning" help="6:00 am – 12:00 pm">
                {priceInput("price_morning_pkr")}
              </Field>
              <Field label="Afternoon" help="12:00 pm – 6:00 pm">
                {priceInput("price_afternoon_pkr")}
              </Field>
              <Field label="Evening" help="6:00 pm – 12:00 am">
                {priceInput("price_evening_pkr")}
              </Field>
            </div>
            <p className="mb-3 mt-6 text-[12.5px] font-semibold uppercase tracking-wide text-slate-400">
              Weekends (Sat & Sun)
            </p>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Morning" help="Saturday & Sunday">
                {priceInput("price_morning_weekend_pkr")}
              </Field>
              <Field label="Afternoon" help="Saturday & Sunday">
                {priceInput("price_afternoon_weekend_pkr")}
              </Field>
              <Field label="Evening" help="Saturday & Sunday">
                {priceInput("price_evening_weekend_pkr")}
              </Field>
            </div>
            <p className="mt-4 text-[12.5px] text-slate-400">
              Special prices for single dates (like Eid) are set on the Calendar page. They win over these.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field
                label="Payment time limit (hours)"
                help="A booking expires if the customer doesn't pay within this time"
              >
                <input
                  type="number"
                  min={1}
                  value={values["pending_payment_hours"] ?? ""}
                  onChange={set("pending_payment_hours")}
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Wallet2 className="h-5 w-5 text-emerald-600" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">JazzCash details</h2>
                <p className="text-[13px] text-slate-500">Customers send their payment to this account.</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Account name" help="Shown to customers when they book">
                <input value={values["jazzcash_name"] ?? ""} onChange={set("jazzcash_name")} className={INPUT_CLASS} />
              </Field>
              <Field label="Account number" help="The number customers send money to">
                <input
                  value={values["jazzcash_number"] ?? ""}
                  onChange={set("jazzcash_number")}
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Payment instructions" help="Extra guidance shown on the payment page">
                  <textarea
                    rows={3}
                    value={values["payment_instructions"] ?? ""}
                    onChange={set("payment_instructions")}
                    className={INPUT_CLASS}
                  />
                </Field>
              </div>
            </div>
          </Card>

          <BlockedCustomersCard />

          <ErrorBanner message={error} />

          <div className="flex items-center gap-4">
            <Button loading={busy} onClick={save} className="!px-6 !py-2.5">
              Save changes
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CircleCheck className="h-4 w-4" />
                Saved — customers now see the new details
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
