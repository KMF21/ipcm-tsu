-- Numbering, status transitions, payment confirmation and results.
-- All functions are SECURITY DEFINER and are only callable by the service role (server code).

-- ============ Number generation ============
create table public.number_counters (
  kind text not null,          -- 'reg' | 'cert' | 'receipt' | 'invoice'
  scope text not null,         -- programme code, or 'ALL'
  year smallint not null,
  last_value integer not null default 0,
  primary key (kind, scope, year)
);

-- Locks the counter row so two admins acting at the same moment never get the same number.
create or replace function public.next_counter(p_kind text, p_scope text, p_year smallint)
returns integer language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  insert into number_counters (kind, scope, year) values (p_kind, p_scope, p_year)
  on conflict (kind, scope, year) do nothing;
  select last_value into v from number_counters
    where kind = p_kind and scope = p_scope and year = p_year for update;
  v := v + 1;
  update number_counters set last_value = v where kind = p_kind and scope = p_scope and year = p_year;
  return v;
end $$;

-- Application reference: APP-YY-XXXXXX, 6 chars from an alphabet without 0/O/1/I.
create or replace function public.new_application_ref()
returns text language plpgsql as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text;
begin
  loop
    out := 'APP-' || to_char(now(), 'YY') || '-';
    for i in 1..6 loop
      out := out || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from applications where ref = out);
  end loop;
  return out;
end $$;

create or replace function public.applications_set_ref() returns trigger language plpgsql as $$
begin
  if new.ref is null or new.ref = '' then new.ref := public.new_application_ref(); end if;
  return new;
end $$;
create trigger applications_ref before insert on public.applications for each row execute function public.applications_set_ref();

-- TSU/IPCM/{CODE}/{YYYY}/{NNNN}
create or replace function public.next_reg_no(p_code text, p_year smallint)
returns text language sql security definer set search_path = public as $$
  select format('TSU/IPCM/%s/%s/%s', p_code, p_year, lpad(public.next_counter('reg', p_code, p_year)::text, 4, '0'));
$$;

-- IPCM-{CODE}-{YYYY}-{NNNN}
create or replace function public.next_certificate_no(p_code text, p_year smallint)
returns text language sql security definer set search_path = public as $$
  select format('IPCM-%s-%s-%s', p_code, p_year, lpad(public.next_counter('cert', p_code, p_year)::text, 4, '0'));
$$;

-- RCT-{YYYY}-{NNNNNN}
create or replace function public.next_receipt_no(p_year smallint)
returns text language sql security definer set search_path = public as $$
  select format('RCT-%s-%s', p_year, lpad(public.next_counter('receipt', 'ALL', p_year)::text, 6, '0'));
$$;

-- ============ Application status machine ============
create or replace function public.allowed_transition(p_from public.application_status, p_to public.application_status)
returns boolean language sql immutable as $$
  select (p_from, p_to) in (
    ('draft','submitted'), ('draft','withdrawn'),
    ('submitted','under_review'), ('submitted','withdrawn'),
    ('under_review','changes_requested'), ('under_review','offered'), ('under_review','declined'),
    ('changes_requested','under_review'), ('changes_requested','withdrawn'),
    ('offered','admitted'), ('offered','offer_expired'), ('offered','withdrawn')
  );
$$;

create or replace function public.transition_application(p_id uuid, p_to public.application_status, p_actor uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare a applications%rowtype; expiry smallint;
begin
  select * into a from applications where id = p_id for update;
  if not found then raise exception 'Application % not found', p_id; end if;
  if not public.allowed_transition(a.status, p_to) then
    raise exception 'Transition % -> % is not allowed', a.status, p_to;
  end if;

  if p_to = 'offered' then
    select offer_expiry_days into expiry from cohorts where id = a.cohort_id;
    update applications set status = p_to, offered_at = now(),
      offer_expires_at = now() + make_interval(days => coalesce(expiry, 14)) where id = p_id;
  elsif p_to = 'submitted' then
    update applications set status = p_to, submitted_at = now() where id = p_id;
  elsif p_to = 'declined' then
    if p_note is null then raise exception 'A reason is required to decline'; end if;
    update applications set status = p_to, decision_reason = p_note where id = p_id;
  else
    update applications set status = p_to where id = p_id;
  end if;

  insert into application_status_history (application_id, from_status, to_status, actor_id, note)
  values (p_id, a.status, p_to, p_actor, p_note);
  insert into audit_log (actor_id, action, entity, entity_id, before, after)
  values (p_actor, 'application.transition', 'applications', p_id::text,
          jsonb_build_object('status', a.status), jsonb_build_object('status', p_to, 'note', p_note));
end $$;

-- ============ Payment confirmation (idempotent) ============
-- Called by BOTH the Paystack callback and the webhook. Whichever arrives first does the work;
-- the second sees status = 'paid' and returns without side effects.
create or replace function public.confirm_payment(p_reference text, p_amount_kobo integer, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  p payments%rowtype;
  f fee_items%rowtype;
  a applications%rowtype;
  prog_code text;
  yr smallint := extract(year from now())::smallint;
  v_receipt text;
  v_reg text;
begin
  select * into p from payments where reference = p_reference for update;
  if not found then raise exception 'Unknown payment reference %', p_reference; end if;
  if p.status = 'paid' then
    return jsonb_build_object('already_processed', true, 'receipt_no', p.receipt_no);
  end if;
  if p.amount_kobo <> p_amount_kobo then
    update payments set status = 'failed', paystack_payload = p_payload, note = 'Amount mismatch' where id = p.id;
    raise exception 'Amount mismatch for %: expected %, got %', p_reference, p.amount_kobo, p_amount_kobo;
  end if;

  v_receipt := public.next_receipt_no(yr);
  update payments set status = 'paid', paid_at = now(), paystack_payload = p_payload, receipt_no = v_receipt where id = p.id;

  select * into f from fee_items where id = p.fee_item_id;
  select * into a from applications where id = p.application_id for update;

  if f.type = 'application' and a.status = 'draft' then
    perform public.transition_application(a.id, 'submitted', p.user_id, 'Application fee paid');
  elsif f.type = 'tuition' and a.status = 'offered' then
    select code into prog_code from programmes where id = a.programme_id;
    -- Registration number carries the cohort's year, not the payment date's year.
    v_reg := public.next_reg_no(prog_code, (select extract(year from start_date)::smallint from cohorts where id = a.cohort_id));
    perform public.transition_application(a.id, 'admitted', p.user_id, 'Tuition paid');
    insert into enrolments (application_id, user_id, cohort_id, reg_no) values (a.id, a.user_id, a.cohort_id, v_reg);
    perform set_config('ipcm.system_update', 'on', true);  -- transaction-local
    update profiles set role = 'student' where id = a.user_id and role = 'applicant';
    perform set_config('ipcm.system_update', 'off', true);
  end if;

  insert into audit_log (actor_id, action, entity, entity_id, after)
  values (p.user_id, 'payment.confirmed', 'payments', p.id::text,
          jsonb_build_object('reference', p_reference, 'receipt_no', v_receipt, 'reg_no', v_reg));

  return jsonb_build_object('already_processed', false, 'receipt_no', v_receipt, 'reg_no', v_reg, 'fee_type', f.type);
end $$;

-- ============ Results ============
-- Attendance 20%, modules 30% (split across modules), capstone 50%. Pass >= pass_mark AND attendance >= min.
create or replace function public.compute_result(p_enrolment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  e enrolments%rowtype;
  prog programmes%rowtype;
  att_pct numeric; mod_pct numeric; cap_pct numeric; total numeric; cls text;
begin
  select * into e from enrolments where id = p_enrolment;
  select pr.* into prog from programmes pr join cohorts c on c.programme_id = pr.id where c.id = e.cohort_id;

  select coalesce(100.0 * count(*) filter (where a.mark in ('present','excused')) / nullif(count(s.id), 0), 0)
    into att_pct
    from sessions s left join attendance a on a.session_id = s.id and a.enrolment_id = e.id
    where s.cohort_id = e.cohort_id and s.starts_at <= now();

  select coalesce(100.0 * sum(score) / nullif(sum(max_score), 0), 0) into mod_pct
    from assessment_scores where enrolment_id = e.id and component = 'module';
  select coalesce(100.0 * sum(score) / nullif(sum(max_score), 0), 0) into cap_pct
    from assessment_scores where enrolment_id = e.id and component = 'capstone';

  total := round(att_pct * 0.20 + mod_pct * 0.30 + cap_pct * 0.50, 2);
  cls := case
    when att_pct < prog.min_attendance_pct or total < prog.pass_mark_pct then 'Fail'
    when total >= prog.distinction_pct then 'Distinction'
    else 'Pass' end;

  insert into results (enrolment_id, attendance_pct, total_pct, classification)
  values (e.id, round(att_pct, 2), total, cls)
  on conflict (enrolment_id) do update
    set attendance_pct = excluded.attendance_pct, total_pct = excluded.total_pct, classification = excluded.classification;
end $$;

-- ============ Public certificate verification (minimal data only) ============
create or replace function public.verify_certificate(p_certificate_no text)
returns table (holder text, programme text, cohort text, issued_at timestamptz, classification text, valid boolean)
language sql stable security definer set search_path = public as $$
  select concat_ws(' ', pf.first_name, pf.other_names, pf.surname),
         pr.title, c.name, ce.issued_at, r.classification, ce.revoked_at is null
  from certificates ce
  join enrolments e on e.id = ce.enrolment_id
  join profiles pf on pf.id = e.user_id
  join cohorts c on c.id = e.cohort_id
  join programmes pr on pr.id = c.programme_id
  left join results r on r.enrolment_id = e.id
  where ce.certificate_no = p_certificate_no;
$$;

-- Lock down: only the service role may call the privileged functions.
revoke execute on function public.next_counter(text, text, smallint) from public, anon, authenticated;
revoke execute on function public.next_reg_no(text, smallint) from public, anon, authenticated;
revoke execute on function public.next_certificate_no(text, smallint) from public, anon, authenticated;
revoke execute on function public.next_receipt_no(smallint) from public, anon, authenticated;
revoke execute on function public.transition_application(uuid, public.application_status, uuid, text) from public, anon, authenticated;
revoke execute on function public.confirm_payment(text, integer, jsonb) from public, anon, authenticated;
revoke execute on function public.compute_result(uuid) from public, anon, authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;
