-- Reopening a payment (undoing an accidental Verify) must take back the credits
-- that verification granted, or re-verifying would grant them twice.
--
-- Clamped at zero: if the user already spent some, we claw back only what's
-- left rather than pushing the balance negative (user_credits has balance >= 0).
-- The ledger records the amount actually reversed. Run AFTER 0005.

create or replace function public.revoke_credits(
  p_user_id text, p_amount int, p_reason text, p_payment_request_id uuid
)
returns int
language plpgsql
as $$
declare
  current_balance int;
  applied int;
  new_balance int;
begin
  select balance into current_balance
    from public.user_credits where user_id = p_user_id for update;
  if current_balance is null then
    return 0;  -- no balance row: nothing to take back
  end if;

  applied := least(current_balance, greatest(p_amount, 0));
  if applied = 0 then
    return current_balance;
  end if;

  update public.user_credits
     set balance = balance - applied, updated_at = now()
   where user_id = p_user_id
   returning balance into new_balance;

  insert into public.credit_ledger (user_id, delta, reason, payment_request_id)
  values (p_user_id, -applied, p_reason, p_payment_request_id);

  return new_balance;
end;
$$;
