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
await one(`insert into public.payments (user_id, application_id, fee_item_id, reference, base_amount_kobo, processing_fee_kobo) values ($1,$2,$3,'IPCM-APP-1',1500000,30000)`, [u.id, a.id, fid('application')])
console.log('pay app fee:', (await one(`select public.confirm_payment('IPCM-APP-1', 1530000, '{}'::jsonb) r`))[0].r)
console.log('replay webhook:', (await one(`select public.confirm_payment('IPCM-APP-1', 1530000, '{}'::jsonb) r`))[0].r)
console.log('status:', (await one(`select status from public.applications where id=$1`, [a.id]))[0].status)
try { await one(`select public.transition_application($1,'admitted',$2)`, [a.id, u.id]) } catch (e) { console.log('illegal jump blocked:', e.message) }
await one(`select public.transition_application($1,'under_review',$2)`, [a.id, u.id])
await one(`select public.transition_application($1,'offered',$2)`, [a.id, u.id])
await one(`insert into public.payments (user_id, application_id, fee_item_id, reference, base_amount_kobo, processing_fee_kobo) values ($1,$2,$3,'IPCM-TUI-1',3500000,30000)`, [u.id, a.id, fid('tuition')])
try { await one(`select public.confirm_payment('IPCM-TUI-1', 100, '{}'::jsonb)`) } catch (e) { console.log('wrong amount rejected:', e.message) }
await one(`update public.payments set status='pending' where reference='IPCM-TUI-1'`)
console.log('pay tuition:', (await one(`select public.confirm_payment('IPCM-TUI-1', 3530000, '{}'::jsonb) r`))[0].r)
console.log('enrolment:', (await one(`select reg_no from public.enrolments`))[0], 'role now:', (await one(`select role from public.profiles where id=$1`, [u.id]))[0].role)
console.log('next NMA reg:', (await one(`select public.next_reg_no('NMA', 2026::smallint) r`))[0].r)
console.log('history:', (await one(`select string_agg(to_status::text, ' > ' order by id) h from public.application_status_history`))[0].h)
// A signed-in user must not be able to promote themselves
await db.exec(`set request.jwt.sub = '${u.id}'`)
try { await one(`update public.profiles set role='super_admin' where id=$1`, [u.id]); console.log('SELF-PROMOTION ALLOWED (bad)') } catch (e) { console.log('self-promotion blocked:', e.message) }
// SQL editor / service role (no end-user JWT) may grant roles
await db.exec(`reset request.jwt.sub`)
await one(`update public.profiles set role='super_admin' where id=$1`, [u.id])
console.log('SQL editor grant:', (await one(`select role from public.profiles where id=$1`, [u.id]))[0].role)
await db.close()
