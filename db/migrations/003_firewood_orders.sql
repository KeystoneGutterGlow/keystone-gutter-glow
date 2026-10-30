-- Keystone Gutter Glow: firewood orders. Run after 002_booking_hardening.sql. Safe to re-run.
--
-- An order is written as 'pending' before the customer goes to Stripe. Only the verified
-- webhook moves it to 'paid'. The app makes each move with a conditional update, so a repeated
-- Stripe event finds nothing left to change and can't process an order or email anyone twice.
-- No card details are ever stored here: Stripe hosts the payment page.

create table if not exists public.firewood_orders (
  id                    uuid primary key default gen_random_uuid(),
  ref                   text not null unique,
  status                text not null default 'pending'
                        check (status in ('pending', 'paid', 'payment_failed', 'expired', 'needs_review')),
  idempotency_key       text not null unique,
  product_id            text not null,
  delivery_method       text not null,
  carry_steps           boolean not null default false,
  rough_terrain         boolean not null default false,
  delivery_date         date not null,
  street                text not null,
  city                  text not null,
  zip                   text not null,
  customer_name         text not null,
  customer_email        text not null,
  customer_phone        text not null,
  instructions          text not null default '',
  lines                 jsonb not null,
  total_cents           integer not null check (total_cents > 0),
  currency              text not null default 'usd',
  test_mode             boolean not null,
  stripe_session_id     text unique,
  stripe_checkout_url   text,
  stripe_payment_intent text,
  created_at            timestamptz not null default now(),
  paid_at               timestamptz,
  notified_at           timestamptz
);

create index if not exists firewood_orders_by_delivery on public.firewood_orders (delivery_date) where status = 'paid';

alter table public.firewood_orders enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.firewood_orders from anon, authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, insert, update on public.firewood_orders to service_role';
  end if;
end $$;
