-- Phase 3: certificates. The website is the official register; the paper only carries the proof.
-- The Director (or super admin) issues in one step, only to students whose results are published
-- and who passed. Every action is logged; the Director is emailed about actions by anyone else.

-- ============ Certificate register ============
-- A student may have several certificate rows over time (a revoked one and its replacement),
-- but only one valid certificate at a time.
alter table public.certificates drop constraint if exists certificates_enrolment_id_key;
create unique index if not exists certificates_one_valid on public.certificates (enrolment_id) where revoked_at is null;

-- What was printed is frozen at issue, so the paper and the online check always match.
alter table public.certificates
  add column if not exists holder_name text,
  add column if not exists programme_title text,
  add column if not exists cohort_name text,
  add column if not exists classification text,
  add column if not exists photo_path text,
  add column if not exists issued_by uuid references public.profiles(id),
  add column if not exists revoked_by uuid references public.profiles(id),
  add column if not exists replaces uuid references public.certificates(id),
  add column if not exists print_count integer not null default 0,
  add column if not exists last_printed_at timestamptz,
  add column if not exists collected_at timestamptz,
  add column if not exists collected_by text,
  add column if not exists collection_note text,
  add column if not exists collection_recorded_by uuid references public.profiles(id);
create index if not exists certificates_verify_hash on public.certificates (verify_hash);

-- Staff who run classes can read the register; students read their own (existing policy).
drop policy if exists "own certificate read" on public.certificates;
create policy "own certificate read" on public.certificates for select using (
  public.is_director() or exists (select 1 from public.enrolments e where e.id = enrolment_id and e.user_id = auth.uid()));

-- ============ Issue ============
-- Issues to every eligible student of an intake, or to one student. Returns the new certificate ids.
create or replace function public.staff_issue_certificates(p_cohort uuid, p_enrolment uuid default null)
returns uuid[] language plpgsql security definer set search_path = public as $$
declare e record; ids uuid[] := '{}'; new_id uuid;
begin
  if not public.is_director() then raise exception 'Only the Director can issue certificates'; end if;
  for e in
    select en.id, en.user_id, en.application_id, r.classification,
           trim(concat_ws(' ', pf.first_name, nullif(pf.other_names, ''), pf.surname)) as holder,
           pr.code, pr.title as programme_title, c.name as cohort_name
      from enrolments en
      join results r on r.enrolment_id = en.id
      join profiles pf on pf.id = en.user_id
      join cohorts c on c.id = en.cohort_id
      join programmes pr on pr.id = c.programme_id
     where en.cohort_id = p_cohort
       and (p_enrolment is null or en.id = p_enrolment)
       and r.published_at is not null
       and r.classification in ('Pass', 'Distinction')
       and not exists (select 1 from certificates x where x.enrolment_id = en.id and x.revoked_at is null)
     order by pf.surname, pf.first_name
  loop
    insert into certificates (enrolment_id, certificate_no, holder_name, programme_title, cohort_name, classification, photo_path, issued_by)
    values (e.id, public.next_certificate_no(e.code, extract(year from now())::smallint), e.holder, e.programme_title, e.cohort_name, e.classification,
            (select d.storage_path from documents d where d.application_id = e.application_id and d.type = 'passport_photo' order by d.created_at desc limit 1),
            auth.uid())
    returning id into new_id;
    ids := ids || new_id;
  end loop;
  if p_enrolment is not null and coalesce(array_length(ids, 1), 0) = 0 then
    raise exception 'Not allowed: this student already has a certificate, or their results are not published as a pass';
  end if;
  if coalesce(array_length(ids, 1), 0) > 0 then
    insert into audit_log (actor_id, action, entity, entity_id, after)
    values (auth.uid(), 'certificates.issued', 'cohorts', p_cohort::text, jsonb_build_object('certificates', to_jsonb(ids)));
  end if;
  return ids;
end $$;

-- ============ Revoke (and optionally reissue with a new number) ============
create or replace function public.staff_revoke_certificate(p_cert uuid, p_reason text, p_reissue boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare ce certificates%rowtype; cohort uuid; ids uuid[];
begin
  if not public.is_director() then raise exception 'Only the Director can revoke certificates'; end if;
  if length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'Give a reason for revoking (at least 5 characters)'; end if;
  select * into ce from certificates where id = p_cert and revoked_at is null for update;
  if not found then raise exception 'Certificate not found or already revoked'; end if;
  update certificates set revoked_at = now(), revoke_reason = trim(p_reason), revoked_by = auth.uid() where id = p_cert;
  insert into audit_log (actor_id, action, entity, entity_id, after)
  values (auth.uid(), 'certificate.revoked', 'certificates', p_cert::text, jsonb_build_object('reason', trim(p_reason), 'reissue', p_reissue));
  if not p_reissue then return null; end if;
  select en.cohort_id into cohort from enrolments en where en.id = ce.enrolment_id;
  ids := public.staff_issue_certificates(cohort, ce.enrolment_id);
  update certificates set replaces = p_cert where id = ids[1];
  return ids[1];
end $$;

-- ============ Printing and collection ============
-- Called whenever a certificate PDF is downloaded. Returns how many were reprints.
create or replace function public.staff_record_certificate_print(p_certs uuid[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n integer; reprints integer;
begin
  if not public.is_director() then raise exception 'Only the Director can print certificates'; end if;
  update certificates set print_count = print_count + 1, last_printed_at = now() where id = any(p_certs) and revoked_at is null;
  get diagnostics n = row_count;
  select count(*) into reprints from certificates where id = any(p_certs) and revoked_at is null and print_count > 1;
  insert into audit_log (actor_id, action, entity, entity_id, after)
  values (auth.uid(), 'certificates.printed', 'certificates', coalesce(p_certs[1]::text, ''), jsonb_build_object('certificates', to_jsonb(p_certs), 'reprints', reprints));
  return jsonb_build_object('printed', n, 'reprints', reprints);
end $$;

create or replace function public.staff_record_collection(p_cert uuid, p_collected_by text, p_note text default null, p_undo boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_director() then raise exception 'Only the Director can record collection'; end if;
  if p_undo then
    update certificates set collected_at = null, collected_by = null, collection_note = null, collection_recorded_by = null where id = p_cert;
  else
    if length(trim(coalesce(p_collected_by, ''))) < 3 then raise exception 'Enter the name of the person who collected it'; end if;
    update certificates set collected_at = now(), collected_by = trim(p_collected_by), collection_note = nullif(trim(coalesce(p_note, '')), ''), collection_recorded_by = auth.uid()
     where id = p_cert and revoked_at is null;
    if not found then raise exception 'Certificate not found or revoked'; end if;
  end if;
  insert into audit_log (actor_id, action, entity, entity_id, after)
  values (auth.uid(), case when p_undo then 'certificate.collection_undone' else 'certificate.collected' end, 'certificates', p_cert::text,
          jsonb_build_object('collected_by', p_collected_by, 'note', p_note));
end $$;

-- ============ Data for PDFs (server only) ============
create or replace function public.certificate_json(p_cert uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', ce.id, 'certificate_no', ce.certificate_no, 'verify_token', ce.verify_hash, 'issued_at', ce.issued_at,
    'holder_name', ce.holder_name, 'programme_title', ce.programme_title, 'cohort_name', ce.cohort_name,
    'classification', ce.classification, 'revoked', ce.revoked_at is not null,
    'reg_no', e.reg_no, 'programme_code', pr.code, 'end_date', c.end_date)
  from certificates ce
  join enrolments e on e.id = ce.enrolment_id
  join cohorts c on c.id = e.cohort_id
  join programmes pr on pr.id = c.programme_id
  where ce.id = p_cert;
$$;

-- Statement of result: modules, capstone, attendance, total and grade.
create or replace function public.statement_json(p_enrolment uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'enrolment_id', e.id, 'reg_no', e.reg_no,
    'name', trim(concat_ws(' ', pf.first_name, nullif(pf.other_names, ''), pf.surname)),
    'programme_code', pr.code, 'programme_title', pr.title, 'cohort_name', c.name, 'start_date', c.start_date, 'end_date', c.end_date,
    'attendance_mode', c.attendance_mode, 'attendance_waived', e.attendance_waived,
    'attendance_pct', r.attendance_pct, 'total_pct', r.total_pct, 'classification', r.classification, 'published_at', r.published_at,
    'modules', coalesce((select jsonb_agg(jsonb_build_object('number', m.number, 'title', m.title,
                 'score', (select s.score from assessment_scores s where s.enrolment_id = e.id and s.component = 'module' and s.module_id = m.id))
                 order by m.number) from modules m where m.programme_id = pr.id), '[]'::jsonb),
    'capstone', (select s.score from assessment_scores s where s.enrolment_id = e.id and s.component = 'capstone' limit 1),
    'certificate_no', ce.certificate_no, 'certificate_token', ce.verify_hash)
  from enrolments e
  join profiles pf on pf.id = e.user_id
  join cohorts c on c.id = e.cohort_id
  join programmes pr on pr.id = c.programme_id
  left join results r on r.enrolment_id = e.id
  left join certificates ce on ce.enrolment_id = e.id and ce.revoked_at is null
  where e.id = p_enrolment;
$$;

-- The student (once results are published) or the Director can load a statement.
create or replace function public.get_statement(p_enrolment uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_director() or exists (
    select 1 from enrolments e join results r on r.enrolment_id = e.id
     where e.id = p_enrolment and e.user_id = auth.uid() and r.published_at is not null)) then return null; end if;
  return public.statement_json(p_enrolment);
end $$;

-- ============ Public checks ============
-- Behind the QR code: full details (the page adds the passport photo on the server).
create or replace function public.verify_certificate_token(p_token text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then return null; end if;
  select jsonb_build_object(
    'valid', ce.revoked_at is null, 'revoked_at', ce.revoked_at, 'certificate_no', ce.certificate_no,
    'holder_name', ce.holder_name, 'programme_title', ce.programme_title, 'cohort_name', ce.cohort_name,
    'classification', ce.classification, 'issued_at', ce.issued_at, 'reg_no', e.reg_no,
    'replaced_by', (select x.certificate_no from certificates x where x.replaces = ce.id limit 1))
  into r
  from certificates ce join enrolments e on e.id = ce.enrolment_id
  where ce.verify_hash = p_token;
  return r;
end $$;

-- Typed certificate number: same answer, frozen details, no photo.
create or replace function public.verify_certificate(p_certificate_no text)
returns table (holder text, programme text, cohort text, issued_at timestamptz, classification text, valid boolean)
language sql stable security definer set search_path = public as $$
  select coalesce(ce.holder_name, concat_ws(' ', pf.first_name, pf.other_names, pf.surname)),
         coalesce(ce.programme_title, pr.title), coalesce(ce.cohort_name, c.name), ce.issued_at,
         coalesce(ce.classification, r.classification), ce.revoked_at is null
  from certificates ce
  join enrolments e on e.id = ce.enrolment_id
  join profiles pf on pf.id = e.user_id
  join cohorts c on c.id = e.cohort_id
  join programmes pr on pr.id = c.programme_id
  left join results r on r.enrolment_id = e.id
  where ce.certificate_no = upper(p_certificate_no);
$$;

-- ============ Results and certificates stay consistent ============
-- Recalculating after publication (a Director's correction) also updates completed/failed.
create or replace function public.staff_compute_results(p_cohort uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare e record; n integer := 0;
begin
  if not public.is_director() then raise exception 'Only the Director can calculate results'; end if;
  for e in select id from enrolments where cohort_id = p_cohort and status in ('active', 'completed', 'failed') loop
    perform public.compute_result(e.id);
    n := n + 1;
  end loop;
  update enrolments en set status = case when r.classification = 'Fail' then 'failed'::public.enrolment_status else 'completed'::public.enrolment_status end
    from results r where r.enrolment_id = en.id and en.cohort_id = p_cohort and r.published_at is not null and en.status in ('completed', 'failed');
  insert into audit_log (actor_id, action, entity, entity_id, after) values (auth.uid(), 'results.computed', 'cohorts', p_cohort::text, jsonb_build_object('students', n));
  return n;
end $$;

-- Results can't be unpublished once certificates are out.
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
    if exists (select 1 from certificates ce join enrolments e on e.id = ce.enrolment_id where e.cohort_id = p_cohort and ce.revoked_at is null) then
      raise exception 'Not allowed: certificates have been issued for this intake. Correct the score, recalculate, then revoke and reissue that student''s certificate';
    end if;
    update results r set published_at = null, published_by = null
      from enrolments e where e.id = r.enrolment_id and e.cohort_id = p_cohort;
    get diagnostics n = row_count;
    update enrolments set status = 'active' where cohort_id = p_cohort and status in ('completed', 'failed');
  end if;
  insert into audit_log (actor_id, action, entity, entity_id, after)
  values (auth.uid(), case when p_publish then 'results.published' else 'results.unpublished' end, 'cohorts', p_cohort::text, jsonb_build_object('students', n));
  return n;
end $$;

-- ============ Permissions ============
do $$
declare f text;
begin
  foreach f in array array[
    'public.staff_issue_certificates(uuid, uuid)', 'public.staff_revoke_certificate(uuid, text, boolean)',
    'public.staff_record_certificate_print(uuid[])', 'public.staff_record_collection(uuid, text, text, boolean)',
    'public.get_statement(uuid)', 'public.staff_compute_results(uuid)', 'public.staff_publish_results(uuid, boolean)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  foreach f in array array['public.certificate_json(uuid)', 'public.statement_json(uuid)'] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
revoke execute on function public.verify_certificate_token(text) from public;
grant execute on function public.verify_certificate_token(text) to anon, authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;
