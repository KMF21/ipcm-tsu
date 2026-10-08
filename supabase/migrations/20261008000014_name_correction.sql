-- Staff correct an applicant's or student's name, with a reason, logged.
-- Issued certificates keep the name they were printed with; they must be revoked and reissued.
create or replace function public.staff_correct_name(
  p_user uuid, p_title text, p_first text, p_other text, p_surname text, p_reason text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare pf profiles%rowtype; certs text[];
begin
  if not public.is_admissions() then raise exception 'Only admissions, the Director or a super admin can correct names'; end if;
  select * into pf from profiles where id = p_user for update;
  if not found then raise exception 'Account not found'; end if;
  if pf.role not in ('applicant', 'student') then raise exception 'Not allowed: staff names are changed under Staff accounts'; end if;
  if length(trim(coalesce(p_first, ''))) < 2 or length(trim(coalesce(p_surname, ''))) < 2 then raise exception 'Enter the first name and surname'; end if;
  if length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'Give a reason for the correction (at least 5 characters)'; end if;
  if (nullif(trim(coalesce(p_title, '')), ''), trim(p_first), nullif(trim(coalesce(p_other, '')), ''), trim(p_surname))
     is not distinct from (nullif(pf.title, ''), pf.first_name, nullif(pf.other_names, ''), pf.surname) then
    raise exception 'Not allowed: the name is unchanged';
  end if;

  update profiles set title = nullif(trim(coalesce(p_title, '')), ''), first_name = trim(p_first),
         other_names = nullif(trim(coalesce(p_other, '')), ''), surname = trim(p_surname)
   where id = p_user;

  select coalesce(array_agg(ce.certificate_no order by ce.certificate_no), '{}') into certs
    from certificates ce join enrolments e on e.id = ce.enrolment_id
   where e.user_id = p_user and ce.revoked_at is null;

  insert into audit_log (actor_id, action, entity, entity_id, before, after)
  values (auth.uid(), 'help.name_corrected', 'profiles', p_user::text,
          jsonb_build_object('title', pf.title, 'first_name', pf.first_name, 'other_names', pf.other_names, 'surname', pf.surname),
          jsonb_build_object('title', nullif(trim(coalesce(p_title, '')), ''), 'first_name', trim(p_first), 'other_names', nullif(trim(coalesce(p_other, '')), ''),
                             'surname', trim(p_surname), 'reason', trim(p_reason), 'certificates_to_reissue', to_jsonb(certs)));
  return jsonb_build_object('certificates', to_jsonb(certs));
end $$;
revoke execute on function public.staff_correct_name(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.staff_correct_name(uuid, text, text, text, text, text) to authenticated;
