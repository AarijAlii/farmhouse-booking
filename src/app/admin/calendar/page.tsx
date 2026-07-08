"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, LockOpen, Moon, Sun, Sunrise } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import { Button, Card, ErrorBanner, PageHeader, SLOT_LABELS_UI, SLOT_TIMES_UI, formatDateLong } from "../ui";

type SlotStatus = "available" | "booked" | "blocked" | "past";
type Day = { date: string; slots: Record<string, SlotStatus> };

const SLOT_ORDER = ["morning", "afternoon", "evening"] as const;
const SLOT_ICONS = { morning: Sunrise, afternoon: Sun, evening: Moon };

const DOT_COLORS: Record<SlotStatus, string> = {
  available: "bg-emerald-500",
  booked: "bg-indigo-500",
  blocked: "bg-rose-400",
  past: "bg-slate-200",
};

const STATUS_TEXT: Record<SlotStatus, string> = {
  available: "Open — customers can book it",
  booked: "Booked by a customer",
  blocked: "Closed by you",
  past: "Already passed",
};

function monthString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [days, setDays] = useState<Day[] | null>(null);
  const [selected, setSelected] = useState<Day | null>(null);
  const [error, setError] = useState("");
  const [busySlot, setBusySlot] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const month = monthString(monthDate);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/availability?month=${month}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load the calendar");
        if (!cancelled) {
          setDays(data.days);
          setError("");
          setSelected((prev) => (prev ? data.days.find((d: Day) => d.date === prev.date) ?? null : null));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load the calendar");
          setDays([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, refreshKey]);

  async function toggleBlock(day: Day, slot: string, currently: SlotStatus) {
    setBusySlot(`${day.date}|${slot}`);
    setError("");
    try {
      await adminFetch("/api/admin/blocks", {
        method: "POST",
        body: JSON.stringify({ date: day.date, slots: [slot], blocked: currently === "available" }),
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the slot");
    }
    setBusySlot("");
  }

  function shiftMonth(delta: number) {
    const d = new Date(monthDate);
    d.setMonth(d.getMonth() + delta);
    setMonthDate(d);
    setSelected(null);
  }

  const firstWeekday = new Date(`${month}-01T00:00:00`).getDay();

  return (
    <div>
      <PageHeader
        title="Calendar & blocking"
        guide="Pick a date to manage its three slots. Close a slot when the farm is not available — customers won't be able to book it. You can open it again anytime."
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
        {(["available", "booked", "blocked", "past"] as SlotStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${DOT_COLORS[s]}`} />
            {s === "available" ? "Open" : s === "booked" ? "Booked" : s === "blocked" ? "Closed by you" : "Past"}
          </span>
        ))}
      </div>

      <ErrorBanner message={error} />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => shiftMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-[15px] font-semibold tracking-tight text-slate-900">
              {monthDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </p>
            <button
              onClick={() => shiftMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          {days === null ? (
            <div className="grid animate-pulse grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map((day) => {
                const isSelected = selected?.date === day.date;
                const isToday = day.date === today;
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelected(day)}
                    className={`flex h-14 flex-col items-center justify-center gap-1.5 rounded-xl text-sm transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-700 hover:bg-slate-50 hover:ring-1 hover:ring-slate-200"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-medium ${
                        isToday && !isSelected ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" : ""
                      }`}
                    >
                      {Number(day.date.slice(8))}
                    </span>
                    <span className="flex gap-1">
                      {SLOT_ORDER.map((s) => (
                        <span
                          key={s}
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? "ring-1 ring-white/40" : ""
                          } ${DOT_COLORS[day.slots[s]]}`}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {selected ? (
          <Card className="p-5">
            <p className="text-[15px] font-semibold tracking-tight text-slate-900">
              {formatDateLong(selected.date)}
            </p>
            <div className="mt-4 space-y-2.5">
              {SLOT_ORDER.map((slot) => {
                const st = selected.slots[slot];
                const busy = busySlot === `${selected.date}|${slot}`;
                const Icon = SLOT_ICONS[slot];
                return (
                  <div key={slot} className="rounded-xl p-4 ring-1 ring-slate-200/80">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200/60">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-slate-800">{SLOT_LABELS_UI[slot]}</p>
                        <p className="text-xs text-slate-400">{SLOT_TIMES_UI[slot]}</p>
                      </div>
                      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLORS[st]}`} />
                    </div>
                    <p className="mt-2.5 text-[13px] text-slate-500">{STATUS_TEXT[st]}</p>
                    {st === "available" && (
                      <Button
                        variant="outline-danger"
                        loading={busy}
                        onClick={() => toggleBlock(selected, slot, st)}
                        className="mt-3 w-full"
                      >
                        <Lock className="h-4 w-4" />
                        Close this slot
                      </Button>
                    )}
                    {st === "blocked" && (
                      <Button
                        variant="outline"
                        loading={busy}
                        onClick={() => toggleBlock(selected, slot, st)}
                        className="mt-3 w-full !text-emerald-700"
                      >
                        <LockOpen className="h-4 w-4" />
                        Open this slot again
                      </Button>
                    )}
                    {st === "booked" && (
                      <p className="mt-2 text-xs text-slate-400">
                        Find the customer on the “All bookings” page.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200/70">
              <ChevronLeft className="h-5 w-5 lg:rotate-0 max-lg:-rotate-90" />
            </span>
            <p className="mt-3 text-[14px] font-medium text-slate-700">Pick a date</p>
            <p className="mt-1 text-[13px] text-slate-500">
              Tap any date on the calendar to open or close its slots.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
