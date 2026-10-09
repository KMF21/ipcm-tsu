-- New fees: application ₦35,000 + ₦300, tuition ₦100,000 + ₦300.
-- Only changes fee items still at the old standard amounts, so any custom fee set under Admin → Fees is kept.
-- Payments already made, and payments already started, keep the amount they were created with.
update public.fee_items set base_amount_kobo = 3500000, updated_at = now()
 where type = 'application' and base_amount_kobo = 1500000;
update public.fee_items set base_amount_kobo = 10000000, updated_at = now()
 where type = 'tuition' and base_amount_kobo = 3500000;
