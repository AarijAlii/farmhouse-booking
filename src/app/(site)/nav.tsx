"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, TreePine, X } from "lucide-react";
import { BRAND } from "./site-ui";

const LINKS = [
  { href: "/#farm", label: "The farm" },
  { href: "/#slots", label: "Slots & prices" },
  { href: "/#how", label: "How it works" },
  { href: "/booking", label: "Find my booking" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-[#FBF9F4]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-emerald-50">
            <TreePine className="h-[18px] w-[18px]" />
          </span>
          <span className="font-display text-[19px] tracking-tight text-stone-900">{BRAND}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[14px] font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="rounded-full bg-emerald-900 px-5 py-2.5 text-[14px] font-medium text-emerald-50 transition-colors hover:bg-emerald-800"
          >
            Book your day
          </Link>
        </nav>

        <button
          className="rounded-lg p-2 text-stone-700 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-stone-200/60 bg-[#FBF9F4] px-5 pb-5 pt-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-[15px] font-medium text-stone-700"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/book"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-full bg-emerald-900 px-5 py-3 text-center text-[15px] font-medium text-emerald-50"
          >
            Book your day
          </Link>
        </nav>
      )}
    </header>
  );
}
