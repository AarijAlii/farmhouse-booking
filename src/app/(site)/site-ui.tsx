import Link from "next/link";
import { Moon, Sun, Sunrise } from "lucide-react";

export const BRAND = "Sukoon Farmhouse";
export const BRAND_TAGLINE = "A private family farmhouse";
export const BRAND_CITY = "Lahore, Pakistan";

export const Img = ({ alt = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img alt={alt} {...props} />
);

export const SLOT_META = {
  morning: {
    label: "Morning",
    time: "6:00 am – 12:00 pm",
    icon: Sunrise,
    blurb: "Cool air, birdsong, and breakfast on the lawn.",
    priceKey: "price_morning_pkr",
  },
  afternoon: {
    label: "Afternoon",
    time: "12:00 pm – 6:00 pm",
    icon: Sun,
    blurb: "Pool time, long lunches, and lazy charpai naps.",
    priceKey: "price_afternoon_pkr",
  },
  evening: {
    label: "Evening",
    time: "6:00 pm – 12:00 am",
    icon: Moon,
    blurb: "Golden hour, BBQ smoke, and stars over the fields.",
    priceKey: "price_evening_pkr",
  },
} as const;

export type SlotKey = keyof typeof SLOT_META;
export const SLOT_KEYS = ["morning", "afternoon", "evening"] as const;

export function formatPkr(amount: number | string | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `Rs ${new Intl.NumberFormat("en-PK").format(n)}`;
}

export function CtaButton({
  href,
  children,
  variant = "solid",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "light" | "outline";
  className?: string;
}) {
  const styles = {
    solid: "bg-emerald-900 text-emerald-50 hover:bg-emerald-800",
    light: "bg-white text-stone-900 hover:bg-stone-100",
    outline: "border border-white/60 text-white hover:bg-white/10",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium tracking-wide transition-colors ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
  center = false,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-emerald-800">{eyebrow}</p>
      <h2 className="font-display mt-3 text-4xl leading-[1.1] text-stone-900 sm:text-[44px]">{title}</h2>
      {copy && <p className="mt-4 text-[16px] leading-relaxed text-stone-600">{copy}</p>}
    </div>
  );
}
