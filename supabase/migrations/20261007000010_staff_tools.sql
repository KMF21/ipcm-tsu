-- Staff tools: record bank or sponsor payments, manage contact messages, protect names on letters.

-- ============ Bank and sponsor payments recorded by Bursary ============
-- Creates the payment and confirms it exactly like a Paystack payment (receipt, unlock or admission).
create or replace function public.staff_record_payment(
  p_application uuid,
  p_fee_type public.fee_type,
  p_method public.payment_method,
  p_bank_reference text,
  p_note text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  actor uuid := auth.uid();
  a applications%rowtype;
  f fee_items%rowtype;
  ref text;
  res jsonb;
begin
  if not public.is_bursary() then raise exception 'Only Bursary staff can record payments'; end if;
  if p_method not in ('manual', 'sponsor') then raise exception 'Choose bank payment or sponsor payment'; end if;
  if coalesce(trim(p_bank_reference), '') = '' then raise exception 'Enter the bank teller or transfer reference'; end if;
  select * into a from applications where id = p_application for update;
  if not found then raise exception 'Application not found'; end if;

  if p_fee_type = 'application' then
    if a.status <> 'draft' or a.application_fee_paid_at is not null then raise exception 'The application fee is already paid for this application'; end if;
  elsif p_fee_type = 'tuition' then
    if a.status <> 'offered' then raise exception 'Tuition can only be recorded for an application with an offer'; end if;
  else
    raise exception 'Unsupported fee type';
  end if;
  if exists (select 1 from payments p join fee_items fi on fi.id = p.fee_item_id
             where p.reference like 'IPCM-%' and fi.type = p_fee_type and p.status = 'paid'
               and p.paystack_payload->>'bank_reference' = trim(p_bank_reference)) then
    raise exception 'That bank reference has already been recorded';
  end if;

  select * into f from fee_items where programme_id = a.programme_id and type = p_fee_type and active;
  if not found then raise exception 'Fee not configured for this programme'; end if;

  ref := 'IPCM-' || case when p_method = 'sponsor' then 'SPN' else 'BNK' end || '-' || replace(gen_random_uuid()::text, '-', '');
  insert into payments (user_id, application_id, fee_item_id, reference, base_amount_kobo, processing_fee_kobo, method, recorded_by, note, paystack_payload)
  values (a.user_id, a.id, f.id, ref, f.base_amount_kobo, f.processing_fee_kobo, p_method, actor,
          coalesce(nullif(trim(p_note), ''), 'Recorded by Bursary'),
          jsonb_build_object('channel', 'bank', 'bank_reference', trim(p_bank_reference), 'recorded_by', actor));

  res := public.confirm_payment(ref, f.base_amount_kobo + f.processing_fee_kobo, jsonb_build_object('channel', 'bank', 'bank_reference', trim(p_bank_reference), 'recorded_by', actor));
  return res || jsonb_build_object('reference', ref, 'payment_id', (select id from payments where reference = ref));
end $$;
revoke execute on function public.staff_record_payment(uuid, public.fee_type, public.payment_method, text, text) from public, anon;
grant execute on function public.staff_record_payment(uuid, public.fee_type, public.payment_method, text, text) to authenticated;

-- ============ Contact messages ============
drop policy if exists "staff update contact messages" on public.contact_messages;
create policy "staff update contact messages" on public.contact_messages for update
  using (public.is_staff()) with check (public.is_staff());

-- ============ Names on letters and certificates ============
-- After admission, a student's name and email can only be changed by staff (they appear on documents).
create or replace function public.protect_profile_identity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and auth.uid() = new.id and not public.is_staff() then
    if new.email is distinct from old.email then
      raise exception 'Ask the admissions office to change your email';
    end if;
    if (new.title, new.first_name, new.other_names, new.surname) is distinct from (old.title, old.first_name, old.other_names, old.surname)
       and exists (select 1 from enrolments where user_id = new.id) then
      raise exception 'Ask the admissions office to correct your name';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_identity on public.profiles;
create trigger profiles_protect_identity before update on public.profiles
  for each row execute function public.protect_profile_identity();
