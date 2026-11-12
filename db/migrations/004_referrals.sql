-- Keystone Gutter Glow: referrals. Run after 003_firewood_orders.sql. Safe to re-run.
--
--   1. referrals: one row per referral from the /refer form. Each gets a personal code, and the
--      friend books with $30 off at /referred/<code>. A code works for one booking only.
--   2. create_booking() learns `referral_code`. It locks the referral, refuses a code that doesn't
--      exist or was already used, and links the referral to the new booking, all in the same
--      transaction as the booking itself. Two bookings can't both use one code, and a booking that
--      fails (day full, slot taken) leaves the code unused.
--
-- Jimmy's side, in the Supabase table editor:
--   booking_ref  set when the friend books. Their cleaning still has to happen before the thank-you.
--   thanked_at   fill in when the thank-you has been paid ($25 cash, or the $50 plan credit set up).
--   To free a code whose booking was cancelled, clear booking_ref and booked_at.

create table if not exists public.referrals (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique check (code ~ '^[A-Z0-9]{8}$'),
  created_at     timestamptz not null default now(),
  referrer_name  text not null,
  referrer_phone text not null,
  referrer_email text not null default '',
  reward         text not null check (reward in ('cash', 'plan')),
  friend_name    text not null,
  friend_phone   text not null default '',
  friend_email   text not null default '',
  friend_town    text not null default '',
  notes          text not null default '',
  booking_ref    text unique references public.bookings (ref),
  booked_at      timestamptz,
  thanked_at     timestamptz
);

alter table public.referrals enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.referrals from anon, authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, insert, update on public.referrals to service_role';
  end if;
end $$;

create or replace function public.create_booking(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_row      public.bookings;
  v_key      text := nullif(p->>'idempotency_key', '');
  v_code     text := nullif(p->>'referral_code', '');
  v_referral public.referrals;
begin
  if v_key is not null then
    select * into v_row from public.bookings where idempotency_key = v_key;
    if found then
      return jsonb_build_object('ok', true, 'duplicate', true, 'booking', to_jsonb(v_row));
    end if;
  end if;

  -- A referral booking: the code must exist and be unused. The row lock makes a second booking
  -- with the same code wait here, then see it as used.
  if v_code is not null then
    select * into v_referral from public.referrals where code = v_code for update;
    if not found then
      return jsonb_build_object('ok', false, 'reason', 'referral_invalid');
    end if;
    if v_referral.booking_ref is not null then
      return jsonb_build_object('ok', false, 'reason', 'referral_used');
    end if;
  end if;

  if (p->>'max_jobs_per_day') is not null then
    perform set_config('kgg.max_jobs_per_day', (p->>'max_jobs_per_day')::integer::text, true);
  end if;

  insert into public.bookings (
    ref, service_date, slot_id, package_id, rinse, price_dollars, price_is_estimate,
    customer_name, customer_email, customer_phone, street, city, zip, notes, idempotency_key
  ) values (
    p->>'ref', (p->>'service_date')::date, p->>'slot_id', p->>'package_id',
    coalesce((p->>'rinse')::boolean, false), (p->>'price_dollars')::integer,
    coalesce((p->>'price_is_estimate')::boolean, false),
    p->>'customer_name', p->>'customer_email', p->>'customer_phone',
    p->>'street', p->>'city', p->>'zip', coalesce(p->>'notes', ''), v_key
  )
  returning * into v_row;

  if v_code is not null then
    update public.referrals set booking_ref = v_row.ref, booked_at = now() where code = v_code;
  end if;

  return jsonb_build_object('ok', true, 'booking', to_jsonb(v_row));
exception
  when unique_violation then
    -- Two copies of the same request can race past the check above.
    if v_key is not null then
      select * into v_row from public.bookings where idempotency_key = v_key;
      if found then
        return jsonb_build_object('ok', true, 'duplicate', true, 'booking', to_jsonb(v_row));
      end if;
    end if;
    if sqlerrm like '%bookings_one_per_slot%' then
      return jsonb_build_object('ok', false, 'reason', 'slot_taken');
    end if;
    raise;
  when raise_exception then
    if sqlerrm = 'day_full' then
      return jsonb_build_object('ok', false, 'reason', 'day_full');
    end if;
    raise;
end $$;

revoke execute on function public.create_booking(jsonb) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function public.create_booking(jsonb) from anon, authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.create_booking(jsonb) to service_role';
  end if;
end $$;
