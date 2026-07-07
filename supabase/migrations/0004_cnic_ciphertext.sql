-- CNIC is now encrypted at the application level (AES-256-GCM) before insert,
-- so the plaintext format check no longer applies to the stored value.
alter table public.bookings drop constraint if exists bookings_cnic_check;
