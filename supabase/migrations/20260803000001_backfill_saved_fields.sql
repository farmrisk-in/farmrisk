-- One-time backfill: copies legacy profiles.metadata.fields (a JSON array)
-- into the new relational saved_fields table, then drops the fields key from
-- metadata so the app stops using it permanently.
--
-- Safe to run multiple times: the (user_id, field_id, year) unique index
-- prevents duplicate rows, and metadata is only touched for users that were
-- actually migrated.

do $$
declare
  profile_rec record;
  f jsonb;
  migrated_user_ids uuid[] := '{}';
begin
  for profile_rec in
    select p.id as user_id, p.metadata
    from public.profiles p
    where jsonb_typeof(p.metadata -> 'fields') = 'array'
      and jsonb_array_length(p.metadata -> 'fields') > 0
  loop
    for f in
      select value from jsonb_array_elements(profile_rec.metadata -> 'fields')
    loop
      begin
        insert into public.saved_fields (
          user_id, field_id, field_name, year, country_code,
          geometry, properties, center_lat, center_lng,
          area_m2, confidence, season, crop_stage, crops, created_at
        ) values (
          profile_rec.user_id,
          nullif(f ->> 'id', ''),
          nullif(f ->> 'name', ''),
          nullif(f ->> 'year', ''),
          nullif(f ->> 'countryCode', ''),
          (f -> 'geometry')::jsonb,
          (f -> 'properties')::jsonb,
          nullif(f ->> 'centerLat', '')::double precision,
          nullif(f ->> 'centerLng', '')::double precision,
          nullif(f ->> 'areaM2', '')::double precision,
          nullif(f ->> 'confidence', '')::double precision,
          nullif(f ->> 'season', ''),
          nullif(f ->> 'cropStage', ''),
          coalesce(
            case
              when jsonb_typeof(f -> 'crops') = 'array'
                then array(select jsonb_array_elements_text(f -> 'crops'))
            end,
            array[]::text[]
          ),
          coalesce(nullif(f ->> 'savedAt', '')::timestamptz, timezone('utc', now()))
        )
        on conflict (user_id, field_id, year) do nothing;
      exception when others then
        raise notice 'Skipping malformed legacy field for user %: %', profile_rec.user_id, f;
      end;
    end loop;

    migrated_user_ids := migrated_user_ids || profile_rec.user_id;
  end loop;

  -- Remove the now-migrated fields key so the app never reads it again.
  if array_length(migrated_user_ids, 1) is not null then
    update public.profiles
    set metadata = metadata - 'fields'
    where id = any(migrated_user_ids);
  end if;
end;
$$;
