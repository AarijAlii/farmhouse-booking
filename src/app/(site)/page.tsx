import {
  CalendarCheck2,
  CircleCheck,
  Flame,
  HeartHandshake,
  Image as ImageIcon,
  MessageSquareText,
  ShieldCheck,
  Sofa,
  Trees,
  Upload,
  Users,
  Waves,
} from "lucide-react";
import { BRAND, BRAND_CITY, CtaButton, Img, SectionHeading } from "./site-ui";
import { PricingCards } from "./pricing";

const HERO_IMG =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=80";
const FARM_IMGS = [
  "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80",
];
const GALLERY_IMGS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=80",
];

const FEATURES = [
  { icon: Users, title: "Families only", copy: "Reserved exclusively for family groups — always." },
  { icon: Trees, title: "Open green lawns", copy: "Room to run, play cricket, or do nothing at all." },
  { icon: Waves, title: "Swimming pool", copy: "A clean private pool, all to yourselves." },
  { icon: Flame, title: "BBQ & bonfire", copy: "Grill under the open sky as the sun goes down." },
  { icon: Sofa, title: "Indoor lounge", copy: "AC lounge and rest rooms for the whole family." },
  { icon: ShieldCheck, title: "Fully private", copy: "One booking per slot — no strangers, ever." },
];

const STEPS = [
  {
    icon: CalendarCheck2,
    title: "Pick your day & slot",
    copy: "Choose a date on the calendar and take the morning, afternoon, or evening.",
  },
  {
    icon: MessageSquareText,
    title: "Tell us who's coming",
    copy: "Your name, phone, CNIC, and how many adults and children.",
  },
  {
    icon: Upload,
    title: "Pay via JazzCash",
    copy: "Send the amount to our JazzCash account and upload your receipt screenshot.",
  },
  {
    icon: CircleCheck,
    title: "Get confirmed",
    copy: "We check the payment and confirm your booking — track it anytime with your code.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[86vh] items-center justify-center overflow-hidden">
        <Img
          src={HERO_IMG}
          alt="Green farm fields at golden hour"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-950/30 to-stone-950/70" />
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center text-white">
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-emerald-200">
            {BRAND} · {BRAND_CITY}
          </p>
          <h1 className="font-display mt-5 text-5xl leading-[1.05] sm:text-6xl md:text-7xl">
            Slow mornings.
            <br />
            Golden evenings.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-stone-200">
            A private farmhouse for your family — the lawns, the pool, the BBQ, all of it yours for
            the day. No crowds. No strangers. Just your people.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
            <CtaButton href="/book" variant="light">
              Book your day
            </CtaButton>
            <CtaButton href="/#how" variant="outline">
              How it works
            </CtaButton>
          </div>
          <p className="mt-10 text-[13px] font-medium uppercase tracking-[0.18em] text-stone-300">
            Morning 6–12 · Afternoon 12–6 · Evening 6–12
          </p>
        </div>
      </section>

      {/* The farm */}
      <section id="farm" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="The farm"
              title="One farmhouse. One family at a time."
              copy="We only ever host one booking per slot, so every visit feels like the farm belongs to you — because for those six hours, it does. Bring the grandparents, the cousins, the kids; there's space and shade for everyone."
            />
            <ul className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-900/5 text-emerald-900 ring-1 ring-emerald-900/10">
                    <f.icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-stone-900">{f.title}</p>
                    <p className="mt-0.5 text-[13.5px] leading-relaxed text-stone-500">{f.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Img
              src={FARM_IMGS[0]}
              alt="Farmhouse lawn"
              className="col-span-2 h-72 w-full rounded-3xl object-cover"
            />
            <Img src={FARM_IMGS[1]} alt="Countryside house" className="h-52 w-full rounded-3xl object-cover" />
            <Img src={FARM_IMGS[2]} alt="Trees by the water" className="h-52 w-full rounded-3xl object-cover" />
          </div>
        </div>
      </section>

      {/* Slots & pricing */}
      <section id="slots" className="scroll-mt-24 border-y border-stone-200/70 bg-[#F4F0E6]">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <SectionHeading
            center
            eyebrow="Slots & prices"
            title="Three slots a day. The whole farm, every time."
            copy="Every booking is private — your price covers the entire farmhouse for your slot, however many of your family you bring."
          />
          <div className="mt-12">
            <PricingCards />
          </div>
          <p className="mt-8 text-center text-[13.5px] text-stone-500">
            The farm rests from 12:00 am to 6:00 am — no overnight slot.
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="mb-10 flex items-end justify-between gap-6">
          <SectionHeading eyebrow="Gallery" title="A glimpse of the place" />
          <ImageIcon className="mb-2 hidden h-6 w-6 text-stone-300 sm:block" />
        </div>
        <div className="flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
          {GALLERY_IMGS.map((src, i) => (
            <Img
              key={i}
              src={src}
              alt="Farmhouse gallery"
              className="h-72 w-[300px] shrink-0 snap-start rounded-3xl object-cover sm:w-[360px]"
            />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-24 border-t border-stone-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <SectionHeading
            center
            eyebrow="How it works"
            title="Booked in five minutes"
            copy="No account needed. You get a booking code, pay by JazzCash, and we confirm — that's the whole thing."
          />
          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="font-display absolute -top-7 left-0 text-6xl text-stone-100 select-none">
                  {i + 1}
                </span>
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-emerald-900 text-emerald-50">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="relative mt-4 text-[16px] font-semibold text-stone-900">{s.title}</h3>
                <p className="relative mt-1.5 text-[14px] leading-relaxed text-stone-500">{s.copy}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14 flex justify-center">
            <CtaButton href="/book">Start your booking</CtaButton>
          </div>
        </div>
      </section>

      {/* Family-only note */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-emerald-950 px-8 py-10 text-emerald-50 sm:flex-row sm:items-center sm:px-12">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-800/60">
            <HeartHandshake className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h3 className="font-display text-2xl">A family place, kept that way</h3>
            <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-emerald-100/80">
              {BRAND} hosts families only. Bookings are held with a payment deadline, every payment is
              personally verified, and your details are never shared. Questions? Call us before you book —
              we’re happy to help.
            </p>
          </div>
          <CtaButton href="/book" variant="light" className="shrink-0">
            Book your day
          </CtaButton>
        </div>
      </section>
    </div>
  );
}
