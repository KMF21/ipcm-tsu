-- ============================================================================
-- IPCM-TSU TEST USERS — for development and staging only. Never run on the live
-- production project once real applicants are using it.
--
-- Creates one confirmed account per role. Run in Supabase → SQL Editor.
-- Password for every account: ipcm2027
-- Safe to run more than once (existing test emails are skipped).
-- Remove them all with the CLEANUP block at the bottom.
-- ============================================================================

do $$
declare
  pw constant text := 'ipcm2027';
  u record;
  new_id uuid;
begin
  for u in
    select * from (values
      ('superadmin@example.com', 'Super',     'Admin',       'super_admin'),
      ('director@example.com',   'Grace',     'Director',    'director'),
      ('admissions@example.com', 'Musa',      'Admissions',  'admissions'),
      ('bursary@example.com',    'Ruth',      'Bursary',     'bursary'),
      ('facilitator@example.com','Daniel',    'Facilitator', 'facilitator'),
      ('editor@example.com',     'Hauwa',     'Editor',      'editor'),
      ('applicant@example.com',  'Amina',     'Bello',       'applicant'),
      ('student@example.com',    'Ibrahim',   'Danjuma',     'student')
    ) as t(email, first_name, surname, role)
  loop
    if exists (select 1 from auth.users where email = u.email) then
      raise notice 'Skipping % (already exists)', u.email;
      continue;
    end if;

    new_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
      u.email, extensions.crypt(pw, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('first_name', u.first_name, 'surname', u.surname),
      now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), new_id, new_id::text, 'email',
      jsonb_build_object('sub', new_id::text, 'email', u.email, 'email_verified', true),
      now(), now(), now()
    );

    -- The on_auth_user_created trigger has just created the profile as 'applicant'.
    -- Running in the SQL editor (no end-user JWT), the role guard allows this change.
    update public.profiles set role = u.role::public.user_role where id = new_id;

    raise notice 'Created % as %', u.email, u.role;
  end loop;
end $$;

-- Check the result
select p.email, p.role, p.first_name, p.surname
from public.profiles p
where p.email like '%@example.com'
order by p.role;


-- ============================================================================
-- CLEANUP — removes every test account above (profiles are deleted with them).
-- Uncomment and run when you no longer need them.
-- ============================================================================
-- delete from auth.users where email in (
--   'superadmin@example.com','director@example.com','admissions@example.com','bursary@example.com',
--   'facilitator@example.com','editor@example.com','applicant@example.com','student@example.com'
-- );
