"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SLOT_KEYS, SLOT_META, formatPkr } from "./site-ui";

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

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {SLOT_KEYS.map((key) => {
        const meta = SLOT_META[key];
        const Icon = meta.icon;
        const price = settings?.[meta.priceKey];
        return (
          <div
            key={key}
            className="group flex flex-col rounded-3xl border border-stone-200/80 bg-white p-8 transition-shadow hover:shadow-[0_12px_40px_rgba(28,25,23,0.08)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900/5 text-emerald-900 ring-1 ring-emerald-900/10">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="font-display mt-6 text-2xl text-stone-900">{meta.label}</h3>
            <p className="mt-1 text-[13.5px] font-medium uppercase tracking-wider text-stone-400">
              {meta.time}
            </p>
            <p className="mt-4 flex-1 text-[15px] leading-relaxed text-stone-600">{meta.blurb}</p>
            <div className="mt-6 border-t border-stone-100 pt-5">
              <p className="font-display text-[28px] text-stone-900">
                {settings === null ? "…" : formatPkr(price)}
                <span className="ml-1.5 font-sans text-[13px] font-medium text-stone-400">
                  / whole farm
                </span>
              </p>
              {settings !== null &&
                (() => {
                  const weekend = settings[`price_${key}_weekend_pkr`];
                  return weekend && Number(weekend) !== Number(price) ? (
                    <p className="mt-1 text-[12.5px] font-medium text-stone-500">
                      Weekends: {formatPkr(weekend)}
                    </p>
                  ) : null;
                })()}
              <Link
                href={`/book?slot=${key}`}
                className="mt-4 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-emerald-800 transition-colors hover:text-emerald-950"
              >
                Book {meta.label.toLowerCase()}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
