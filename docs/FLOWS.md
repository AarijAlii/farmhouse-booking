# How the farmhouse booking system works

This document describes every flow in the backend: what customers do, what the admin
(owner) does, how payment verification works, and what the system enforces automatically.

## The basics

- One farmhouse, three bookable slots per day (Pakistan time):

  | Slot      | Hours              |
  | --------- | ------------------ |
  | morning   | 6:00 am – 12:00 pm |
  | afternoon | 12:00 pm – 6:00 pm |
  | evening   | 6:00 pm – 12:00 am |

  There is no slot between 12:00 am and 6:00 am.

- **Customers never sign up.** There are no customer accounts, passwords, or emails.
  A customer's booking is identified by a **reference code** (e.g. `FH-Q4DQXJ`) plus
  their **phone number**. The only login in the system belongs to the owner/admin.

- Payment is a **manual JazzCash transfer**. There is no payment gateway. The customer
  sends money to the owner's JazzCash account and uploads a screenshot of the receipt.
  A human (the admin) verifies every payment — nothing is auto-confirmed.

## Booking statuses

Every booking is always in exactly one of these states:

| Status            | Meaning                                                            | Holds the slot? |
| ----------------- | ------------------------------------------------------------------ | --------------- |
| `pending_payment` | Booking created; waiting for the customer to pay and upload proof  | Yes             |
| `payment_review`  | Screenshot uploaded; waiting for the admin to verify               | Yes             |
| `confirmed`       | Admin verified the payment — booking is final                      | Yes             |
| `rejected`        | Admin rejected the payment proof                                   | No              |
| `cancelled`       | Admin cancelled (e.g. customer backed out after confirmation)      | No              |
| `expired`         | Customer never paid within the payment window                      | No              |

```
                       customer uploads                admin
 pending_payment ────── screenshot ──────> payment_review ──────> confirmed
       │                                        │                     │
       │ payment window                         │ admin rejects       │ admin cancels
       │ (default 3h) passes                    v                     v
       └──────────> expired                 rejected             cancelled
```

The three "holds the slot" statuses are what the availability calendar treats as booked.
A slot occupied by an active booking cannot be booked by anyone else — this is enforced
by the database itself (a unique index), so even two people clicking submit in the same
millisecond cannot double-book.

## Customer flows

### 1. Checking availability

The customer opens the booking site and sees a calendar. For each day, each of the three
slots shows one of:

- `available` — can be booked
- `booked` — someone holds it (pending, under review, or confirmed)
- `blocked` — the owner closed it (maintenance, personal use, etc.)
- `past` — the slot's end time has already passed in Pakistan time

Bookings can be made up to **90 days** in advance.

*Endpoint: `GET /api/availability?month=2026-07`*

### 2. Creating a booking

The customer fills one form:

| Field         | Rules                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Name          | 2–100 characters                                                       |
| Phone         | Pakistani mobile — accepts `03001234567`, `+92 300 1234567`, etc.; normalized to `03XXXXXXXXX` |
| CNIC          | 13 digits, with or without dashes; normalized to `#####-#######-#`     |
| Adults        | 1–100                                                                  |
| Children      | 0–100                                                                  |
| Date + slot   | Chosen from the calendar                                               |

On submit, the system:

1. Validates every field (unknown/extra fields are rejected outright).
2. Checks the slot isn't past, blocked, or already taken.
3. Creates the booking as `pending_payment` and **holds the slot**.
4. Sets a payment deadline (default **3 hours**, configurable by the admin).
5. Returns the **reference code**, the **amount** (price is per-slot, set by the admin),
   and the **JazzCash payment details** (account name, number, instructions).

The customer should save the reference code — it is how they track the booking.

*Endpoint: `POST /api/bookings`*

### 3. Paying and uploading the screenshot

The customer sends the amount to the shown JazzCash account from their own JazzCash app,
takes a screenshot of the receipt, and uploads it with their phone number.

- Accepted: JPEG, PNG, or WebP, up to 5 MB. The file's actual bytes are inspected —
  a non-image renamed to `.png` is rejected.
- Up to **3 screenshots** per booking (e.g. re-upload if the first was blurry).
- On upload the booking moves to `payment_review` and the payment deadline is cleared —
  the customer has done their part; the clock is no longer running against them.

*Endpoint: `POST /api/bookings/{ref}/proof`*

### 4. Checking booking status

At any time, the customer provides their reference code + phone number and sees their
booking's current status (and the payment details again, if still relevant). Wrong phone
number → nothing is revealed, not even whether the reference exists.

What the customer sees: date, slot, name, adults/children, status, amount, deadline.
What the customer never sees returned: their CNIC or phone (kept server-side only).

*Endpoint: `GET /api/bookings/{ref}?phone=...`*

### If the customer never pays

When the payment deadline passes, the booking flips to `expired` automatically and the
slot opens up again. (This happens lazily — the system re-checks whenever anyone looks
at availability or books — so no background jobs are needed.)

## Admin (owner) flows

The admin signs in with email + password (Supabase Auth). Only emails listed in the
`ADMIN_EMAILS` environment variable are accepted, even with a valid login. All admin
endpoints require this; everyone else gets 401/403.

### 1. Verifying payments (the review queue)

The admin lists bookings filtered by status — the working queue is `payment_review`.
For each booking the admin sees **everything**: name, phone, decrypted CNIC,
adults/children, amount, and the uploaded screenshots as secure links that expire after
10 minutes.

The admin compares the screenshot against their actual JazzCash account (amount received,
sender, transaction time) and then:

- **Confirm** → booking becomes `confirmed`. The slot is theirs.
- **Reject** (optionally with a note) → booking becomes `rejected`, slot is released.

Decisions are atomic: if two admin sessions click at once, the second gets a clean
"already decided" error — a decision can never be applied twice.

*Endpoints: `GET /api/admin/bookings?status=payment_review`, `POST /api/admin/bookings/{id}` with `{"action": "confirm" | "reject", "note": "..."}`*

### 2. Cancelling a booking

If a confirmed customer backs out (or any active booking needs to be killed), the admin
uses `cancel`. The slot is released immediately. Refunds, if any, are handled outside the
system (JazzCash transfer back) — the system only tracks the state.

### 3. Blocking slots

The admin can close any slots on any date (family use, maintenance, an off day) and
reopen them later. Blocked slots show as `blocked` on the customer calendar and cannot
be booked. Blocking does **not** touch existing bookings on that date — those must be
decided explicitly (confirm/reject/cancel), so nobody's booking silently disappears.

*Endpoint: `POST /api/admin/blocks` with `{"date", "slots": [...], "blocked": true|false, "reason"}`*

### 4. Prices and payment details

The admin can change at any time:

- `price_morning_pkr`, `price_afternoon_pkr`, `price_evening_pkr` — per-slot prices
- `jazzcash_name`, `jazzcash_number`, `payment_instructions` — what customers are shown
- `pending_payment_hours` — how long customers get to pay before expiry

Price changes affect **new** bookings only; an existing booking keeps the amount it was
created with.

*Endpoints: `GET /api/admin/settings`, `PUT /api/admin/settings`*

## Abuse protection (what the system enforces automatically)

| Threat                                      | Protection                                                        |
| ------------------------------------------- | ----------------------------------------------------------------- |
| Double booking a slot                       | Unique index in the database — physically impossible              |
| Holding slots without paying                | Payment deadline + automatic expiry                               |
| One person mass-holding slots               | 1 pending booking per phone at a time; max 3 bookings/phone/day   |
| Flooding the API                            | Per-IP rate limits on booking, upload, and lookup endpoints       |
| Uploading malware disguised as a screenshot | Byte-level image verification; only real JPEG/PNG/WebP accepted   |
| Storage abuse via uploads                   | 5 MB per file, max 3 files per booking, private bucket            |
| Guessing reference codes                    | Unguessable codes + phone must match + rate-limited lookups       |
| Stealing customer identity data             | CNIC encrypted (AES-256-GCM) before storage; CNIC/phone never in public responses |
| Tampering with requests                     | Strict validation; unknown fields rejected; statuses can only move along the allowed transitions |
| Snooping browser-side                       | The browser key (anon) can read/write nothing; all data flows through the server |

## Data stored per booking

| Data                | Where                              | Who can see it                       |
| ------------------- | ---------------------------------- | ------------------------------------ |
| Name, date, slot, adults, children, status, amount | `bookings` table | Customer (own booking) + admin       |
| Phone               | `bookings` table                   | Admin only (customer proves it, never reads it) |
| CNIC                | `bookings` table, **encrypted**    | Admin only, decrypted on demand      |
| Payment screenshots | Private storage bucket             | Admin only, via 10-minute signed URLs |
