-- Replace the single guests count with adults / children, and add CNIC.
-- CNIC is sensitive PII: it is never exposed through public endpoints.

alter table public.bookings drop column if exists guests;

alter table public.bookings
  add column if not exists adults   integer not null default 1 check (adults between 1 and 100),
  add column if not exists children integer not null default 0 check (children between 0 and 100),
  add column if not exists cnic     text not null default '' check (cnic = '' or cnic ~ '^\d{5}-\d{7}-\d$');
