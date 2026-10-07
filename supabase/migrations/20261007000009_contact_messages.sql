-- Messages sent from the website's contact form. Written only by the server (service role);
-- staff can read them.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 30),
  topic text not null,
  message text not null check (char_length(message) between 10 and 4000),
  ip_hash text,
  status text not null default 'new' check (status in ('new', 'replied', 'closed')),
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_recent on public.contact_messages (ip_hash, created_at desc);
alter table public.contact_messages enable row level security;
drop policy if exists "staff read contact messages" on public.contact_messages;
create policy "staff read contact messages" on public.contact_messages for select using (public.is_staff());
