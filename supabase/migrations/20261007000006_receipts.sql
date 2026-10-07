-- Receipts with QR verification.
-- Every payment gets a random, unguessable verify_token. The QR code on a receipt links to
-- /verify/receipt/<token>. Receipt numbers are sequential, so they are never used in public links.

alter table public.payments
  add column if not exists verify_token text not null unique default replace(gen_random_uuid()::text, '-', '');

-- Full receipt for the payer (or bursary staff). Returns null if not found, not paid, or not theirs.
create or replace function public.get_receipt(p_payment uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  select jsonb_build_object(
    'id', p.id,
    'receipt_no', p.receipt_no,
    'verify_token', p.verify_token,
    'reference', p.reference,
    'paid_at', p.paid_at,
    'method', p.method,
    'channel', coalesce(p.paystack_payload->>'channel', ''),
    'base_amount_kobo', p.base_amount_kobo,
    'processing_fee_kobo', p.processing_fee_kobo,
    'amount_kobo', p.amount_kobo,
    'fee_type', f.type,
    'programme_code', pr.code,
    'programme_title', pr.title,
    'cohort_name', c.name,
    'application_ref', a.ref,
    'reg_no', e.reg_no,
    'payer_name', trim(concat_ws(' ', nullif(pf.title, ''), pf.first_name, nullif(pf.other_names, ''), pf.surname)),
    'payer_email', pf.email,
    'payer_phone', pf.phone
  ) into r
  from payments p
  join fee_items f on f.id = p.fee_item_id
  join programmes pr on pr.id = f.programme_id
  join profiles pf on pf.id = p.user_id
  left join applications a on a.id = p.application_id
  left join cohorts c on c.id = a.cohort_id
  left join enrolments e on e.application_id = a.id and f.type = 'tuition'
  where p.id = p_payment
    and p.status = 'paid'
    and (p.user_id = auth.uid() or public.is_bursary());
  return r;
end $$;
revoke execute on function public.get_receipt(uuid) from public, anon;
grant execute on function public.get_receipt(uuid) to authenticated;

-- Public check behind the QR code. Shows only what is needed to confirm the receipt is genuine:
-- no email, phone, address or payment reference.
create or replace function public.verify_receipt(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then return null; end if;
  select jsonb_build_object(
    'valid', p.status = 'paid',
    'status', p.status,
    'receipt_no', p.receipt_no,
    'paid_at', p.paid_at,
    'amount_kobo', p.amount_kobo,
    'fee_type', f.type,
    'programme_code', pr.code,
    'programme_title', pr.title,
    'cohort_name', c.name,
    'payer_name', trim(concat_ws(' ', nullif(pf.title, ''), pf.first_name, nullif(pf.other_names, ''), pf.surname))
  ) into r
  from payments p
  join fee_items f on f.id = p.fee_item_id
  join programmes pr on pr.id = f.programme_id
  join profiles pf on pf.id = p.user_id
  left join applications a on a.id = p.application_id
  left join cohorts c on c.id = a.cohort_id
  where p.verify_token = p_token and p.receipt_no is not null;
  return r;
end $$;
revoke execute on function public.verify_receipt(text) from public;
grant execute on function public.verify_receipt(text) to anon, authenticated;
