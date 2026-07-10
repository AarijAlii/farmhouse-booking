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

// Activities shown on the landing page. Placeholder images for now — swap the
// URLs for real farm photos when available.
export const ACTIVITIES: { name: string; img: string; note?: string }[] = [
  { name: "Swimming pool", img: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80" },
  { name: "Open green lawn", img: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=800&q=80" },
  { name: "Cricket", img: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80" },
  { name: "Badminton", img: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80" },
  { name: "Bonfire", img: "https://images.unsplash.com/photo-1478827387698-1527781a4887?auto=format&fit=crop&w=800&q=80", note: "Add-on · Rs 1,500 (40 kg wood)" },
  { name: "Foosball", img: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=800&q=80" },
  { name: "Carrom board", img: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=800&q=80" },
  { name: "360° speakers", img: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80" },
  { name: "Disco lights", img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80" },
  { name: "Movies", img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80" },
  { name: "AC & generator", img: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80", note: "No load-shedding worries" },
];

export const POLICIES: { title: string; body: string }[] = [
  {
    title: "Strictly families only",
    body: "The farm hosts families only. Bookings by groups of single men are not accepted, and entry will be refused at the gate without refund if a booking misrepresents the group.",
  },
  {
    title: "Strict timings",
    body: "Your slot starts and ends exactly on time. Please arrive at your start time and vacate by the end time so the farm can be prepared for the next family. Late departures are charged as an extra slot.",
  },
  {
    title: "Damage policy",
    body: "The farm is your responsibility during your visit. Any damage or breakage to the property, furniture, or equipment is billed at repair or replacement cost. Your CNIC is kept on record with every booking.",
  },
  {
    title: "Bonfire & extras",
    body: "Bonfire is a paid add-on (includes 40 kg of firewood) and must be selected with your booking. Outside firewood is not permitted. Pre-ordered food is prepared fresh and added to your booking total.",
  },
  {
    title: "Payments & cancellation",
    body: "A booking is confirmed only after your JazzCash payment is verified. Unpaid bookings expire automatically after the payment window. For cancellations or changes, call us as early as possible.",
  },
  {
    title: "Quiet hours",
    body: "There is no slot between 12:00 am and 6:00 am — the farm (and the neighbourhood) rests. Music must respect the surroundings after 10:00 pm.",
  },
];

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
