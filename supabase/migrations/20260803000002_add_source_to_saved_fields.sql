-- Distinguishes automatically detected field boundaries from fields that the
-- user drew by hand on the map. Existing rows are auto-detected.
alter table public.saved_fields
  add column source text not null default 'detected'
  check (source in ('detected', 'manual'));
