-- "Middle path" admissions flow:
--   1. choose programme and intake  2. see checklist, pay the application fee
--   3. complete the rest of the form  4. submit (free)
-- Paying the application fee no longer submits the application; it unlocks the form.

alter table public.applications add column if not exists application_fee_paid_at timestamptz;

-- Creates a pending payment for the signed-in applicant. The amount always comes from fee_items,
-- never from the browser. Returns what the server needs to start a Paystack checkout.
create or replace function public.create_payment(p_fee_type public.fee_type)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  a applications%rowtype;
  f fee_items%rowtype;
  ref text;
  v_email text;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  select * into a from applications where user_id = uid order by created_at desc limit 1;
  if not found then raise exception 'No application found'; end if;

  if p_fee_type = 'application' then
    if a.status <> 'draft' then raise exception 'Application fee is not due'; end if;
    if a.application_fee_paid_at is not null then raise exception 'Application fee already paid'; end if;
  elsif p_fee_type = 'tuition' then
    if a.status <> 'offered' then raise exception 'Tuition is not due'; end if;
    if a.offer_expires_at is not null and a.offer_expires_at < now() then raise exception 'Offer has expired'; end if;
  else
    raise exception 'Unsupported fee type';
  end if;

  select * into f from fee_items where programme_id = a.programme_id and type = p_fee_type and active;
  if not found then raise exception 'Fee not configured for this programme'; end if;

  ref := 'IPCM-' || upper(left(p_fee_type::text, 3)) || '-' || replace(gen_random_uuid()::text, '-', '');
  insert into payments (user_id, application_id, fee_item_id, reference, base_amount_kobo, processing_fee_kobo)
  values (uid, a.id, f.id, ref, f.base_amount_kobo, f.processing_fee_kobo);

  select email into v_email from profiles where id = uid;
  return jsonb_build_object(
    'reference', ref,
    'amount_kobo', f.base_amount_kobo + f.processing_fee_kobo,
    'email', v_email,
    'application_id', a.id,
    'fee_type', p_fee_type
  );
end $$;
revoke execute on function public.create_payment(public.fee_type) from public, anon;
grant execute on function public.create_payment(public.fee_type) to authenticated;

-- Payment confirmation (server only, after verifying with Paystack). Idempotent.
create or replace function public.confirm_payment(p_reference text, p_amount_kobo integer, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  p payments%rowtype;
  f fee_items%rowtype;
  a applications%rowtype;
  prog_code text;
  yr smallint := extract(year from now())::smallint;
  v_receipt text;
  v_reg text;
begin
  select * into p from payments where reference = p_reference for update;
  if not found then raise exception 'Unknown payment reference %', p_reference; end if;
  if p.status = 'paid' then
    return jsonb_build_object('already_processed', true, 'receipt_no', p.receipt_no,
      'fee_type', (select type from fee_items where id = p.fee_item_id));
  end if;
  if p.amount_kobo <> p_amount_kobo then
    update payments set status = 'failed', paystack_payload = p_payload, note = 'Amount mismatch' where id = p.id;
    raise exception 'Amount mismatch for %: expected %, got %', p_reference, p.amount_kobo, p_amount_kobo;
  end if;

  v_receipt := public.next_receipt_no(yr);
  update payments set status = 'paid', paid_at = now(), paystack_payload = p_payload, receipt_no = v_receipt where id = p.id;

  select * into f from fee_items where id = p.fee_item_id;
  select * into a from applications where id = p.application_id for update;

  if f.type = 'application' then
    -- Unlocks the rest of the form. The applicant submits later, at no extra cost.
    update applications set application_fee_paid_at = coalesce(application_fee_paid_at, now()) where id = a.id;
  elsif f.type = 'tuition' and a.status = 'offered' then
    select code into prog_code from programmes where id = a.programme_id;
    -- Registration number carries the cohort's year, not the payment date's year.
    v_reg := public.next_reg_no(prog_code, (select extract(year from start_date)::smallint from cohorts where id = a.cohort_id));
    perform public.transition_application(a.id, 'admitted', p.user_id, 'Tuition paid');
    insert into enrolments (application_id, user_id, cohort_id, reg_no) values (a.id, a.user_id, a.cohort_id, v_reg);
    perform set_config('ipcm.system_update', 'on', true);  -- transaction-local
    update profiles set role = 'student' where id = a.user_id and role = 'applicant';
    perform set_config('ipcm.system_update', 'off', true);
  end if;

  insert into audit_log (actor_id, action, entity, entity_id, after)
  values (p.user_id, 'payment.confirmed', 'payments', p.id::text,
          jsonb_build_object('reference', p_reference, 'receipt_no', v_receipt, 'reg_no', v_reg));

  return jsonb_build_object('already_processed', false, 'receipt_no', v_receipt, 'reg_no', v_reg, 'fee_type', f.type);
end $$;
revoke execute on function public.confirm_payment(text, integer, jsonb) from public, anon, authenticated;

-- Marks a payment that the applicant abandoned or that Paystack reported as failed.
create or replace function public.mark_payment_failed(p_reference text, p_status public.payment_status, p_payload jsonb)
returns void language sql security definer set search_path = public as $$
  update payments set status = p_status, paystack_payload = p_payload
  where reference = p_reference and status = 'pending';
$$;
revoke execute on function public.mark_payment_failed(text, public.payment_status, jsonb) from public, anon, authenticated;

-- Final submission (free): only after the application fee is paid and the form is complete.
create or replace function public.applicant_submit(p_application uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a applications%rowtype;
begin
  select * into a from applications where id = p_application and user_id = auth.uid() for update;
  if not found then raise exception 'Application not found'; end if;
  if a.status <> 'draft' then raise exception 'Application already submitted'; end if;
  if a.application_fee_paid_at is null then raise exception 'Pay the application fee first'; end if;
  perform public.transition_application(p_application, 'submitted', auth.uid(), 'Submitted by applicant');
end $$;
revoke execute on function public.applicant_submit(uuid) from public, anon;
grant execute on function public.applicant_submit(uuid) to authenticated;
