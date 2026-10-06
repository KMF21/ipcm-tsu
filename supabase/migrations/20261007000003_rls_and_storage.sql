-- Row-level security on every table, plus private storage buckets.

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Shorthand role groups
create or replace function public.is_admissions() returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(array['admissions','director','super_admin']::public.user_role[]);
$$;
create or replace function public.is_bursary() returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(array['bursary','director','super_admin']::public.user_role[]);
$$;
create or replace function public.is_content_editor() returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(array['editor','director','super_admin']::public.user_role[]);
$$;
create or replace function public.is_director() returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(array['director','super_admin']::public.user_role[]);
$$;
-- Facilitator assigned to at least one session in the cohort
create or replace function public.teaches_cohort(p_cohort uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sessions s where s.cohort_id = p_cohort and s.facilitator_id = auth.uid());
$$;

-- ---------- Public read: catalogue and website content ----------
create policy "public reads states" on public.states for select using (true);
create policy "public reads lgas" on public.lgas for select using (true);
create policy "public reads published programmes" on public.programmes for select using (is_published or public.is_staff());
create policy "public reads modules" on public.modules for select using (true);
create policy "public reads active fees" on public.fee_items for select using (active or public.is_staff());
create policy "public reads open cohorts" on public.cohorts for select using (status in ('open','running','completed') or public.is_staff());
create policy "public reads site settings" on public.site_settings for select using (true);
create policy "public reads published posts" on public.posts for select using (published_at is not null and published_at <= now() or public.is_content_editor());
create policy "public reads people" on public.people for select using (true);
create policy "public reads partners" on public.partners for select using (true);
create policy "public reads faqs" on public.faqs for select using (true);
create policy "approved sponsors visible" on public.sponsors for select using (approved or public.is_staff());

-- Staff write access to catalogue and content
create policy "director manages programmes" on public.programmes for all using (public.is_director() or public.is_content_editor()) with check (public.is_director() or public.is_content_editor());
create policy "director manages modules" on public.modules for all using (public.is_director()) with check (public.is_director());
create policy "bursary manages fees" on public.fee_items for all using (public.is_bursary()) with check (public.is_bursary());
create policy "director manages cohorts" on public.cohorts for all using (public.is_director()) with check (public.is_director());
create policy "editors manage settings" on public.site_settings for all using (public.is_content_editor()) with check (public.is_content_editor());
create policy "editors manage posts" on public.posts for all using (public.is_content_editor()) with check (public.is_content_editor());
create policy "editors manage people" on public.people for all using (public.is_content_editor()) with check (public.is_content_editor());
create policy "editors manage partners" on public.partners for all using (public.is_content_editor()) with check (public.is_content_editor());
create policy "editors manage faqs" on public.faqs for all using (public.is_content_editor()) with check (public.is_content_editor());
create policy "bursary manages sponsors" on public.sponsors for all using (public.is_bursary() or public.is_admissions()) with check (public.is_bursary() or public.is_admissions());

-- ---------- Profiles ----------
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "own profile update" on public.profiles for update using (id = auth.uid() or public.has_role(array['super_admin']::public.user_role[]))
  with check (id = auth.uid() or public.has_role(array['super_admin']::public.user_role[]));

-- ---------- Applications ----------
create policy "own applications read" on public.applications for select using (user_id = auth.uid() or public.is_admissions() or public.is_bursary());
create policy "create own draft" on public.applications for insert with check (user_id = auth.uid() and status = 'draft');
-- Applicants edit only while draft; status itself only changes through transition_application().
create policy "edit own draft" on public.applications for update using (user_id = auth.uid() and status = 'draft') with check (user_id = auth.uid() and status = 'draft');
create policy "history visible" on public.application_status_history for select using (
  public.is_admissions() or exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid()));

-- ---------- Documents ----------
create policy "own documents read" on public.documents for select using (user_id = auth.uid() or public.is_admissions());
create policy "upload own documents" on public.documents for insert with check (
  user_id = auth.uid() and status = 'pending'
  and exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid()
              and a.status in ('draft','changes_requested')));
create policy "admissions review documents" on public.documents for update using (public.is_admissions()) with check (public.is_admissions());

-- ---------- Payments (written only by the server via service role) ----------
create policy "own payments read" on public.payments for select using (user_id = auth.uid() or public.is_bursary());
create policy "bursary invoices" on public.sponsor_invoices for all using (public.is_bursary()) with check (public.is_bursary());
create policy "bursary invoice items" on public.invoice_items for all using (public.is_bursary()) with check (public.is_bursary());

-- ---------- Learning ----------
create policy "own enrolment read" on public.enrolments for select using (user_id = auth.uid() or public.is_staff());
create policy "sessions visible to cohort" on public.sessions for select using (
  public.is_staff() or exists (select 1 from public.enrolments e where e.cohort_id = sessions.cohort_id and e.user_id = auth.uid()));
create policy "director manages sessions" on public.sessions for all using (public.is_director()) with check (public.is_director());

create policy "own attendance read" on public.attendance for select using (
  public.is_director() or exists (select 1 from public.enrolments e where e.id = enrolment_id and (e.user_id = auth.uid() or public.teaches_cohort(e.cohort_id))));
create policy "facilitator marks attendance" on public.attendance for all using (
  public.is_director() or exists (select 1 from public.sessions s where s.id = session_id and s.facilitator_id = auth.uid()))
  with check (public.is_director() or exists (select 1 from public.sessions s where s.id = session_id and s.facilitator_id = auth.uid()));

create policy "scores visible" on public.assessment_scores for select using (
  public.is_director() or exists (select 1 from public.enrolments e where e.id = enrolment_id and (e.user_id = auth.uid() or public.teaches_cohort(e.cohort_id))));
create policy "facilitator enters unlocked scores" on public.assessment_scores for all using (
  public.is_director() or (not locked and exists (select 1 from public.enrolments e where e.id = enrolment_id and public.teaches_cohort(e.cohort_id))))
  with check (public.is_director() or (not locked and exists (select 1 from public.enrolments e where e.id = enrolment_id and public.teaches_cohort(e.cohort_id))));

create policy "published results visible to student" on public.results for select using (
  public.is_staff() or (published_at is not null and exists (select 1 from public.enrolments e where e.id = enrolment_id and e.user_id = auth.uid())));
create policy "director publishes results" on public.results for all using (public.is_director()) with check (public.is_director());

create policy "own certificate read" on public.certificates for select using (
  public.is_director() or exists (select 1 from public.enrolments e where e.id = enrolment_id and e.user_id = auth.uid()));

-- ---------- Communication ----------
create policy "announcements visible" on public.announcements for select using (
  public.is_staff()
  or (programme_id is null and cohort_id is null)
  or exists (select 1 from public.enrolments e join public.cohorts c on c.id = e.cohort_id
             where e.user_id = auth.uid() and (e.cohort_id = announcements.cohort_id or c.programme_id = announcements.programme_id)));
create policy "staff post announcements" on public.announcements for insert with check (
  public.is_director() or public.is_content_editor() or (cohort_id is not null and public.teaches_cohort(cohort_id)));
create policy "own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "mark own notifications read" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tickets" on public.support_tickets for select using (user_id = auth.uid() or public.is_staff());
create policy "open own ticket" on public.support_tickets for insert with check (user_id = auth.uid());
create policy "staff update tickets" on public.support_tickets for update using (public.is_staff()) with check (public.is_staff());
create policy "ticket messages visible" on public.ticket_messages for select using (
  public.is_staff() or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()));
create policy "post ticket message" on public.ticket_messages for insert with check (
  author_id = auth.uid() and (public.is_staff() or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())));

-- ---------- Audit (read-only for directors; written by functions) ----------
create policy "director reads audit" on public.audit_log for select using (public.is_director());
-- number_counters: no policies → no client access at all.

-- ============ Storage ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('applicant-documents', 'applicant-documents', false, 2097152, array['image/jpeg','image/png','application/pdf']),
  ('generated', 'generated', false, 10485760, array['application/pdf']),
  ('public-media', 'public-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif','application/pdf'])
on conflict (id) do nothing;

-- applicant-documents: path = {user_id}/{application_id}/{type}-{uuid}.{ext}
create policy "applicants upload into own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'applicant-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "applicants read own files" on storage.objects for select to authenticated
  using (bucket_id = 'applicant-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admissions()));
create policy "generated read own" on storage.objects for select to authenticated
  using (bucket_id = 'generated' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
create policy "public media read" on storage.objects for select using (bucket_id = 'public-media');
create policy "editors manage public media" on storage.objects for all to authenticated
  using (bucket_id = 'public-media' and public.is_content_editor())
  with check (bucket_id = 'public-media' and public.is_content_editor());
