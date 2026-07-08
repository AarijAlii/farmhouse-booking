-- Anti-abuse: blocklist + CNIC fingerprint, and per-day pricing.

-- Manual blocks (owner) and audit trail. blocked_until null = permanent.
create table if not exists public.blocked_customers (
  id            bigint generated always as identity primary key,
  phone         text,
  cnic_hash     text,
  reason        text,
  blocked_until timestamptz,
  created_at    timestamptz not null default now(),
  check (phone is not null or cnic_hash is not null)
);

create index if not exists idx_blocked_phone on public.blocked_customers (phone);
create index if not exists idx_blocked_cnic on public.blocked_customers (cnic_hash);

-- One-way CNIC fingerprint (HMAC) so repeat CNICs can be matched without
-- ever storing the CNIC readably. The encrypted value stays in `cnic`.
alter table public.bookings add column if not exists cnic_hash text;
create index if not exists idx_bookings_cnic_hash on public.bookings (cnic_hash);
create index if not exists idx_bookings_phone on public.bookings (phone);

-- Per-date special prices (Eid, 14 August, ...). Overrides weekend/base prices.
create table if not exists public.price_overrides (
  price_date date not null,
  slot       text not null check (slot in ('morning', 'afternoon', 'evening')),
  price_pkr  integer not null check (price_pkr > 0),
  created_at timestamptz not null default now(),
  primary key (price_date, slot)
);

alter table public.blocked_customers enable row level security;
alter table public.price_overrides   enable row level security;

-- Weekend (Sat/Sun) prices; default equal to base so nothing changes until the owner edits them.
insert into public.settings (key, value) values
  ('price_morning_weekend_pkr',   '15000'),
  ('price_afternoon_weekend_pkr', '15000'),
  ('price_evening_weekend_pkr',   '20000')
on conflict (key) do nothing;

-- JazzCash transfers take minutes, not hours: shorten the default slot hold.
update public.settings set value = '1' where key = 'pending_payment_hours' and value = '3';
