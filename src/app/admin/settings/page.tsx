"use client";

import { useEffect, useState } from "react";
import { CircleCheck, Clock3, Wallet2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import { Button, Card, ErrorBanner, Field, INPUT_CLASS, PageHeader, SkeletonList } from "../ui";

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
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Morning price" help="6:00 am – 12:00 pm">
                {priceInput("price_morning_pkr")}
              </Field>
              <Field label="Afternoon price" help="12:00 pm – 6:00 pm">
                {priceInput("price_afternoon_pkr")}
              </Field>
              <Field label="Evening price" help="6:00 pm – 12:00 am">
                {priceInput("price_evening_pkr")}
              </Field>
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
