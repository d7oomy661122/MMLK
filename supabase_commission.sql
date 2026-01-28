-- Function to calculate 10% commission on VIP purchase
create or replace function public.handle_vip_commission()
returns trigger
language plpgsql
security definer
as $$
declare
  referrer_id uuid;
  commission decimal;
begin
  -- Get the referrer of the user making the purchase
  select referral_by into referrer_id
  from public.users
  where id = new.user_id;

  -- If referrer exists and amount is greater than 0
  if referrer_id is not null and new.amount_paid > 0 then
    commission := new.amount_paid * 0.10;

    -- Update referrer's balance and profit stats
    update public.users
    set
      balance = balance + commission,
      total_referral_profit = total_referral_profit + commission,
      today_referral_profit = today_referral_profit + commission
    where id = referrer_id;
  end if;

  return new;
end;
$$;

-- Trigger
drop trigger if exists on_vip_purchase_commission on public.vip_purchases;
create trigger on_vip_purchase_commission
after insert on public.vip_purchases
for each row execute procedure public.handle_vip_commission();