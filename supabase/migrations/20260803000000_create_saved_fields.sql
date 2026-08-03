-- Create saved_fields table for the relational "My Fields" feature.
-- Replaces the legacy JSON-array storage inside profiles.metadata.fields.

create table public.saved_fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  field_id text,
  field_name text,
  year text,
  country_code text,
  geometry jsonb,
  properties jsonb,
  center_lat double precision,
  center_lng double precision,
  area_m2 double precision,
  confidence double precision,
  season text,
  crop_stage text,
  crops text[],
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.saved_fields is
  'Relational store for a user''s saved farm fields. One row per saved field.';
comment on column public.saved_fields.field_id is
  'Identifier of the source field (e.g. FTW feature id) that was saved.';

-- Fast lookups per user + a uniqueness guard that mirrors the old
-- "already added" behaviour (same source field + year cannot be saved twice).
create index saved_fields_user_id_idx on public.saved_fields (user_id);
create unique index saved_fields_user_field_year_idx
  on public.saved_fields (user_id, field_id, year);

-- Row Level Security: users only ever touch their own rows.
alter table public.saved_fields enable row level security;

create policy "Users can read own saved fields"
on public.saved_fields
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own saved fields"
on public.saved_fields
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own saved fields"
on public.saved_fields
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own saved fields"
on public.saved_fields
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.saved_fields to authenticated;
