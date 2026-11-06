-- Keystone Gutter Glow: booking hardening. Run after 001_bookings.sql. Safe to re-run.
--
--   1. Idempotency: a retried request (double tap, dropped connection) gets the booking it
--      already made, instead of a false "slot taken" or a second booking.
--   2. The app sends its configured daily cap with each booking. The trigger enforces the
--      lower of that and booking_settings, so lowering the cap in content/booking.ts takes
--      effect without a database change, even for two simultaneous requests.
--   3. Tighter function settings and an explicit grant for the service role.

alter table public.bookings add column if not exists idempotency_key text;

create unique index if not exists bookings_idempotency_key
  on public.bookings (idempotency_key)
  where idempotency_key is not null;

create or replace function public.enforce_daily_cap() returns trigger
language plpgsql set search_path = public as $$
declare
  v_cap     integer;
  v_app_cap integer;
  v_count   integer;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  -- One lock per calendar day; released automatically at commit/rollback.
  perform pg_advisory_xact_lock(hashtext('kgg_booking_day'), new.service_date - date '2000-01-01');

  select max_jobs_per_day into v_cap from public.booking_settings where id;
  v_cap := coalesce(v_cap, 4);

  -- Set by create_booking() for this transaction only. Empty for a raw INSERT.
  v_app_cap := nullif(current_setting('kgg.max_jobs_per_day', true), '')::integer;
  if v_app_cap is not null and v_app_cap < v_cap then
    v_cap := v_app_cap;
  end if;

  select count(*) into v_count
    from public.bookings
   where service_date = new.service_date
     and status = 'confirmed'
     and id <> new.id;

  if v_count >= v_cap then
    raise exception 'day_full' using errcode = 'P0001', hint = 'kgg_day_full';
  end if;
  return new;
end $$;

create or replace function public.create_booking(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_row public.bookings;
  v_key text := nullif(p->>'idempotency_key', '');
begin
  if v_key is not null then
    select * into v_row from public.bookings where idempotency_key = v_key;
    if found then
      return jsonb_build_object('ok', true, 'duplicate', true, 'booking', to_jsonb(v_row));
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
