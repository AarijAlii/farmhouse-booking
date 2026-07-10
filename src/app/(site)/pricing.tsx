"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Sparkles, UtensilsCrossed } from "lucide-react";
import { SLOT_KEYS, SLOT_META, formatPkr } from "./site-ui";

interface MenuItem {
  id: string;
  name: string;
  price_pkr: number;
}

function parseMenu(json: string | undefined): MenuItem[] {
  try {
    const raw = JSON.parse(json ?? "[]");
    return Array.isArray(raw) ? raw.filter((i) => i && i.name && i.price_pkr > 0) : [];
  } catch {
    return [];
  }
}

export function PricingCards() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setSettings(d.settings ?? {});
      })
      .catch(() => {
        if (!cancelled) setSettings({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const s = settings ?? {};

  const packages = [
    {
      key: "two_slots",
      title: "Two slots",
      time: "Any two consecutive slots · 12 hours",
      blurb: "A long, lazy day — morning into afternoon, or afternoon into the night.",
      weekday: s["price_two_slots_pkr"],
      weekend: s["price_two_slots_weekend_pkr"],
    },
    {
      key: "full_day",
      title: "Full day",
      time: "6:00 am – 12:00 am · 18 hours",
      blurb: "The whole farm from sunrise to midnight. Weddings-level dholki energy welcome.",
      weekday: s["price_full_day_pkr"],
      weekend: s["price_full_day_weekend_pkr"],
    },
  ];

  const menu = parseMenu(s["food_menu"]);

  return (
    <div>
      {/* Single slots */}
      <div className="grid gap-5 md:grid-cols-3">
        {SLOT_KEYS.map((key) => {
          const meta = SLOT_META[key];
          const Icon = meta.icon;
          const price = s[meta.priceKey];
          const weekend = s[`price_${key}_weekend_pkr`];
          return (
            <div
              key={key}
              className="group flex flex-col rounded-3xl border border-stone-200/80 bg-white p-7 transition-shadow hover:shadow-[0_12px_40px_rgba(28,25,23,0.08)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-900/5 text-emerald-900 ring-1 ring-emerald-900/10">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-display mt-5 text-2xl text-stone-900">{meta.label}</h3>
              <p className="mt-1 text-[13px] font-medium uppercase tracking-wider text-stone-400">{meta.time}</p>
              <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-stone-600">{meta.blurb}</p>
              <div className="mt-5 border-t border-stone-100 pt-4">
                <p className="font-display text-[26px] text-stone-900">
                  {settings === null ? "…" : formatPkr(price)}
                  <span className="ml-1.5 font-sans text-[12.5px] font-medium text-stone-400">weekday</span>
                </p>
                {weekend && Number(weekend) !== Number(price) && (
                  <p className="mt-0.5 text-[13px] font-medium text-stone-500">Weekends: {formatPkr(weekend)}</p>
                )}
                <Link
                  href={`/book?slot=${key}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium text-emerald-800 transition-colors hover:text-emerald-950"
                >
                  Book {meta.label.toLowerCase()}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Packages */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {packages.map((p) => (
          <div
            key={p.key}
            className="group flex flex-col rounded-3xl bg-emerald-950 p-7 text-emerald-50 transition-shadow hover:shadow-[0_12px_40px_rgba(6,78,59,0.3)]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800/60">
              {p.key === "full_day" ? <Sparkles className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
            </span>
            <h3 className="font-display mt-5 text-2xl">{p.title}</h3>
            <p className="mt-1 text-[13px] font-medium uppercase tracking-wider text-emerald-300/70">{p.time}</p>
            <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-emerald-100/80">{p.blurb}</p>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-emerald-800/60 pt-4">
              <div>
                <p className="font-display text-[26px]">
                  {settings === null ? "…" : formatPkr(p.weekday)}
                  <span className="ml-1.5 font-sans text-[12.5px] font-medium text-emerald-300/70">weekday</span>
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-emerald-200/80">
                  Weekends: {formatPkr(p.weekend)}
                </p>
              </div>
              <Link
                href="/book"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-emerald-950 transition-colors hover:bg-emerald-50"
              >
                Book it
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Food menu */}
      {menu.length > 0 && (
        <div className="mt-6 rounded-3xl border border-stone-200/80 bg-white p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-2xl text-stone-900">Homemade food, made to order</h3>
              <p className="text-[13.5px] text-stone-500">
                Optional — pre-order with your booking and it’s ready when you arrive.
              </p>
            </div>
          </div>
          <ul className="mt-5 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
            {menu.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 text-[14.5px]">
                <span className="text-stone-700">{item.name}</span>
                <span className="shrink-0 border-b border-dotted border-stone-300" aria-hidden="true" style={{ flexGrow: 1 }} />
                <span className="font-medium tabular-nums text-stone-900">{formatPkr(item.price_pkr)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
