-- IPCM-TSU core schema
-- Database is the single source of truth: amounts (kobo), statuses and numbers are computed here.

create extension if not exists pgcrypto;

-- ============ Enums ============
create type public.user_role as enum ('applicant','student','facilitator','editor','bursary','admissions','director','super_admin');
create type public.application_status as enum ('draft','submitted','under_review','changes_requested','offered','admitted','declined','offer_expired','withdrawn');
create type public.document_type as enum ('passport_photo','qualification','identification','cv','sponsorship_letter');
create type public.document_status as enum ('pending','approved','rejected');
create type public.payment_status as enum ('pending','paid','failed','abandoned','refunded');
create type public.payment_method as enum ('paystack','manual','sponsor');
create type public.fee_type as enum ('application','acceptance','tuition');
create type public.enrolment_status as enum ('active','completed','failed','deferred','withdrawn');
create type public.attendance_mark as enum ('present','absent','excused');
create type public.cohort_status as enum ('draft','open','closed','running','completed');

-- ============ Helpers ============
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============ Reference data ============
create table public.states (
  id smallserial primary key,
  name text not null unique
);
create table public.lgas (
  id serial primary key,
  state_id smallint not null references public.states(id) on delete cascade,
  name text not null,
  unique (state_id, name)
);

-- ============ People ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'applicant',
  title text,
  surname text,
  first_name text,
  other_names text,
  email text not null,
  phone text,
  sex text check (sex in ('female','male')),
  dob date,
  state_id smallint references public.states(id),
  lga_id int references public.lgas(id),
  address text,
  nin text check (nin is null or nin ~ '^[0-9]{11}$'),
  photo_path text,
  organisation text,
  job_role text,
  sector text,
  years_experience smallint,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- Role check used by RLS. security definer avoids recursive policy lookups on profiles.
create or replace function public.has_role(roles public.user_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active and p.role = any(roles));
$$;

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(array['facilitator','editor','bursary','admissions','director','super_admin']::public.user_role[]);
$$;

-- Create a profile automatically on sign-up (role always 'applicant'; staff roles are granted by admins).
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, surname, phone)
  values (new.id, new.email,
          new.raw_user_meta_data->>'first_name',
          new.raw_user_meta_data->>'surname',
          new.raw_user_meta_data->>'phone');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Users may edit their own profile but never their own role or active flag.
create or replace function public.protect_profile_role() returns trigger language plpgsql as $$
begin
  -- System updates (e.g. confirm_payment promoting applicant -> student) set ipcm.system_update for
  -- the current transaction only. Otherwise only a super admin may change roles or active status.
  -- Requests with no end-user JWT (SQL editor, service role) are trusted; app users are not.
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and auth.uid() is not null
     and coalesce(current_setting('ipcm.system_update', true), '') <> 'on'
     and not public.has_role(array['super_admin']::public.user_role[]) then
    raise exception 'Only a super admin can change roles';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_profile_role();

-- ============ Catalogue ============
create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{2,5}$'),
  slug text not null unique,
  title text not null,
  short_title text not null,
  promise text not null,
  overview text not null,
  audience text[] not null default '{}',
  audience_tags text[] not null default '{}',
  outcomes text[] not null default '{}',
  capstone text not null,
  assessment jsonb not null default '[{"label":"Attendance and participation","weight":20},{"label":"Module exercises and quizzes","weight":30},{"label":"Capstone project","weight":50}]',
  entry_requirements text[] not null default '{}',
  duration_weeks smallint not null default 8,
  delivery_mode text not null default 'In person, with materials and recordings in the portal',
  schedule_text text not null default 'Saturdays, 9:00am to 4:00pm',
  hero_image_path text,
  card_image_path text,
  min_attendance_pct smallint not null default 75,
  pass_mark_pct smallint not null default 50,
  distinction_pct smallint not null default 70,
  is_published boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger programmes_updated before update on public.programmes for each row execute function public.set_updated_at();

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  number smallint not null,
  title text not null,
  summary text not null,
  weight numeric(5,2) not null default 7.5,
  unique (programme_id, number)
);

create table public.fee_items (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  type public.fee_type not null,
  base_amount_kobo integer not null check (base_amount_kobo >= 0),
  processing_fee_kobo integer not null default 30000 check (processing_fee_kobo >= 0),
  active boolean not null default true,
  instalment_plan jsonb, -- e.g. [{"pct":60,"due":"before_start"},{"pct":40,"due_week":4}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_id, type)
);
create trigger fee_items_updated before update on public.fee_items for each row execute function public.set_updated_at();

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete restrict,
  name text not null,
  start_date date not null,
  end_date date not null,
  application_deadline date not null,
  capacity smallint not null default 40,
  venue text,
  offer_expiry_days smallint not null default 14,
  status public.cohort_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create trigger cohorts_updated before update on public.cohorts for each row execute function public.set_updated_at();

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  module_id uuid references public.modules(id),
  facilitator_id uuid references public.profiles(id),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue text,
  online_url text
);

-- ============ Sponsors ============
create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  organisation text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ Admissions ============
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  programme_id uuid not null references public.programmes(id),
  cohort_id uuid not null references public.cohorts(id),
  status public.application_status not null default 'draft',
  step_data jsonb not null default '{}',
  statement text,
  sponsor_id uuid references public.sponsors(id),
  is_mature_entry boolean not null default false,
  submitted_at timestamptz,
  offered_at timestamptz,
  offer_expires_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cohort_id)
);
create trigger applications_updated before update on public.applications for each row execute function public.set_updated_at();

create table public.application_status_history (
  id bigserial primary key,
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  actor_id uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.document_type not null,
  storage_path text not null,
  mime text not null check (mime in ('image/jpeg','image/png','application/pdf')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 2097152),
  status public.document_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'rejected' or rejection_reason is not null)
);

-- ============ Payments ============
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  application_id uuid references public.applications(id),
  fee_item_id uuid not null references public.fee_items(id),
  reference text not null unique,
  base_amount_kobo integer not null,
  processing_fee_kobo integer not null,
  amount_kobo integer generated always as (base_amount_kobo + processing_fee_kobo) stored,
  status public.payment_status not null default 'pending',
  method public.payment_method not null default 'paystack',
  paystack_payload jsonb,
  paid_at timestamptz,
  receipt_no text unique,
  receipt_path text,
  recorded_by uuid references public.profiles(id),
  proof_path text,
  note text,
  created_at timestamptz not null default now(),
  check (method <> 'manual' or (recorded_by is not null and note is not null))
);

create table public.sponsor_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  sponsor_id uuid not null references public.sponsors(id),
  cohort_id uuid not null references public.cohorts(id),
  amount_kobo integer not null,
  status public.payment_status not null default 'pending',
  proof_path text,
  marked_paid_by uuid references public.profiles(id),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.invoice_items (
  invoice_id uuid not null references public.sponsor_invoices(id) on delete cascade,
  application_id uuid not null references public.applications(id),
  primary key (invoice_id, application_id)
);

-- ============ Learning ============
create table public.enrolments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id),
  user_id uuid not null references public.profiles(id),
  cohort_id uuid not null references public.cohorts(id),
  reg_no text not null unique,
  status public.enrolment_status not null default 'active',
  admission_letter_path text,
  admitted_at timestamptz not null default now()
);

create table public.attendance (
  session_id uuid not null references public.sessions(id) on delete cascade,
  enrolment_id uuid not null references public.enrolments(id) on delete cascade,
  mark public.attendance_mark not null,
  marked_by uuid references public.profiles(id),
  marked_at timestamptz not null default now(),
  primary key (session_id, enrolment_id)
);

create table public.assessment_scores (
  id uuid primary key default gen_random_uuid(),
  enrolment_id uuid not null references public.enrolments(id) on delete cascade,
  component text not null check (component in ('participation','module','capstone')),
  module_id uuid references public.modules(id),
  score numeric(6,2) not null check (score >= 0),
  max_score numeric(6,2) not null check (max_score > 0),
  entered_by uuid references public.profiles(id),
  locked boolean not null default false,
  updated_at timestamptz not null default now(),
  check (score <= max_score),
  unique (enrolment_id, component, module_id)
);

create table public.results (
  enrolment_id uuid primary key references public.enrolments(id) on delete cascade,
  attendance_pct numeric(5,2),
  total_pct numeric(5,2),
  classification text check (classification in ('Distinction','Pass','Fail')),
  published_at timestamptz,
  published_by uuid references public.profiles(id)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  enrolment_id uuid not null unique references public.enrolments(id),
  certificate_no text not null unique,
  issued_at timestamptz not null default now(),
  pdf_path text,
  revoked_at timestamptz,
  revoke_reason text,
  verify_hash text not null default encode(gen_random_bytes(16), 'hex')
);

-- ============ Communication ============
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  programme_id uuid references public.programmes(id),
  cohort_id uuid references public.cohorts(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  status text not null default 'open' check (status in ('open','answered','closed')),
  created_at timestamptz not null default now()
);
create table public.ticket_messages (
  id bigserial primary key,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ============ Website content (editable in admin) ============
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  is_placeholder boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check (kind in ('policy_brief','publication','event_report','research_note','news')),
  title text not null,
  excerpt text,
  body jsonb,
  cover_path text,
  pdf_path text,
  author text,
  published_at timestamptz,
  is_placeholder boolean not null default false
);
create table public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  group_name text not null check (group_name in ('director','board','staff','facilitator')),
  bio text,
  expertise text[] default '{}',
  photo_path text,
  sort_order smallint default 0,
  is_placeholder boolean not null default false
);
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_path text,
  url text,
  sort_order smallint default 0,
  is_placeholder boolean not null default false
);
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  sort_order smallint default 0
);

-- ============ Audit ============
create table public.audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- Useful indexes
create index on public.applications (status, cohort_id);
create index on public.applications (user_id);
create index on public.documents (application_id);
create index on public.payments (user_id);
create index on public.payments (status);
create index on public.enrolments (cohort_id);
create index on public.sessions (cohort_id, starts_at);
create index on public.notifications (user_id, read_at);
