-- Create a secure RPC function to fetch the total user count from auth.users.
-- Since the auth schema is protected, this function uses 'security definer' 
-- to execute with the database owner's privileges (postgres), making it safely 
-- callable from the public client side without exposing user details.
create or replace function public.get_user_count()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_count integer;
begin
  select count(*)::integer into user_count from auth.users;
  return user_count;
end;
$$;

-- Grant execution permission to the anonymous and authenticated users
grant execute on function public.get_user_count() to anon, authenticated;
