-- Admission letters with QR verification, an email log, and "apply again".

-- ============ Admission letters ============
alter table public.enrolments
  add column if not exists letter_token text not null unique default replace(gen_random_uuid()::text, '-', '');

-- Internal builders: no permission check, so only callable by other functions and the server (service role).
create or replace function public.receipt_json(p_payment uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'receipt_no', p.receipt_no, 'verify_token', p.verify_token, 'reference', p.reference,
    'paid_at', p.paid_at, 'method', p.method, 'channel', coalesce(p.paystack_payload->>'channel', ''),
    'base_amount_kobo', p.base_amount_kobo, 'processing_fee_kobo', p.processing_fee_kobo, 'amount_kobo', p.amount_kobo,
    'fee_type', f.type, 'programme_code', pr.code, 'programme_title', pr.title, 'cohort_name', c.name,
    'application_id', a.id, 'application_ref', a.ref, 'reg_no', e.reg_no,
    'payer_name', trim(concat_ws(' ', nullif(pf.title, ''), pf.first_name, nullif(pf.other_names, ''), pf.surname)),
    'payer_first_name', coalesce(pf.first_name, ''),
    'payer_email', pf.email, 'payer_phone', pf.phone, 'user_id', p.user_id)
  from payments p
  join fee_items f on f.id = p.fee_item_id
  join programmes pr on pr.id = f.programme_id
  join profiles pf on pf.id = p.user_id
  left join applications a on a.id = p.application_id
  left join cohorts c on c.id = a.cohort_id
  left join enrolments e on e.application_id = a.id and f.type = 'tuition'
  where p.id = p_payment and p.status = 'paid';
$$;

create or replace function public.letter_json(p_app uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'application_id', a.id, 'application_ref', a.ref, 'reg_no', e.reg_no, 'letter_token', e.letter_token,
    'admitted_at', e.admitted_at, 'enrolment_status', e.status,
    'name', trim(concat_ws(' ', nullif(pf.title, ''), pf.first_name, nullif(pf.other_names, ''), pf.surname)),
    'first_name', coalesce(pf.first_name, ''), 'email', pf.email, 'address', pf.address,
    'programme_code', pr.code, 'programme_title', pr.title,
    'cohort_name', c.name, 'start_date', c.start_date, 'end_date', c.end_date, 'venue', c.venue)
  from enrolments e
  join applications a on a.id = e.application_id
  join profiles pf on pf.id = e.user_id
  join programmes pr on pr.id = a.programme_id
  join cohorts c on c.id = e.cohort_id
  where e.application_id = p_app;
$$;

revoke execute on function public.receipt_json(uuid) from public, anon, authenticated;
revoke execute on function public.letter_json(uuid) from public, anon, authenticated;
grant execute on function public.receipt_json(uuid) to service_role;
grant execute on function public.letter_json(uuid) to service_role;

-- Same receipt as before, now built from receipt_json.
create or replace function public.get_receipt(p_payment uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from payments where id = p_payment and (user_id = auth.uid() or public.is_bursary())) then return null; end if;
  return public.receipt_json(p_payment);
end $$;

-- The admitted student, or staff, can load the admission letter.
create or replace function public.get_admission_letter(p_app uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from enrolments where application_id = p_app and (user_id = auth.uid() or public.is_staff())) then return null; end if;
  return public.letter_json(p_app);
end $$;
revoke execute on function public.get_admission_letter(uuid) from public, anon;
grant execute on function public.get_admission_letter(uuid) to authenticated;

-- Public check behind the letter's QR code.
create or replace function public.verify_letter(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then return null; end if;
  select jsonb_build_object(
    'valid', e.status in ('active', 'completed'), 'status', e.status, 'reg_no', e.reg_no, 'admitted_at', e.admitted_at,
    'name', trim(concat_ws(' ', nullif(pf.title, ''), pf.first_name, nullif(pf.other_names, ''), pf.surname)),
    'programme_code', pr.code, 'programme_title', pr.title, 'cohort_name', c.name, 'start_date', c.start_date)
  into r
  from enrolments e
  join applications a on a.id = e.application_id
  join profiles pf on pf.id = e.user_id
  join programmes pr on pr.id = a.programme_id
  join cohorts c on c.id = e.cohort_id
  where e.letter_token = p_token;
  return r;
end $$;
revoke execute on function public.verify_letter(text) from public;
grant execute on function public.verify_letter(text) to anon, authenticated;

-- ============ Email log ============
-- One row per email. dedupe_key stops the same reminder going out twice.
create table if not exists public.email_log (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  application_id uuid references public.applications(id) on delete cascade,
  kind text not null,
  dedupe_key text unique,
  to_email text not null,
  subject text not null,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed', 'skipped')),
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists email_log_application on public.email_log (application_id);
alter table public.email_log enable row level security;
drop policy if exists "staff read email log" on public.email_log;
create policy "staff read email log" on public.email_log for select using (public.is_admissions() or public.is_bursary());

-- ============ Apply again ============
-- Closes the applicant's lapsed offer so they can apply for a later intake.
create or replace function public.applicant_close_lapsed_offer() returns void
language plpgsql security definer set search_path = public as $$
declare a applications%rowtype;
begin
  select * into a from applications where user_id = auth.uid() order by created_at desc limit 1 for update;
  if not found then raise exception 'No application found'; end if;
  if a.status = 'offered' and a.offer_expires_at <= now() then
    perform public.transition_application(a.id, 'offer_expired', auth.uid(), 'Offer lapsed; applicant chose to apply again');
  end if;
end $$;
revoke execute on function public.applicant_close_lapsed_offer() from public, anon;
grant execute on function public.applicant_close_lapsed_offer() to authenticated;

-- One open application at a time. A new one is allowed after a decision (declined, withdrawn,
-- lapsed offer) or after admission (for a different programme later).
create or replace function public.one_open_application() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from applications
    where user_id = new.user_id and id <> new.id
      and status in ('draft', 'submitted', 'under_review', 'changes_requested', 'offered')
  ) then
    raise exception 'You already have an application in progress';
  end if;
  return new;
end $$;
drop trigger if exists applications_one_open on public.applications;
create trigger applications_one_open before insert on public.applications
  for each row execute function public.one_open_application();
