-- Admin review: staff decisions, offers with expiry, extension and withdrawal, audit trail.
-- Also closes a gap: applicants may edit their draft, but never the fields the system controls.

-- ============ Protect system-controlled application fields ============
-- Direct edits from the browser run as the "authenticated" role. Functions (security definer)
-- run as the owner, so payment confirmation and staff decisions still work.
create or replace function public.protect_application_fields() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and (
       new.status is distinct from old.status
    or new.application_fee_paid_at is distinct from old.application_fee_paid_at
    or new.submitted_at is distinct from old.submitted_at
    or new.offered_at is distinct from old.offered_at
    or new.offer_expires_at is distinct from old.offer_expires_at
    or new.decision_reason is distinct from old.decision_reason
    or new.ref is distinct from old.ref
    or new.user_id is distinct from old.user_id
  ) then
    raise exception 'These application details can only be changed by the Institute';
  end if;
  return new;
end $$;
drop trigger if exists applications_protect on public.applications;
create trigger applications_protect before update on public.applications
  for each row execute function public.protect_application_fields();

-- ============ Offer length: 30 days by default ============
alter table public.cohorts alter column offer_expiry_days set default 30;
update public.cohorts set offer_expiry_days = 30 where offer_expiry_days = 14;

-- ============ Transitions ============
create or replace function public.allowed_transition(p_from public.application_status, p_to public.application_status)
returns boolean language sql immutable as $$
  select (p_from, p_to) in (
    ('draft','submitted'), ('draft','withdrawn'),
    ('submitted','under_review'), ('submitted','withdrawn'),
    ('under_review','changes_requested'), ('under_review','offered'), ('under_review','declined'),
    ('changes_requested','under_review'), ('changes_requested','withdrawn'), ('changes_requested','declined'),
    ('offered','admitted'), ('offered','offer_expired'), ('offered','withdrawn')
  );
$$;

create or replace function public.require_admissions() returns uuid
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admissions() then raise exception 'Only admissions staff can do this'; end if;
  return auth.uid();
end $$;

-- Moves a submitted application into review the first time staff act on it.
create or replace function public.ensure_under_review(p_app uuid, p_actor uuid) returns public.application_status
language plpgsql security definer set search_path = public as $$
declare s public.application_status;
begin
  select status into s from applications where id = p_app for update;
  if not found then raise exception 'Application not found'; end if;
  if s = 'submitted' then
    perform public.transition_application(p_app, 'under_review', p_actor, 'Review started');
    return 'under_review';
  end if;
  return s;
end $$;

create or replace function public.staff_start_review(p_app uuid) returns void
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.require_admissions();
begin
  perform public.ensure_under_review(p_app, actor);
end $$;

-- Approve or reject one document. Rejection needs a reason the applicant will see.
create or replace function public.staff_review_document(p_doc uuid, p_approve boolean, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  actor uuid := public.require_admissions();
  d documents%rowtype;
  s public.application_status;
begin
  select * into d from documents where id = p_doc for update;
  if not found then raise exception 'Document not found'; end if;
  select status into s from applications where id = d.application_id;
  if s not in ('submitted', 'under_review', 'changes_requested') then
    raise exception 'Documents can only be reviewed while the application is under review';
  end if;
  if not p_approve and coalesce(trim(p_reason), '') = '' then raise exception 'Give a reason so the applicant knows what to fix'; end if;
  perform public.ensure_under_review(d.application_id, actor);
  update documents
     set status = case when p_approve then 'approved'::public.document_status else 'rejected'::public.document_status end,
         rejection_reason = case when p_approve then null else trim(p_reason) end,
         reviewed_by = actor, reviewed_at = now()
   where id = p_doc;
  insert into audit_log (actor_id, action, entity, entity_id, before, after)
  values (actor, case when p_approve then 'document.approved' else 'document.rejected' end, 'documents', p_doc::text,
          jsonb_build_object('status', d.status), jsonb_build_object('reason', p_reason, 'type', d.type));
end $$;

-- Ask the applicant to replace rejected documents.
create or replace function public.staff_request_changes(p_app uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.require_admissions(); s public.application_status;
begin
  s := public.ensure_under_review(p_app, actor);
  if s <> 'under_review' then raise exception 'Changes can only be requested while the application is under review'; end if;
  if not exists (select 1 from documents where application_id = p_app and status = 'rejected') then
    raise exception 'Reject at least one document first, with a reason';
  end if;
  perform public.transition_application(p_app, 'changes_requested', actor, nullif(trim(coalesce(p_note, '')), ''));
end $$;

-- Offer a place. Every document must be approved and the intake must have a free seat.
-- Seats taken = admitted + offers that have not yet expired.
create or replace function public.staff_make_offer(p_app uuid, p_days smallint default null) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  actor uuid := public.require_admissions();
  s public.application_status;
  a applications%rowtype;
  cap smallint;
  taken integer;
  days smallint;
  v_expires timestamptz;
begin
  s := public.ensure_under_review(p_app, actor);
  if s <> 'under_review' then raise exception 'Only applications under review can receive an offer'; end if;
  select * into a from applications where id = p_app for update;
  if not exists (select 1 from documents where application_id = p_app) then raise exception 'This application has no documents'; end if;
  if exists (select 1 from documents where application_id = p_app and status <> 'approved') then
    raise exception 'Approve every document before making an offer';
  end if;
  select capacity, offer_expiry_days into cap, days from cohorts where id = a.cohort_id for update;
  select count(*) into taken from applications
   where cohort_id = a.cohort_id and (status = 'admitted' or (status = 'offered' and offer_expires_at > now()));
  if taken >= cap then raise exception 'This intake is full (% of % seats taken). Increase the seats or wait for an offer to lapse', taken, cap; end if;
  days := coalesce(p_days, days, 30);
  if days < 1 or days > 60 then raise exception 'Offer length must be between 1 and 60 days'; end if;

  perform public.transition_application(p_app, 'offered', actor, format('Offer made, valid for %s days', days));
  -- Valid to the end of the last day, Nigerian time.
  v_expires := ((now() at time zone 'Africa/Lagos')::date + days + 1)::timestamp at time zone 'Africa/Lagos';
  update applications set offer_expires_at = v_expires where id = p_app;
  return v_expires;
end $$;

create or replace function public.staff_decline(p_app uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.require_admissions();
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'Give a reason for the decision'; end if;
  perform public.ensure_under_review(p_app, actor);
  perform public.transition_application(p_app, 'declined', actor, trim(p_reason));
end $$;

-- Give more time to pay. Works on a live offer or one that has just lapsed (status is still "offered").
create or replace function public.staff_extend_offer(p_app uuid, p_until date) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  actor uuid := public.require_admissions();
  a applications%rowtype;
  today date := (now() at time zone 'Africa/Lagos')::date;
  v_expires timestamptz;
begin
  select * into a from applications where id = p_app for update;
  if not found or a.status <> 'offered' then raise exception 'Only an open offer can be extended'; end if;
  if p_until < today then raise exception 'Choose today or a later date'; end if;
  if p_until > today + 90 then raise exception 'Extend by at most 90 days at a time'; end if;
  v_expires := (p_until + 1)::timestamp at time zone 'Africa/Lagos';
  update applications set offer_expires_at = v_expires where id = p_app;
  insert into application_status_history (application_id, from_status, to_status, actor_id, note)
  values (p_app, 'offered', 'offered', actor, format('Offer extended to %s', to_char(p_until, 'FMDD Month YYYY')));
  insert into audit_log (actor_id, action, entity, entity_id, before, after)
  values (actor, 'offer.extended', 'applications', p_app::text,
          jsonb_build_object('offer_expires_at', a.offer_expires_at), jsonb_build_object('offer_expires_at', v_expires));
  return v_expires;
end $$;

create or replace function public.staff_withdraw_offer(p_app uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare actor uuid := public.require_admissions();
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'Give a reason for withdrawing the offer'; end if;
  if (select status from applications where id = p_app) is distinct from 'offered' then raise exception 'Only an open offer can be withdrawn'; end if;
  perform public.transition_application(p_app, 'withdrawn', actor, trim(p_reason));
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.staff_start_review(uuid)',
    'public.staff_review_document(uuid, boolean, text)',
    'public.staff_request_changes(uuid, text)',
    'public.staff_make_offer(uuid, smallint)',
    'public.staff_decline(uuid, text)',
    'public.staff_extend_offer(uuid, date)',
    'public.staff_withdraw_offer(uuid, text)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
revoke execute on function public.ensure_under_review(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.require_admissions() from public, anon;

-- ============ Audit trail for intakes and fees ============
create or replace function public.audit_row_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (actor_id, action, entity, entity_id, before, after)
  values (auth.uid(), tg_table_name || '.' || lower(tg_op), tg_table_name,
          coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id'),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
drop trigger if exists cohorts_audit on public.cohorts;
create trigger cohorts_audit after insert or update or delete on public.cohorts for each row execute function public.audit_row_change();
drop trigger if exists fee_items_audit on public.fee_items;
create trigger fee_items_audit after insert or update or delete on public.fee_items for each row execute function public.audit_row_change();

-- Staff see the audit trail for applications they review.
drop policy if exists "admissions read application audit" on public.audit_log;
create policy "admissions read application audit" on public.audit_log for select
  using (public.is_admissions() and entity in ('applications', 'documents'));

-- ============ Dashboard figures ============
-- One round trip for the admin dashboard. Money figures only for Bursary, Director and Super admin.
create or replace function public.staff_dashboard() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  select jsonb_build_object(
    'new', count(*) filter (where status = 'submitted'),
    'under_review', count(*) filter (where status = 'under_review'),
    'changes_requested', count(*) filter (where status = 'changes_requested'),
    'offers_open', count(*) filter (where status = 'offered' and offer_expires_at > now()),
    'offers_lapsed', count(*) filter (where status = 'offered' and offer_expires_at <= now()),
    'admitted', count(*) filter (where status = 'admitted'),
    'in_progress', count(*) filter (where status = 'draft' and application_fee_paid_at is not null),
    'oldest_waiting', min(submitted_at) filter (where status in ('submitted', 'under_review'))
  ) into r from applications;
  if public.is_bursary() then
    r := r || (
      select jsonb_build_object(
        'received_kobo', coalesce(sum(p.amount_kobo), 0),
        'received_application_kobo', coalesce(sum(p.amount_kobo) filter (where f.type = 'application'), 0),
        'received_tuition_kobo', coalesce(sum(p.amount_kobo) filter (where f.type = 'tuition'), 0),
        'payments_count', count(*)
      )
      from payments p join fee_items f on f.id = p.fee_item_id
      where p.status = 'paid');
  end if;
  return r;
end $$;
revoke execute on function public.staff_dashboard() from public, anon;
grant execute on function public.staff_dashboard() to authenticated;

-- Seats per intake (taken = admitted + offers not yet lapsed).
create or replace function public.staff_intake_seats()
returns table (cohort_id uuid, admitted integer, offers_open integer, under_review integer, seats_taken integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  return query
    select c.id,
           count(a.id) filter (where a.status = 'admitted')::int,
           count(a.id) filter (where a.status = 'offered' and a.offer_expires_at > now())::int,
           count(a.id) filter (where a.status in ('submitted', 'under_review', 'changes_requested'))::int,
           count(a.id) filter (where a.status = 'admitted' or (a.status = 'offered' and a.offer_expires_at > now()))::int
    from cohorts c left join applications a on a.cohort_id = c.id
    group by c.id;
end $$;
revoke execute on function public.staff_intake_seats() from public, anon;
grant execute on function public.staff_intake_seats() to authenticated;
