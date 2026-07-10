# Database backups

A GitHub Action ([.github/workflows/db-backup.yml](../.github/workflows/db-backup.yml))
dumps the whole database every night at 3:30 am Pakistan time, encrypts it, and stores it
as a workflow artifact for 30 days.

## One-time setup (repository secrets)

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

1. `SUPABASE_DB_URL` — Supabase dashboard → **Connect** (top bar) → **Session pooler** →
   copy the connection string and replace `[YOUR-PASSWORD]` with the database password.
2. `BACKUP_PASSPHRASE` — any long random passphrase (30+ characters). **Save it in a
   password manager** — backups cannot be decrypted without it.

Then test it once: repo → Actions → "Nightly database backup" → **Run workflow**.

## Restoring a backup

1. Repo → Actions → pick a successful backup run → download the `db-backup-N` artifact.
2. Unzip it, then decrypt and restore:

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:YOUR_PASSPHRASE -in backup.sql.gz.enc -out backup.sql.gz
gunzip backup.sql.gz
psql "SESSION_POOLER_CONNECTION_STRING" -f backup.sql
```

Restore into a fresh Supabase project (or after wiping the schema) to avoid conflicts.
Screenshots in storage are not part of this dump — they are transient by design
(auto-deleted 7 days after each visit), so the database is the source of truth.

## What this protects against

- Accidental deletion of rows or tables (yours or a bad migration)
- The Supabase project being deleted or lost
- Anything else, up to 24 hours of data loss (the time since the last nightly dump)
