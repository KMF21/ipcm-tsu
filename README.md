# IPCM-TSU Platform

Website, student portal and admin portal for the **Institute of Peace and Conflict Management (IPCM), Taraba State University**. One Next.js app, one Supabase project.

The full specification is the *IPCM-TSU Platform — Master Build Prompt*; content comes from the *Content & Programme Brief*.

## Status: Phase 0 (foundation + design preview)

| Area | State |
| --- | --- |
| Design system (tokens, fonts, 20+ components) | Done — see `/styleguide` |
| Homepage | Done (placeholder content) |
| Programme pages (all 5) | Done — `/programmes/[slug]` |
| Student dashboard | Done with demo data — `/portal` |
| Supabase schema, business logic, RLS, storage, seed | Done and tested (`pnpm test:db`) |
| Other pages | "Coming soon" stubs so no link 404s |
| Accounts (register, verify, login, reset, logout, role redirects) | Done (Phase 1) |
| Applications, Paystack, admin | Phase 1, next |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the keys
pnpm dev                  # http://localhost:3000
```

Pages to review: `/`, `/programmes/negotiation-mediation-adr`, `/portal`, `/styleguide`.

## Database

Migrations live in `supabase/migrations`; seed data in `supabase/seed.sql`.

```bash
# Option A — Supabase CLI
npx supabase link --project-ref qvromyptbhzkziultlpd
npx supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql

# Option B — paste each migration, in order, then seed.sql into the Supabase SQL editor
```

After the first sign-up, make yourself super admin in the SQL editor:

```sql
update public.profiles set role = 'super_admin' where email = 'you@example.com';
```

(The role guard allows this from the SQL editor because it runs without a signed-in user's JWT; from the app only a super admin can change roles.)

## Supabase Auth settings (one-time)

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** your production URL (e.g. `https://ipcm.tsu.edu.ng`, or the Vercel URL for now)
- **Redirect URLs:** add `https://<your-domain>/auth/callback` and `http://localhost:3000/auth/callback`

In **Authentication → Providers → Email**: keep **Confirm email** on.

Set `NEXT_PUBLIC_SITE_URL` in Vercel to the same production URL, so email links point to the right place.

### Account flows

| Route | Purpose |
| --- | --- |
| `/register` | Create account (`?programme=NMA` pre-selects a programme) → `/verify-email` |
| `/auth/callback` | Handles links in confirmation and reset emails |
| `/login` | Sign in → `/admin` for staff, `/portal` for everyone else (`?next=` respected, same-site only) |
| `/forgot-password` → `/reset-password` | Password reset |

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm typecheck` | TypeScript, strict |
| `pnpm test` | Unit tests (fees, programmes, helpers) |
| `pnpm test:db` | Runs all migrations + seed in embedded Postgres and tests the admissions and payment flow: numbering, idempotent webhook, amount check, illegal transitions, role protection |
| `pnpm seed:generate` | Regenerates `supabase/seed.sql` from `src/lib/programmes.ts` |
| `pnpm placeholders:generate` | Regenerates placeholder images |

## Key rules (from the build prompt)

- The database is the source of truth: amounts (kobo), statuses and numbers are computed server-side only.
- No text smaller than 14px; reading text 16px+; inputs 16px.
- Design at 360px first. No horizontal scrolling at any width.
- Crimson is reserved for errors, overdue and destructive actions; peace teal is the action colour.
- Every image slot reads from `src/lib/images.ts`. Placeholders are flagged and must be replaced before launch.
- Contact details not yet supplied are placeholders in `src/lib/site.ts` (moving to `site_settings` in Phase 1). The address is TSU's official address.

## Numbers

| Number | Format |
| --- | --- |
| Application reference | `APP-YY-XXXXXX` |
| Registration number | `TSU/IPCM/{CODE}/{COHORT YEAR}/{NNNN}` (issued when tuition is confirmed) |
| Certificate number | `IPCM-{CODE}-{YYYY}-{NNNN}` |
| Receipt number | `RCT-{YYYY}-{NNNNNN}` |

## Environment variables

See `.env.example`. Never commit `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` are server-only.
