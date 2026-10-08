-- Phase 2: running classes. Everything optional except scores and results.

-- ============ Facilitators assigned to an intake (no timetable needed) ============
create table if not exists public.cohort_facilitators (
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (cohort_id, user_id)
);
alter table public.cohort_facilitators enable row level security;
drop policy if exists "staff read facilitators" on public.cohort_facilitators;
create policy "staff read facilitators" on public.cohort_facilitators for select using (public.is_staff());
drop policy if exists "director assigns facilitators" on public.cohort_facilitators;
create policy "director assigns facilitators" on public.cohort_facilitators for all
  using (public.is_director()) with check (public.is_director());

-- A facilitator teaches an intake if assigned to it, or to one of its sessions.
create or replace function public.teaches_cohort(p_cohort uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cohort_facilitators f where f.cohort_id = p_cohort and f.user_id = auth.uid())
      or exists (select 1 from public.sessions s where s.cohort_id = p_cohort and s.facilitator_id = auth.uid());
$$;

-- Attendance can be marked by any facilitator of the intake (not only the session's own facilitator).
drop policy if exists "facilitator marks attendance" on public.attendance;
create policy "facilitator marks attendance" on public.attendance for all using (
  public.is_director() or exists (select 1 from public.sessions s where s.id = session_id and public.teaches_cohort(s.cohort_id)))
  with check (public.is_director() or exists (select 1 from public.sessions s where s.id = session_id and public.teaches_cohort(s.cohort_id)));

-- ============ Class links (WhatsApp group, shared folder) ============
alter table public.cohorts add column if not exists class_group_url text check (class_group_url is null or class_group_url ~ '^https://');
alter table public.cohorts add column if not exists materials_url text check (materials_url is null or materials_url ~ '^https://');

-- ============ Scores ============
-- One score per student per module, and one capstone score. Saved through this function so the
-- capstone (no module) never gets duplicated and published results can't be changed by accident.
create or replace function public.save_score(p_enrolment uuid, p_component text, p_module uuid, p_score numeric, p_max numeric default 100)
returns void language plpgsql security definer set search_path = public as $$
declare e enrolments%rowtype; existing uuid;
begin
  select * into e from enrolments where id = p_enrolment;
  if not found then raise exception 'Student not found'; end if;
  if not (public.is_director() or public.teaches_cohort(e.cohort_id)) then raise exception 'Only this class''s facilitators or the Director can enter scores'; end if;
  if exists (select 1 from results where enrolment_id = p_enrolment and published_at is not null) and not public.is_director() then
    raise exception 'Results are published. Ask the Director to unpublish before changing scores';
  end if;
  if p_component not in ('module', 'capstone', 'participation') then raise exception 'Unknown score type'; end if;
  if p_component = 'module' and p_module is null then raise exception 'Choose a module'; end if;
  if p_component <> 'module' then p_module := null; end if;

  select id into existing from assessment_scores
   where enrolment_id = p_enrolment and component = p_component and module_id is not distinct from p_module;
  if p_score is null then
    delete from assessment_scores where id = existing;
    return;
  end if;
  if p_score < 0 or p_score > p_max then raise exception 'Scores must be between 0 and %', p_max; end if;
  if existing is null then
    insert into assessment_scores (enrolment_id, component, module_id, score, max_score, entered_by)
    values (p_enrolment, p_component, p_module, p_score, p_max, auth.uid());
  else
    update assessment_scores set score = p_score, max_score = p_max, entered_by = auth.uid(), updated_at = now() where id = existing;
  end if;
end $$;
revoke execute on function public.save_score(uuid, text, uuid, numeric, numeric) from public, anon;
grant execute on function public.save_score(uuid, text, uuid, numeric, numeric) to authenticated;

-- ============ Results ============
create or replace function public.staff_compute_results(p_cohort uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare e record; n integer := 0;
begin
  if not public.is_director() then raise exception 'Only the Director can calculate results'; end if;
  for e in select id from enrolments where cohort_id = p_cohort and status in ('active', 'completed', 'failed') loop
    perform public.compute_result(e.id);
    n := n + 1;
  end loop;
  insert into audit_log (actor_id, action, entity, entity_id, after) values (auth.uid(), 'results.computed', 'cohorts', p_cohort::text, jsonb_build_object('students', n));
  return n;
end $$;

create or replace function public.staff_publish_results(p_cohort uuid, p_publish boolean) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not public.is_director() then raise exception 'Only the Director can publish results'; end if;
  if p_publish then
    perform public.staff_compute_results(p_cohort);
    update results r set published_at = now(), published_by = auth.uid()
      from enrolments e where e.id = r.enrolment_id and e.cohort_id = p_cohort and r.published_at is null;
    get diagnostics n = row_count;
    update enrolments e set status = case when r.classification = 'Fail' then 'failed'::public.enrolment_status else 'completed'::public.enrolment_status end
      from results r where r.enrolment_id = e.id and e.cohort_id = p_cohort and e.status = 'active';
  else
    update results r set published_at = null, published_by = null
      from enrolments e where e.id = r.enrolment_id and e.cohort_id = p_cohort;
    get diagnostics n = row_count;
    update enrolments set status = 'active' where cohort_id = p_cohort and status in ('completed', 'failed');
  end if;
  insert into audit_log (actor_id, action, entity, entity_id, after)
  values (auth.uid(), case when p_publish then 'results.published' else 'results.unpublished' end, 'cohorts', p_cohort::text, jsonb_build_object('students', n));
  return n;
end $$;

create or replace function public.staff_set_attendance_waiver(p_enrolment uuid, p_waived boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_director() then raise exception 'Only the Director can waive attendance'; end if;
  update enrolments set attendance_waived = p_waived where id = p_enrolment;
  insert into audit_log (actor_id, action, entity, entity_id, after) values (auth.uid(), 'attendance.waiver', 'enrolments', p_enrolment::text, jsonb_build_object('waived', p_waived));
end $$;

do $$
declare f text;
begin
  foreach f in array array['public.staff_compute_results(uuid)', 'public.staff_publish_results(uuid, boolean)', 'public.staff_set_attendance_waiver(uuid, boolean)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- Directors can update class settings; facilitators read them. (Cohort RLS already allows Director updates.)
-- Students can read the links for their own intake through the cohorts "public reads open cohorts" policy
-- only while open/running; give enrolled students explicit read access too.
drop policy if exists "students read own cohort" on public.cohorts;
create policy "students read own cohort" on public.cohorts for select using (
  exists (select 1 from public.enrolments e where e.cohort_id = cohorts.id and e.user_id = auth.uid()));

-- Announcements for an intake can be removed by the Director or the person who posted them.
drop policy if exists "remove own announcements" on public.announcements;
create policy "remove own announcements" on public.announcements for delete using (public.is_director() or created_by = auth.uid());
