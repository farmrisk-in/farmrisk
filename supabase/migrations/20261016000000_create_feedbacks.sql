-- Migration: create feedbacks table
create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  topic text not null default 'General',
  message text not null,
  email text,
  phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.feedbacks is 'Farmer and user feedback, bug reports, and feature suggestions.';

alter table public.feedbacks enable row level security;

-- Anyone (authenticated or guest/anon) can submit feedback
create policy "Anyone can insert feedback"
on public.feedbacks
for insert
with check (true);

-- Authenticated users can view their own feedback submissions
create policy "Users can view their own feedback"
on public.feedbacks
for select
to authenticated
using ((select auth.uid()) = user_id);

grant insert on table public.feedbacks to anon, authenticated;
grant select on table public.feedbacks to authenticated;
