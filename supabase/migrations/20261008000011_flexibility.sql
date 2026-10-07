-- Flexibility for the realities of running the Institute:
-- no NIN, larger uploads, late applications, over-capacity offers, and attendance that never
-- penalises students unless the Director chooses to require it.

-- ============ Stop collecting NIN ============
alter table public.profiles drop column if exists nin;

-- ============ Uploads up to 4 MB (phone photos of certificates) ============
alter table public.documents drop constraint if exists documents_size_bytes_check;
alter table public.documents add constraint documents_size_bytes_check check (size_bytes > 0 and size_bytes <= 4194304);
update storage.buckets set file_size_limit = 4194304 where id = 'applicant-documents';

-- ============ Late applications ============
alter table public.cohorts add column if not exists accept_late boolean not null default false;

-- ============ Attendance: off by default, per intake ============
-- off      = not tracked, never affects results
-- info     = tracked for information only
-- required = counts towards the result, with a minimum the Director sets (waivable per student)
alter table public.cohorts add column if not exists attendance_mode text not null default 'off'
  check (attendance_mode in ('off', 'info', 'required'));
alter table public.cohorts add column if not exists min_attendance_pct smallint
  check (min_attendance_pct is null or min_attendance_pct between 0 and 100);
alter table public.enrolments add column if not exists attendance_waived boolean not null default false;

-- Results: attendance only counts when the intake requires it. Otherwise modules and the capstone
-- share the full 100% (37.5% / 62.5%, the same ratio as 30 / 50).
create or replace function public.compute_result(p_enrolment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  e enrolments%rowtype;
  c cohorts%rowtype;
  prog programmes%rowtype;
  held integer;
  att_pct numeric; mod_pct numeric; cap_pct numeric; total numeric; cls text;
  counts_attendance boolean;
  min_att numeric;
begin
  select * into e from enrolments where id = p_enrolment;
  select * into c from cohorts where id = e.cohort_id;
  select * into prog from programmes where id = c.programme_id;

  select count(*), coalesce(100.0 * count(a.*) filter (where a.mark in ('present', 'excused')) / nullif(count(*), 0), null)
    into held, att_pct
    from sessions s left join attendance a on a.session_id = s.id and a.enrolment_id = e.id
    where s.cohort_id = e.cohort_id and s.starts_at <= now();

  select coalesce(100.0 * sum(score) / nullif(sum(max_score), 0), 0) into mod_pct
    from assessment_scores where enrolment_id = e.id and component = 'module';
  select coalesce(100.0 * sum(score) / nullif(sum(max_score), 0), 0) into cap_pct
    from assessment_scores where enrolment_id = e.id and component = 'capstone';

  -- Attendance counts only if required, actually recorded, and not waived for this student.
  counts_attendance := c.attendance_mode = 'required' and held > 0 and att_pct is not null and not e.attendance_waived;
  min_att := coalesce(c.min_attendance_pct, prog.min_attendance_pct, 0);

  total := case when counts_attendance
                then round(att_pct * 0.20 + mod_pct * 0.30 + cap_pct * 0.50, 2)
                else round(mod_pct * 0.375 + cap_pct * 0.625, 2) end;
  cls := case
    when total < prog.pass_mark_pct then 'Fail'
    when counts_attendance and att_pct < min_att then 'Fail'
    when total >= prog.distinction_pct then 'Distinction'
    else 'Pass' end;

  insert into results (enrolment_id, attendance_pct, total_pct, classification)
  values (e.id, case when held > 0 then round(att_pct, 2) end, total, cls)
  on conflict (enrolment_id) do update
    set attendance_pct = excluded.attendance_pct, total_pct = excluded.total_pct, classification = excluded.classification;
end $$;
revoke execute on function public.compute_result(uuid) from public, anon, authenticated;

-- ============ Offers over capacity (Director's call) ============
drop function if exists public.staff_make_offer(uuid, smallint);
create or replace function public.staff_make_offer(p_app uuid, p_days smallint default null, p_over_capacity boolean default false) returns timestamptz
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
  if exists (select 1 from documents where application_id = p_app and status <> 'approved') then
    raise exception 'Approve every uploaded document before making an offer';
  end if;
  select capacity, offer_expiry_days into cap, days from cohorts where id = a.cohort_id for update;
  select count(*) into taken from applications
   where cohort_id = a.cohort_id and (status = 'admitted' or (status = 'offered' and offer_expires_at > now()));
  if taken >= cap then
    if not (p_over_capacity and public.is_director()) then
      raise exception 'This intake is full (% of % seats taken). A Director can offer a seat over capacity', taken, cap;
    end if;
  end if;
  days := coalesce(p_days, days, 30);
  if days < 1 or days > 60 then raise exception 'Offer length must be between 1 and 60 days'; end if;

  perform public.transition_application(p_app, 'offered', actor,
    format('Offer made, valid for %s days%s', days, case when taken >= cap then ' (over capacity, approved by Director)' else '' end));
  v_expires := ((now() at time zone 'Africa/Lagos')::date + days + 1)::timestamp at time zone 'Africa/Lagos';
  update applications set offer_expires_at = v_expires where id = p_app;
  return v_expires;
end $$;
revoke execute on function public.staff_make_offer(uuid, smallint, boolean) from public, anon;
grant execute on function public.staff_make_offer(uuid, smallint, boolean) to authenticated;
