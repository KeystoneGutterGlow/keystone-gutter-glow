-- Keystone Gutter Glow: bookings schema for Postgres / Supabase.
--
-- Double booking is prevented by the database itself, not by the app:
--   1. bookings_one_per_slot: a partial unique index allowing one confirmed booking per (date, start time).
--   2. enforce_daily_cap trigger: takes a per-day advisory lock, counts the confirmed
--      bookings for that date, and refuses the insert once the cap (booking_settings) is hit.
--      The lock serializes writers for the same date, so two requests can't both read
--      "3 booked" and both insert.
--   3. create_booking(): the one function the app calls. It turns those two failures into
--      { ok: false, reason: 'slot_taken' | 'day_full' } instead of raw errors.

-- gen_random_uuid() is built into Postgres 13+ (and Supabase), so no extension is needed.

create table if not exists public.booking_settings (
  id boolean primary key default true check (id),   -- single-row table
  max_jobs_per_day integer not null default 4 check (max_jobs_per_day > 0)
);
insert into public.booking_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  ref               text not null unique,
  service_date      date not null,
  slot_id           text not null check (slot_id ~ '^\d{2}:\d{2}$'),
  package_id        text not null check (package_id in ('one-story', 'townhome', 'two-story', 'large')),
  rinse             boolean not null default false,
  price_dollars     integer not null check (price_dollars >= 0),
  price_is_estimate boolean not null default false,
  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text not null,
  street            text not null,
  city              text not null,
  zip               text not null,
  notes             text not null default '',
  status            text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at        timestamptz not null default now()
);

create unique index if not exists bookings_one_per_slot
  on public.bookings (service_date, slot_id)
  where status = 'confirmed';

create index if not exists bookings_by_date on public.bookings (service_date) where status = 'confirmed';

create or replace function public.enforce_daily_cap() returns trigger
language plpgsql as $$
declare
  v_cap   integer;
  v_count integer;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  -- One lock per calendar day; released automatically at commit/rollback.
  perform pg_advisory_xact_lock(hashtext('kgg_booking_day'), new.service_date - date '2000-01-01');

  select max_jobs_per_day into v_cap from public.booking_settings where id;
  select count(*) into v_count
    from public.bookings
   where service_date = new.service_date
     and status = 'confirmed'
     and id <> new.id;

  if v_count >= coalesce(v_cap, 4) then
    raise exception 'day_full' using errcode = 'P0001', hint = 'kgg_day_full';
  end if;
  return new;
end $$;

drop trigger if exists bookings_daily_cap on public.bookings;
create trigger bookings_daily_cap
  before insert or update of service_date, status on public.bookings
  for each row execute function public.enforce_daily_cap();

create or replace function public.create_booking(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_row public.bookings;
begin
  insert into public.bookings (
    ref, service_date, slot_id, package_id, rinse, price_dollars, price_is_estimate,
    customer_name, customer_email, customer_phone, street, city, zip, notes
  ) values (
    p->>'ref', (p->>'service_date')::date, p->>'slot_id', p->>'package_id',
    coalesce((p->>'rinse')::boolean, false), (p->>'price_dollars')::integer,
    coalesce((p->>'price_is_estimate')::boolean, false),
    p->>'customer_name', p->>'customer_email', p->>'customer_phone',
    p->>'street', p->>'city', p->>'zip', coalesce(p->>'notes', '')
  )
  returning * into v_row;

  return jsonb_build_object('ok', true, 'booking', to_jsonb(v_row));
exception
  when unique_violation then
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

-- Lock the table down: the site talks to it only through the service role on the server.
alter table public.bookings enable row level security;
alter table public.booking_settings enable row level security;
revoke execute on function public.create_booking(jsonb) from public;
do $$
begin
  -- Supabase's client-facing roles; skipped on plain Postgres where they don't exist.
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.bookings, public.booking_settings from anon, authenticated';
    execute 'revoke execute on function public.create_booking(jsonb) from anon, authenticated';
  end if;
end $$;
