# IPCM-TSU Platform

Website, student portal and admin portal for the **Institute of Peace and Conflict Management (IPCM), Taraba State University**. One Next.js app, one Supabase project.

The full specification is the *IPCM-TSU Platform — Master Build Prompt*; content comes from the *Content & Programme Brief*.

## Status

| Area | State |
| --- | --- |
| Public website, design system (`/styleguide`) | Done |
| Accounts, application wizard, Paystack | Done (Phase 1) |
| Admin review, offers, letters, receipts, emails | Done (Phase 1) |
| Classes: scores, results, optional attendance and timetable, announcements, class links | Done (Phase 2) |
| Certificates, statement of result, graduates list | Done (Phase 3) |

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

In **Authentication → Providers → Email** (or **Sign In / Providers**): turn **Confirm email OFF**.
Applicants go straight into their application after signing up; no email step. (If it is ever
switched back on, the app automatically falls back to the "check your email" flow below.)

In **Authentication → Policies / Passwords**: minimum length **8**, no required character types, and
**leaked password protection off**, so simple passwords such as a phone number are accepted.

In **Authentication → Rate Limits**: raise **sign-ups and sign-ins** (per 5 minutes per IP) to about **150**.
Applicants often register together on one shared Wi-Fi, which Supabase sees as a single IP address.

Before launch, set **Authentication → SMTP Settings** to a real sender (Resend, TSU address). The built-in
Supabase email is for testing only and allows just a few emails per hour for the whole project.

In **Authentication → Email Templates**, replace the templates (the reset template is still used; confirm-signup only matters if confirmation is switched back on) with the files in `supabase/email-templates/`:

- **Confirm signup** → `confirm-signup.html`
- **Reset password** → `reset-password.html`

These links go to `/auth/confirm` with a token hash. They work in any browser or device, and the
person must press a button, so email security scanners can't use the link up before they click.
The **Site URL** above must be the live site address, because the templates build links from it.

Set `NEXT_PUBLIC_SITE_URL` in Vercel to the same production URL, so email links point to the right place.

### Account flows

| Route | Purpose |
| --- | --- |
| `/register` | Create account (`?programme=NMA` pre-selects a programme) → `/verify-email` |
| `/auth/confirm` | Confirms sign-up and reset links (token hash, button press) |
| `/auth/callback` | Fallback for code-based links |
| `/login` | Sign in → `/admin` for staff, `/portal` for everyone else (`?next=` respected, same-site only) |
| `/forgot-password` → `/reset-password` | Password reset |

## Payments (Paystack)

Flow ("middle path"): choose programme → checklist + pay application fee → complete form → submit (free) → review →
offer → pay tuition → registration number issued automatically.

1. Vercel environment variables: `PAYSTACK_SECRET_KEY` (sk_test_… for now) and `SUPABASE_SERVICE_ROLE_KEY`
   (needed to confirm payments on the server).
2. Paystack dashboard → **Settings → API Keys & Webhooks** → Test Webhook URL:
   `https://<your-domain>/api/paystack/webhook`
3. Test cards: Paystack test card `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456`.

Amounts always come from `fee_items`; the browser never sends a price. Callback and webhook both verify with
Paystack server-to-server, and confirmation is idempotent (a repeated webhook does nothing).

### Receipts

Every successful payment has a receipt at `/portal/payments/<id>` (view, print) and `/portal/payments/<id>/pdf`
(A4 PDF). Each receipt carries a QR code linking to `/verify/receipt/<token>`, a public page that confirms the
receipt is genuine. The token is random (32 hex characters); sequential receipt numbers are never used in links.
The verify page shows no email, phone or payment reference. Set `NEXT_PUBLIC_SITE_URL` in Vercel to the final
domain so QR codes point to it. Design preview: `/styleguide/receipt` (`?v=valid`, `?v=invalid`).

## Admin portal (`/admin`)

| Area | Who | What |
|---|---|---|
| Dashboard | All staff | Counts to review, waiting, offers, admitted; money received (Bursary, Director, Super admin) |
| Applications | Admissions, Director, Super admin | Review documents (approve / reject with reason), ask for changes, make offer, decline, extend or withdraw an offer |
| Payments | Bursary, Director, Super admin | All Paystack payments, receipts and PDFs |
| Intakes | View: Admissions, Bursary. Edit: Director, Super admin | Dates, seats, status, days to pay |
| Fees | Bursary, Director, Super admin | Application fee and tuition per programme |
| Applicant help | Admissions, Director, Super admin | Correct an applicant's email, give a new password (applicant and student accounts only) |

Offers: valid 30 days by default (set per intake, 1–60 days). An offer needs every document approved and a free
seat (seats taken = admitted + offers not yet lapsed). After the last day the applicant can no longer pay and the
seat is free again; staff can extend or withdraw it. A payment Paystack confirms after the deadline still admits.
All decisions are recorded in the timeline and audit log. Design preview: `/styleguide/admin?view=dashboard`
(`list`, `review`, `offer`, `lapsed`, `intakes`, `fees`, `payments`, `help`; add `&role=bursary` etc.).

## More staff tools

- **Staff accounts** (`/admin/staff`, super admin): add staff (a one-time password is shown), change roles, switch
  accounts off. Adding an email that already has an account gives that account the role.
- **Messages** (`/admin/messages`): contact-form inbox with New / Replied / Closed.
- **Bank and sponsor payments** (`/admin/payments`, Bursary): record money paid outside Paystack by application
  number and bank reference; it issues the same receipt and email, and tuition admits the student. Migration 010.
- **CSV downloads** on Applications and Payments (opens in Excel).
- **Website** (`/admin/website`, editor): add, edit or remove People (with photo) and Research items (with PDF).
  Each section of the People page shows the sample list until someone is added to it.
- After admission, students can change phone and address but not their name or email (they appear on documents);
  staff correct those under Applicant help.

## Classes (Phase 2, `/admin/classes`)

Migration `20261008000012_classes.sql` adds this. Run it after 009, 010 and 011.

- **Who sees what.** The Director and super admins see every intake. A Facilitator sees only the intakes the Director assigns them to (Classes → intake → Overview → Facilitators). Create facilitators under Staff accounts with the Facilitator role.
- **Settings (Director).** Attendance per intake: Off (default), For information only, or Required with a minimum %. The minimum can be waived for any student. Also the class WhatsApp group link and an optional materials folder link (Drive), shown on each student's dashboard. No files are uploaded or recorded, so this stays a classroom programme, not ODL.
- **Timetable** is optional; nothing depends on it. Attendance needs a session to mark against.
- **Scores.** Facilitators and the Director enter module and capstone scores (0–100). Once results are published only the Director can change scores, after unpublishing.
- **Results (Director).** Calculate → check → Publish. Publishing marks students completed or failed and emails them. Unpublish to correct mistakes.
- **Announcements.** Posted to one intake only, with an option to email the class.

## Certificates (Phase 3, Classes → intake → Certificates)

Migration `20261008000013_certificates.sql` adds this. Run it after 012.

- **The website is the official register.** A certificate exists only if it is on record; anyone can check it by scanning its QR code (shows the holder's passport photo) or typing its number at `/verify`.
- **Who.** The Director or a super admin issues in one step. Only students whose results are published and who passed can get one; nobody can override that.
- **Frozen details.** Name, programme, intake and grade are copied onto the certificate when issued, so later edits never make the paper and the online check disagree.
- **Printing.** *Number and QR* (default) prints only the certificate number and QR code, bottom-right of an A4 landscape page, onto the Institute's own pre-printed certificate paper. *Full certificate* prints the whole design (fine wave border, microtext, watermark). Every download is counted; reprints are marked.
- **Collection.** Record who collected each certificate and what ID they showed.
- **Mistakes.** Revoke with a reason (kept private), optionally issuing a replacement with a new number. The old QR then says it was replaced.
- **Director emails.** Any issue, print, revoke or collection done by someone other than the Director emails every active Director. Everything is in the audit log.
- **Results stay published once certificates are out.** To correct a result: change the score, recalculate, then revoke and reissue that certificate.
- **Statement of result.** Students download it from Results once published; staff from the Certificates tab.
- **Graduates list.** Excel (CSV) download per intake.
- Specimen PDFs for design review: `/styleguide/certificate?kind=full|qr|statement` (disabled in production unless preview mode is on).

## Name corrections (Applicant help → Correct name)

Migration `20261008000014_name_correction.sql`. Admissions, the Director and super admins can correct an applicant's or student's name (title, first, other, surname) with a required reason. The old name, new name and reason go to the audit log, and the person is emailed. Admitted students can't change their own name. Certificates already issued keep the printed name; the screen lists them so the Director can revoke and reissue.

## Launch checklist

1. All migrations 001–014 run in order on the production database.
2. Remove test accounts: run the cleanup block at the bottom of `supabase/test-users.sql`.
3. Vercel: `NEXT_PUBLIC_PORTAL_PREVIEW=false`; `NEXT_PUBLIC_SITE_URL=https://ipcm.tsucpgs.com.ng`; `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `CONTACT_INBOX`, `CRON_SECRET` set.
4. Paystack: live keys, webhook URL `https://ipcm.tsucpgs.com.ng/api/paystack/webhook`.
5. Resend: domain verified (DNS), a test email received.
6. Real contact details, address and phone in `src/lib/site.ts`; real photos and the Director's bio under Website.
7. Create real staff accounts (Staff accounts) and make sure the Institute holds its own super admin.
8. Open an intake, set fees, and do one real ₦ payment end to end, then refund it in Paystack.
9. Print one specimen certificate on the Institute's paper and adjust the QR position if needed.

## Admission letters

Issued automatically when tuition is paid: `/portal/admission-letter/<application id>` (student) and
`/admin/applications/<id>/letter` (staff). A4 PDF with a QR code to `/verify/letter/<token>` (random token).
Director name and title come from `src/lib/site.ts` (`site.director`, currently a sample placeholder).

## Email (Resend)

Emails go to applicants when: the application fee is paid (receipt attached), the application is submitted,
documents are rejected, an offer is made, 7 and 2 days before an offer ends, an offer is extended or lapses,
the application is declined, and tuition is paid (admission letter and receipt attached). Every email is
recorded in `email_log` and shown on the staff review screen. Preview: `/styleguide/emails`.

Setup (one time):
1. Create an account at resend.com → **Domains → Add domain** → `ipcm.tsucpgs.com.ng`.
2. Resend shows 3–4 DNS records (MX and TXT for sending, a DKIM TXT, optionally DMARC). Add each one exactly
   as shown in the DNS settings for `tsucpgs.com.ng`, then click **Verify** in Resend (can take up to an hour).
3. Resend → **API Keys → Create** (sending access). In Vercel add:
   `RESEND_API_KEY`, `EMAIL_FROM="IPCM Admissions <admissions@ipcm.tsucpgs.com.ng>"`,
   `EMAIL_REPLY_TO` (an inbox someone reads), `CRON_SECRET` (any long random string). Redeploy.
4. Reminders run daily at 09:00 Nigerian time (`vercel.json` → `/api/cron/offer-reminders`).

Until the key is set, emails are skipped and logged as "Not sent (email not set up)"; everything else works.

## Public website

Pages: home, programmes (+5 detail pages), about, admissions, people, research, contact, FAQ, privacy, verify.
Copy lives in `src/lib/content.ts` (from the approved Content & Programme Brief). People and research posts read
from the `people` and `posts` tables and fall back to clearly tagged placeholders while those are empty.
The contact form stores messages in `contact_messages` (migration 009) and emails `CONTACT_INBOX`
(or `EMAIL_REPLY_TO`), with an acknowledgement to the sender; limited to 5 messages per hour per visitor.
Amber "Placeholder" tags disappear when `NEXT_PUBLIC_APP_ENV=production`.

## Test accounts (development and staging only)

Run `supabase/test-users.sql` in the Supabase SQL editor. It creates one confirmed account per role
(`superadmin@`, `director@`, `admissions@`, `bursary@`, `facilitator@`, `editor@`, `applicant@`,
`student@` — all `@example.com`), password **ipcm2027**. A cleanup block at the bottom removes them.

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
