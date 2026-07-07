-- Farmhouse booking schema. Run in the Supabase SQL editor (or via supabase db push).

create table if not exists public.settings (
  key   text primary key,
  value text not null
);

insert into public.settings (key, value) values
  ('price_morning_pkr',     '15000'),
  ('price_afternoon_pkr',   '15000'),
  ('price_evening_pkr',     '20000'),
  ('pending_payment_hours', '3'),
  ('jazzcash_name',         'CHANGE ME'),
  ('jazzcash_number',       '03XXXXXXXXX'),
  ('payment_instructions',  'Send the full amount via JazzCash to the account above, then upload a clear screenshot of the receipt.')
on conflict (key) do nothing;

create table if not exists public.bookings (
  id            bigint generated always as identity primary key,
  ref           text not null unique,
  booking_date  date not null,
  slot          text not null check (slot in ('morning', 'afternoon', 'evening')),
  customer_name text not null,
  phone         text not null,
  guests        integer check (guests > 0),
  status        text not null default 'pending_payment'
                check (status in ('pending_payment', 'payment_review', 'confirmed', 'rejected', 'cancelled', 'expired')),
  amount_pkr    integer,
  expires_at    timestamptz,
  admin_note    text,
  decided_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- The core invariant: at most one active booking per date+slot, enforced by Postgres.
create unique index if not exists uniq_active_slot
  on public.bookings (booking_date, slot)
  where status in ('pending_payment', 'payment_review', 'confirmed');

create index if not exists idx_bookings_date on public.bookings (booking_date);
create index if not exists idx_bookings_status on public.bookings (status);

create table if not exists public.payment_proofs (
  id           bigint generated always as identity primary key,
  booking_id   bigint not null references public.bookings (id) on delete cascade,
  storage_path text not null,
  mime_type    text not null,
  uploaded_at  timestamptz not null default now()
);

create index if not exists idx_proofs_booking on public.payment_proofs (booking_id);

create table if not exists public.slot_blocks (
  block_date date not null,
  slot       text not null check (slot in ('morning', 'afternoon', 'evening')),
  reason     text,
  created_at timestamptz not null default now(),
  primary key (block_date, slot)
);

-- All access goes through the API using the service-role key, which bypasses RLS.
-- Enabling RLS with no policies means the anon/public key can read or write nothing.
alter table public.settings       enable row level security;
alter table public.bookings       enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.slot_blocks    enable row level security;

-- Private bucket for payment screenshots (served to admins via signed URLs only).
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;
