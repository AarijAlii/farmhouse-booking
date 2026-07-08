import Link from "next/link";
import { Phone, TreePine } from "lucide-react";
import { BRAND, BRAND_CITY } from "./site-ui";
import { SiteNav } from "./nav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F4] text-stone-900">
      <SiteNav />
      <main className="flex-1">{children}</main>

      <footer className="border-t border-stone-200/70 bg-[#191712] text-stone-300">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-emerald-50">
                <TreePine className="h-[18px] w-[18px]" />
              </span>
              <span className="font-display text-lg text-stone-100">{BRAND}</span>
            </div>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-stone-400">
              A private farmhouse for families — book a morning, afternoon, or evening and the whole
              place is yours.
            </p>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-500">Visit</p>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              <li>
                <Link href="/book" className="transition-colors hover:text-white">
                  Book your day
                </Link>
              </li>
              <li>
                <Link href="/booking" className="transition-colors hover:text-white">
                  Find my booking
                </Link>
              </li>
              <li>
                <Link href="/#slots" className="transition-colors hover:text-white">
                  Slots & prices
                </Link>
              </li>
              <li>
                <Link href="/#how" className="transition-colors hover:text-white">
                  How booking works
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-500">Contact</p>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              <li className="flex items-center gap-2 text-stone-400">
                <Phone className="h-4 w-4" /> 03XX-XXXXXXX (call or WhatsApp)
              </li>
              <li className="text-stone-400">{BRAND_CITY}</li>
            </ul>
            <p className="mt-6 text-[13px] leading-relaxed text-stone-500">
              Families only · No slot from 12:00 am – 6:00 am
            </p>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-[12.5px] text-stone-500 sm:px-8">
            <p>© {new Date().getFullYear()} {BRAND}. All rights reserved.</p>
            <Link href="/admin" className="transition-colors hover:text-stone-300">
              Owner sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
