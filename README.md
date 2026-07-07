# Farmhouse booking

Booking system for a single farmhouse with three daily slots (Pakistan time):

| Slot      | Hours              |
| --------- | ------------------ |
| morning   | 6:00 am – 12:00 pm |
| afternoon | 12:00 pm – 6:00 pm |
| evening   | 6:00 pm – 12:00 am |

Customers book a slot, pay via JazzCash (manual transfer — no payment gateway), and upload a
receipt screenshot. An admin reviews the screenshot and confirms or rejects the booking.

Customers do **not** sign up. The booking form collects name, phone, CNIC, adults, and
children; afterwards the customer tracks their booking with a reference code + phone number.
The only account in the system is the owner/admin login (Supabase Auth).

## Stack

- **Next.js (App Router, TypeScript)** — frontend and API routes in one app, deployed on Vercel
- **Supabase** — Postgres database, private storage bucket for screenshots, auth for the admin login
- Double bookings are impossible by construction: a partial unique index on
  `(booking_date, slot)` over active statuses rejects the second insert at the database level.
- No cron for expiry: pending bookings past their payment deadline are lazily expired whenever
  availability is read or a booking is created.

## Booking lifecycle

```
pending_payment ── screenshot uploaded ──> payment_review ── admin ──> confirmed | rejected
      │                                                                    │
      └── payment window passes ──> expired                confirmed ── admin ──> cancelled
```

## Security measures

- RLS enabled with zero policies: the browser-side anon key can touch nothing; all data
  access goes through API routes using the server-only service-role key.
- Double-booking prevented by the database (partial unique index), not application logic.
- Admin routes require a Supabase Auth token **and** an email allowlist (`ADMIN_EMAILS`).
- Screenshots: magic-byte sniffed (content must really be JPEG/PNG/WebP), 5 MB cap,
  max 3 per booking, stored in a private bucket, served to admins via 10-minute signed URLs.
- CNIC and phone are never returned by public endpoints.
- Abuse caps in the database (survive serverless restarts): one pending booking per phone,
  max 3 bookings per phone per day. Per-IP rate limits on all public mutating endpoints.
- Strict input validation (zod, `.strict()` — unknown fields rejected), normalized phone/CNIC.
- Security headers: HSTS, nosniff, frame denial, restrictive permissions policy.

## Local setup

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. In the Supabase **SQL editor**, run `supabase/migrations/0001_init.sql`.
3. In **Authentication → Users**, add the admin user (email + password).
4. Copy `.env.example` to `.env.local` and fill in the values from **Project settings → API**.
   Put the admin email in `ADMIN_EMAILS`.
5. `npm install && npm run dev`

## API

Public:

| Method | Path                        | Purpose                                        |
| ------ | --------------------------- | ---------------------------------------------- |
| GET    | `/api/availability?month=`  | Slot status per day for a month                |
| GET    | `/api/settings`             | Prices, slot times, JazzCash payment details   |
| POST   | `/api/bookings`             | Create a booking (holds the slot)              |
| GET    | `/api/bookings/:ref?phone=` | Customer checks their booking                  |
| POST   | `/api/bookings/:ref/proof`  | Upload payment screenshot (multipart)          |
| GET    | `/api/health`               | Liveness + keeps free Supabase project awake   |

Admin (Supabase Auth bearer token, email allowlisted via `ADMIN_EMAILS`):

| Method  | Path                      | Purpose                                    |
| ------- | ------------------------- | ------------------------------------------ |
| GET     | `/api/admin/bookings`     | List bookings, screenshots as signed URLs  |
| POST    | `/api/admin/bookings/:id` | `confirm` / `reject` / `cancel`            |
| POST    | `/api/admin/blocks`       | Block or unblock slots                     |
| GET/PUT | `/api/admin/settings`     | Read / update prices and payment details   |

## Deployment

1. Push this repo to GitHub.
2. Import it on [vercel.com](https://vercel.com) and add the four environment variables
   from `.env.example` in the project settings.
3. Done — `vercel.json` already schedules a daily cron ping to `/api/health` so the free
   Supabase project never pauses from inactivity.
