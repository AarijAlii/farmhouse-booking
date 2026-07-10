-- Multi-slot bookings (2-slot and full-day packages), add-ons, food orders,
-- and policy acceptance.

-- A booking can now span 1-3 slots. `slot` is kept (first slot) for
-- compatibility; `slots` is the source of truth.
alter table public.bookings
  add column if not exists slots text[],
  add column if not exists extras jsonb not null default '{}'::jsonb,
  add column if not exists policies_accepted_at timestamptz;

update public.bookings set slots = array[slot] where slots is null;

-- Physical truth of who holds which slot. The primary key makes double-booking
-- impossible regardless of how many slots a booking spans.
create table if not exists public.slot_holds (
  booking_date date not null,
  slot         text not null check (slot in ('morning', 'afternoon', 'evening')),
  booking_id   bigint not null references public.bookings (id) on delete cascade,
  primary key (booking_date, slot)
);

create index if not exists idx_slot_holds_booking on public.slot_holds (booking_id);
alter table public.slot_holds enable row level security;

-- Trigger keeps slot_holds in sync on every code path: rows exist exactly
-- while the booking is in an active status. A conflicting insert raises
-- 23505 and aborts the booking insert, same as the old unique index.
create or replace function public.sync_slot_holds() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  s text;
  active constant text[] := array['pending_payment', 'payment_review', 'confirmed'];
begin
  if tg_op = 'INSERT' then
    if new.status = any(active) then
      foreach s in array coalesce(new.slots, array[new.slot]) loop
        insert into slot_holds (booking_date, slot, booking_id) values (new.booking_date, s, new.id);
      end loop;
    end if;
  elsif tg_op = 'UPDATE' then
    if (old.status = any(active)) and not (new.status = any(active)) then
      delete from slot_holds where booking_id = new.id;
    elsif not (old.status = any(active)) and (new.status = any(active)) then
      foreach s in array coalesce(new.slots, array[new.slot]) loop
        insert into slot_holds (booking_date, slot, booking_id) values (new.booking_date, s, new.id);
      end loop;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_slot_holds on public.bookings;
create trigger trg_sync_slot_holds
  after insert or update of status on public.bookings
  for each row execute function public.sync_slot_holds();

-- Backfill holds for anything currently active, then retire the old
-- single-slot unique index (slot_holds' primary key replaces it).
insert into public.slot_holds (booking_date, slot, booking_id)
select booking_date, unnest(coalesce(slots, array[slot])), id
from public.bookings
where status in ('pending_payment', 'payment_review', 'confirmed')
on conflict do nothing;

drop index if exists public.uniq_active_slot;

-- Package prices, add-on prices, and the editable food menu.
insert into public.settings (key, value) values
  ('price_two_slots_pkr',         '40000'),
  ('price_two_slots_weekend_pkr', '50000'),
  ('price_full_day_pkr',          '50000'),
  ('price_full_day_weekend_pkr',  '60000'),
  ('addon_bonfire_pkr',           '1500'),
  ('addon_room_pkr',              '2000'),
  ('food_menu', '[{"id":"biryani","name":"Chicken biryani (per head)","price_pkr":450},{"id":"karahi","name":"Chicken karahi (full)","price_pkr":2200},{"id":"daal-chawal","name":"Daal chawal (per head)","price_pkr":350},{"id":"paratha","name":"Aloo paratha (each)","price_pkr":150},{"id":"chai","name":"Chai (per cup)","price_pkr":100},{"id":"drinks","name":"Soft drink (1.5L)","price_pkr":350}]')
on conflict (key) do nothing;
