// Runs every migration + seed in embedded Postgres (PGlite) with Supabase auth/storage stand-ins,
// then tests the admissions and payment flow end to end. Run: npm run test:db
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readFileSync, readdirSync } from 'node:fs'
const dir = process.argv[2] ?? new URL('../supabase', import.meta.url).pathname
const db = new PGlite({ extensions: { pgcrypto } })
// Minimal stand-ins for Supabase's auth and storage schemas
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true),'')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name,'/') $$;
`)
for (const f of readdirSync(dir + '/migrations').sort()) {
  try { await db.exec(readFileSync(`${dir}/migrations/${f}`, 'utf8')); console.log('OK', f) }
  catch (e) { console.log('FAIL', f, e.message); process.exit(1) }
}
try { await db.exec(readFileSync(`${dir}/seed.sql`, 'utf8')); console.log('OK seed.sql') } catch (e) { console.log('SEED FAIL:', e.message, e.position); process.exit(1) }

// ---- Behaviour tests ----
console.log('states/lgas:', (await db.query(`select (select count(*) from public.states) s, (select count(*) from public.lgas) l, (select count(*) from public.lgas l join public.states s on s.id=l.state_id where s.name='Taraba') taraba`)).rows[0])
const one = async (s, p) => (await db.query(s, p)).rows
const [u] = await one(`insert into auth.users (email, raw_user_meta_data) values ('amina@example.com','{"first_name":"Amina","surname":"Bello"}') returning id`)
const [prof] = await one(`select role, first_name from public.profiles where id=$1`, [u.id]); console.log('profile on signup:', prof)
const [c] = await one(`select c.id cohort, p.id prog from public.cohorts c join public.programmes p on p.id=c.programme_id where p.code='NMA'`)
const [a] = await one(`insert into public.applications (user_id, programme_id, cohort_id) values ($1,$2,$3) returning id, ref, status`, [u.id, c.prog, c.cohort]); console.log('application:', a.ref, a.status)
const fees = await one(`select id, type from public.fee_items where programme_id=$1`, [c.prog])
const fid = (t) => fees.find((f) => f.type === t).id
let failures = 0
const check = (label, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`); if (!ok) failures++ }
const as = async (uid) => db.exec(uid ? `set request.jwt.sub = '${uid}'` : `reset request.jwt.sub`)

// Middle path: choose programme -> pay application fee -> fill form -> submit (free)
await as(u.id)
try { await one(`select public.applicant_submit($1)`, [a.id]); check('cannot submit before paying', false) } catch (e) { check('cannot submit before paying', /Pay the application fee first/.test(e.message)) }
const [{ r: pay1 }] = await one(`select public.create_payment('application') r`)
check('create_payment uses server-side amount', pay1.amount_kobo === 1530000, String(pay1.amount_kobo))
await as(null)
const r1 = (await one(`select public.confirm_payment($1, 1530000, '{}'::jsonb) r`, [pay1.reference]))[0].r
check('application fee confirmed with receipt', /^RCT-\d{4}-\d{6}$/.test(r1.receipt_no), r1.receipt_no)
const r1b = (await one(`select public.confirm_payment($1, 1530000, '{}'::jsonb) r`, [pay1.reference]))[0].r
check('replayed webhook is ignored', r1b.already_processed === true)
const st1 = (await one(`select status, application_fee_paid_at is not null paid from public.applications where id=$1`, [a.id]))[0]
check('paying unlocks the form but does not submit', st1.status === 'draft' && st1.paid === true, JSON.stringify(st1))
await as(u.id)
try { await one(`select public.create_payment('application')`); check('cannot pay application fee twice', false) } catch (e) { check('cannot pay application fee twice', /already paid/.test(e.message)) }
try { await one(`select public.create_payment('tuition')`); check('tuition not due before offer', false) } catch (e) { check('tuition not due before offer', /not due/.test(e.message)) }
await one(`select public.applicant_submit($1)`, [a.id])
check('applicant submits for free after paying', (await one(`select status from public.applications where id=$1`, [a.id]))[0].status === 'submitted')
await as(null)
try { await one(`select public.transition_application($1,'admitted',$2)`, [a.id, u.id]); check('illegal jump blocked', false) } catch (e) { check('illegal jump blocked', /not allowed/.test(e.message)) }
await one(`select public.transition_application($1,'under_review',$2)`, [a.id, u.id])
await one(`select public.transition_application($1,'offered',$2)`, [a.id, u.id])
await as(u.id)
const [{ r: pay2 }] = await one(`select public.create_payment('tuition') r`)
check('tuition amount from fee table', pay2.amount_kobo === 3530000, String(pay2.amount_kobo))
await as(null)
try { await one(`select public.confirm_payment($1, 100, '{}'::jsonb)`, [pay2.reference]); check('wrong amount rejected', false) } catch (e) { check('wrong amount rejected', /Amount mismatch/.test(e.message)) }
const [{ r: pay3 }] = await (async () => { await as(u.id); const x = await one(`select public.create_payment('tuition') r`); await as(null); return x })()
const r3 = (await one(`select public.confirm_payment($1, 3530000, '{}'::jsonb) r`, [pay3.reference]))[0].r
check('tuition issues registration number', r3.reg_no === 'TSU/IPCM/NMA/2027/0001', r3.reg_no)
check('applicant becomes student', (await one(`select role from public.profiles where id=$1`, [u.id]))[0].role === 'student')
console.log('history:', (await one(`select string_agg(to_status::text, ' > ' order by id) h from public.application_status_history`))[0].h)
// Applicants cannot confirm their own payments
await as(u.id)
try { await one(`set role authenticated`); await one(`select public.confirm_payment('x', 1, '{}'::jsonb)`); check('applicant cannot call confirm_payment', false) } catch (e) { check('applicant cannot call confirm_payment', /permission denied/.test(e.message), e.message.slice(0, 60)) } finally { await one(`reset role`) }
await as(null)
// A signed-in user must not be able to promote themselves
await db.exec(`set request.jwt.sub = '${u.id}'`)
try { await one(`update public.profiles set role='super_admin' where id=$1`, [u.id]); check('self-promotion blocked', false) } catch (e) { check('self-promotion blocked', /Only a super admin/.test(e.message)) }
// SQL editor / service role (no end-user JWT) may grant roles
await db.exec(`reset request.jwt.sub`)
await one(`update public.profiles set role='super_admin' where id=$1`, [u.id])
check('SQL editor can grant roles', (await one(`select role from public.profiles where id=$1`, [u.id]))[0].role === 'super_admin')
// Receipts and QR verification
const [p1] = await one(`select id, verify_token from public.payments where reference=$1`, [pay1.reference])
check('payment has unguessable verify token', /^[0-9a-f]{32}$/.test(p1.verify_token))
await as(u.id)
const rc = (await one(`select public.get_receipt($1) r`, [p1.id]))[0].r
check('payer can load own receipt', rc?.receipt_no === r1.receipt_no && rc.amount_kobo === 1530000 && rc.fee_type === 'application', rc?.receipt_no)
const rcT = (await one(`select public.get_receipt(id) r from public.payments where reference=$1`, [pay3.reference]))[0].r
check('tuition receipt shows registration number', rcT?.reg_no === 'TSU/IPCM/NMA/2027/0001', rcT?.reg_no)
const [u2] = await one(`insert into auth.users (email) values ('other@example.com') returning id`)
await as(u2.id)
check('other users cannot load the receipt', (await one(`select public.get_receipt($1) r`, [p1.id]))[0].r === null)
const pending = (await one(`select public.get_receipt(id) r from public.payments where reference=$1`, [pay2.reference]))[0].r
check('failed payment has no receipt', pending === null)
await as(null)
const v = (await one(`select public.verify_receipt($1) r`, [p1.verify_token]))[0].r
check('QR verify shows valid receipt', v?.valid === true && v.receipt_no === r1.receipt_no && v.payer_name === 'Amina Bello', JSON.stringify(v)?.slice(0, 80))
check('QR verify hides email and reference', v && !('payer_email' in v) && !('reference' in v))
check('unknown token is not valid', (await one(`select public.verify_receipt('0123456789abcdef0123456789abcdef') r`))[0].r === null)
check('receipt number cannot be used as token', (await one(`select public.verify_receipt($1) r`, [r1.receipt_no]))[0].r === null)

// ---- Admin review: staff decisions, offers, expiry ----
await as(null)
await db.exec(`grant usage on schema public to authenticated; grant select, insert, update, delete on all tables in schema public to authenticated;`)
const newApplicant = async (email) => {
  const [x] = await one(`insert into auth.users (email, raw_user_meta_data) values ($1,'{"first_name":"Test","surname":"Applicant"}') returning id`, [email])
  const [app] = await one(`insert into public.applications (user_id, programme_id, cohort_id) values ($1,$2,$3) returning id`, [x.id, c.prog, c.cohort])
  return { uid: x.id, app: app.id }
}
const b = await newApplicant('bola@example.com')
await as(b.uid); const [{ r: pb }] = await one(`select public.create_payment('application') r`); await as(null)
await one(`select public.confirm_payment($1, 1530000, '{}'::jsonb)`, [pb.reference])
await as(b.uid); await one(`select public.applicant_submit($1)`, [b.app]); await as(null)
const [doc1] = await one(`insert into public.documents (application_id, user_id, type, storage_path, mime, size_bytes) values ($1,$2,'passport_photo','x/a.jpg','image/jpeg',1000) returning id`, [b.app, b.uid])
const [doc2] = await one(`insert into public.documents (application_id, user_id, type, storage_path, mime, size_bytes) values ($1,$2,'qualification','x/b.pdf','application/pdf',1000) returning id`, [b.app, b.uid])
const [staff] = await one(`insert into auth.users (email) values ('officer@example.com') returning id`)
await one(`update public.profiles set role='admissions' where id=$1`, [staff.id])
const expectErr = async (label, sql, params, re) => {
  try { await one(sql, params); check(label, false, 'no error') } catch (e) { check(label, re.test(e.message), e.message.slice(0, 70)) }
}
await as(b.uid)
await expectErr('applicant cannot make an offer', `select public.staff_make_offer($1)`, [b.app], /Only admissions staff/)
await as(staff.id)
await expectErr('offer needs every document approved', `select public.staff_make_offer($1)`, [b.app], /Approve every document/)
check('failed offer changes nothing', (await one(`select status from public.applications where id=$1`, [b.app]))[0].status === 'submitted')
await one(`select public.staff_start_review($1)`, [b.app])
check('staff start the review', (await one(`select status from public.applications where id=$1`, [b.app]))[0].status === 'under_review')
await expectErr('rejection needs a reason', `select public.staff_review_document($1, false, '')`, [doc1.id], /reason/)
await one(`select public.staff_review_document($1, false, 'Photo is blurred. Upload a clear one.')`, [doc1.id])
await one(`select public.staff_review_document($1, true)`, [doc2.id])
await one(`select public.staff_request_changes($1, 'Please replace your photo')`, [b.app])
check('changes requested after rejection', (await one(`select status from public.applications where id=$1`, [b.app]))[0].status === 'changes_requested')
await one(`select public.staff_review_document($1, true)`, [doc1.id]) // stands in for the applicant replacing it
await as(b.uid); await one(`select public.applicant_resubmit($1)`, [b.app]); await as(staff.id)
await one(`update public.cohorts set capacity = 1 where id=$1`, [c.cohort]) // the earlier applicant is admitted
await expectErr('full intake blocks offers', `select public.staff_make_offer($1)`, [b.app], /intake is full/)
await one(`update public.cohorts set capacity = 40 where id=$1`, [c.cohort])
await one(`select public.staff_make_offer($1)`, [b.app])
const off = (await one(`select status, extract(day from offer_expires_at - now())::int d from public.applications where id=$1`, [b.app]))[0]
check('offer is valid for 30 days by default', off.status === 'offered' && off.d >= 30 && off.d <= 31, JSON.stringify(off))
await expectErr('cannot extend into the past', `select public.staff_extend_offer($1, current_date - 2)`, [b.app], /today or a later date/)
await one(`select public.staff_extend_offer($1, current_date + 45)`, [b.app])
check('offer extended', (await one(`select extract(day from offer_expires_at - now())::int d from public.applications where id=$1`, [b.app]))[0].d >= 45)
await as(null); await one(`update public.applications set offer_expires_at = now() - interval '1 day' where id=$1`, [b.app])
await as(b.uid)
await expectErr('expired offer cannot be paid', `select public.create_payment('tuition')`, [], /expired/)
await as(staff.id)
await expectErr('withdrawal needs a reason', `select public.staff_withdraw_offer($1, ' ')`, [b.app], /reason/)
await one(`select public.staff_withdraw_offer($1, 'Did not pay before the deadline')`, [b.app])
check('offer withdrawn', (await one(`select status from public.applications where id=$1`, [b.app]))[0].status === 'withdrawn')
check('timeline records each step', Number((await one(`select count(*) n from public.application_status_history where application_id=$1`, [b.app]))[0].n) >= 7)
// Applicants can edit their draft but never mark it paid
const d = await newApplicant('dayo@example.com')
await as(d.uid)
await one(`set role authenticated`)
try {
  await one(`update public.applications set step_data='{"x":1}' where id=$1`, [d.app]); check('applicant can still edit own draft', true)
  await expectErr('applicant cannot mark own fee paid', `update public.applications set application_fee_paid_at=now() where id=$1`, [d.app], /only be changed by the Institute/)
} catch (e) { check('applicant can still edit own draft', false, e.message) } finally { await one(`reset role`) }
await as(null)

await as(staff.id)
const dash = (await one(`select public.staff_dashboard() r`))[0].r
check('dashboard counts applications', dash.admitted === 1 && !('received_kobo' in dash), JSON.stringify(dash).slice(0, 90))
await as(null); await one(`update public.profiles set role='bursary' where id=$1`, [staff.id]); await as(staff.id)
const dash2 = (await one(`select public.staff_dashboard() r`))[0].r
check('bursary sees money received', dash2.received_kobo === 1530000 * 2 + 3530000, String(dash2.received_kobo))
const seats = (await one(`select * from public.staff_intake_seats() where cohort_id=$1`, [c.cohort]))[0]
check('intake seats counted', seats.admitted === 1 && seats.seats_taken === 1, JSON.stringify(seats))
await as(b.uid)
await expectErr('applicants cannot see the dashboard', `select public.staff_dashboard()`, [], /Staff only/)
await as(null)

await db.close()
if (failures) { console.log(`${failures} check(s) failed`); process.exit(1) } else console.log('All database checks passed')
