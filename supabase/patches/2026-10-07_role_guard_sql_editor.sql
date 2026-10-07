-- Patch: let the SQL editor / service role grant roles (no end-user JWT),
-- while signed-in app users still cannot change their own role.
-- Safe to run more than once.

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
