-- Migration to allow instant phone number and auth email updates for FarmRisk users
create or replace function public.update_user_phone(new_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_id uuid := auth.uid();
  new_email text;
begin
  if user_id is null then
    raise exception 'Not authenticated';
  end if;

  if new_phone is null or length(trim(new_phone)) = 0 then
    raise exception 'Phone number cannot be empty';
  end if;

  new_email := concat(trim(new_phone), '@farmrisk.app');

  -- 1. Instantly update auth.users email and clear pending email change
  update auth.users
  set email = new_email,
      email_change = null,
      new_email = null,
      raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{phone}', to_jsonb(trim(new_phone))),
      updated_at = timezone('utc', now())
  where id = user_id;

  -- 2. Instantly update public.profiles metadata phone
  update public.profiles
  set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{phone}', to_jsonb(trim(new_phone))),
      updated_at = timezone('utc', now())
  where id = user_id;
end;
$$;

grant execute on function public.update_user_phone(text) to authenticated;
