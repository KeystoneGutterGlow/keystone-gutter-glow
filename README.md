# Keystone Gutter Glow: website

The website for keystonegutterglow.com: a scrolling gutter-cleaning site with online booking, and a seasonal firewood site with Stripe checkout. Only the gutter site shows on production until someone turns firewood on.

- Next.js 16 (App Router) + TypeScript. Plain CSS Modules, no UI library, no Tailwind.
- Postgres through Supabase for bookings and orders. Stripe's hosted page for payments.
- The visual system and the reasoning behind it are in [DESIGN.md](DESIGN.md).

## Local setup

Needs Node 20.9 or newer.

```bash
npm install
npm run dev            # http://localhost:3000
```

Nothing else is required. In development, bookings and orders go to an in-memory demo store seeded with sample bookings, and `/firewood` is visible. Copy `.env.example` to `.env.local` to change any of that.

## Tests

```bash
npm test               # everything below, no server or credentials needed
npm run typecheck
npm run build
```

- `tests/booking-rules.test.ts`: dates, availability, validation
- `tests/booking-api.test.ts`: the real API routes: simultaneous requests, the daily cap, retries, production safety
- `tests/sql.test.ts`: every migration on PGlite (real Postgres in WASM), plus the Supabase adapters run against those tables
- `tests/firewood.test.ts`: prices, order validation, the payment gate, the seasonal switch
- `tests/stripe.test.ts`: checkout, webhook signatures, duplicate events. Signature checks use Stripe's real code. Session creation is a stand-in, so no network or key is needed.

`npm run test:booking` runs another 15 checks over HTTP against a running dev server (`BASE=http://localhost:3000 npm run test:booking`).

**Not covered by these tests:** a live Supabase project, a real Stripe test payment, and the per-day lock under two real database connections (PGlite has only one). The launch checklist below includes all three.

## Environment variables

All are documented in [.env.example](.env.example). All are server-side. Static pages read them at build time, so redeploy after changing one on Vercel.

| Variable | What it does | Default |
|---|---|---|
| `BOOKING_STORE` | `supabase` for real data. Anything else is the demo store. | demo store |
| `BOOKING_DEMO_MODE` | `true` lets a production build use the demo store. For the mockup only. | off |
| `BOOKING_DEMO_SEED` | `off` starts the demo store empty. | seeded |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Database connection. Never prefix with `NEXT_PUBLIC_`. | none |
| `SITE_MODE` | `gutter` or `firewood`. What `/` shows. | `gutter` |
| `FIREWOOD_PREVIEW` | `true` shows `/firewood` and the mode switch without changing `/`. | off |
| `STRIPE_SECRET_KEY` | Stripe key. Test key until launch. | checkout off |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhooks. Checkout stays closed without it. | checkout off |
| `STRIPE_ALLOW_LIVE_PAYMENTS` | One of four requirements for real payments. Leave unset. | off |
| `RESEND_API_KEY`, `EMAIL_FROM` | Turn on booking and order emails. | no email |
| `NOTIFY_OWNER_EMAIL` | Where owner notices go. | `content/site.ts` email |
| `SITE_URL` | Public URL for links and Stripe's return page. | Vercel domain |
| `ALLOW_INDEXING` | `true` lets search engines in. Real domain only. | noindex |

## Deploying

The site is set up for Vercel: import the repo, no build settings needed (`vercel.json` pins the Next.js preset). Every push to `main` deploys to production. Other branches get a preview URL.

- **Set `BOOKING_DEMO_MODE=true` on the mockup project before merging this branch.** Production builds no longer fall back to demo data on their own. Without Supabase or that variable, the booking section shows a call-us message and takes no bookings. That's deliberate: a real customer's booking should never land in memory and vanish.
- **Indexing is off by default.** Every page is `noindex`, responses carry `X-Robots-Tag`, and `robots.txt` disallows everything, so previews can't compete with the live site in Google. When the real domain points here, set `ALLOW_INDEXING=true` and redeploy.
- **Links follow the deployment.** Canonical, Open Graph and schema URLs use Vercel's production domain, which becomes keystonegutterglow.com once that domain is attached. `SITE_URL` forces a value.

## Where to edit business content

All business content lives in `content/`. The pages, the APIs and the SEO markup all read from it.

| File | What's in it |
|---|---|
| `content/site.ts` | Name, phone, email, policies (reschedule window, return visit, late-cancel fee) |
| `content/pricing.ts` | House types, prices, rinse add-on. **The server computes totals from this.** |
| `content/booking.ts` | Scheduling mode, daily cap, start times, closed weekdays, blackout dates, lead time, horizon |
| `content/firewood.ts` | Firewood sizes, prices, charges, delivery rules, policies, each with a confirmation status |
| `content/season.ts` | The gutter/firewood switch |
| `content/services.ts` | The four parts of a cleaning (matched to the drawing callouts) |
| `content/faqs.ts` | FAQ. Also generates the FAQPage schema. |
| `content/area.ts` | Towns, ZIPs (for the "do we come to you?" check), map coordinates |
| `content/owner.ts` | Jimmy's section. Every field is a `draft: true` placeholder until his bio arrives. |
| `content/referral.ts` | `/referred` page. All placeholders, plus `live` and `indexable` switches. |
| `content/nav.ts` | The sections in each left rail |

Commit the change and push. Vercel redeploys on its own.

## Seasonal mode

One variable decides which business the site shows:

| `SITE_MODE` | `/` | Other pages |
|---|---|---|
| `gutter` (default) | Gutter site | `/firewood` is a 404 on production. It's visible in dev and on Vercel previews, or anywhere with `FIREWOOD_PREVIEW=true`. |
| `firewood` | Firewood site | Gutter site at `/gutters`, with the booking flow intact. The mode switch is shown. |

To change season: set `SITE_MODE` in Vercel and redeploy. Nothing changes on its own, and no date triggers it.

## Booking

```
BookingApp (client)  ->  /api/availability  (GET: month summary, one day's times, next opening)
                     ->  /api/bookings      (POST: validate, re-check, create)
                              |
                       lib/booking/service.ts     rules in availability.ts (pure functions)
                              |
                       lib/booking/store/          BookingStore interface
                         memory.ts   (demo and development only)
                         supabase.ts (Postgres via PostgREST; no client library)
```

The flow: the customer picks a date, the browser fetches that day's times, and booked times show disabled. On submit, the server validates everything again, re-checks the date, computes the price itself, and asks the store to create the booking atomically. If someone took the slot in the meantime, the API returns `409` with fresh availability, and the UI sends the customer back to the calendar with the slot marked booked.

**Double booking is blocked in storage, not in the UI.**
- A partial unique index on `(service_date, slot_id)` allows one confirmed booking per time.
- A trigger takes a per-day advisory lock and refuses a booking over the cap, even for a raw `INSERT`.
- A unique idempotency key means a double tap or dropped connection returns the original booking instead of a second one, or a false "slot taken".
- `create_booking()` returns `{ ok, reason }`. Row-level security is on, and the anon role has no access.

### Scheduling rules

The site ships with five start times and a cap of four jobs a day, as it has run so far. The agreement's Addendum A1 asks for three jobs a day with no customer-facing times. That's built and tested but switched off until Jimmy confirms. To turn it on, change two lines in `content/booking.ts`:

```ts
scheduleMode: "day-only" as ScheduleMode,
maxJobsPerDay: 3,
```

The form then asks for a day only, explains that a precise arrival time isn't normally given, and the server files each job under a free internal slot. No database change is needed: the app sends its cap with each booking, and the database enforces the lower of that and `booking_settings.max_jobs_per_day`. To go above four, raise that database value too.

## Database setup

Run these in the Supabase SQL editor, in order. Each is safe to re-run.

1. `db/migrations/001_bookings.sql`: bookings, the cap trigger, `create_booking()`
2. `db/migrations/002_booking_hardening.sql`: idempotency, the app-supplied cap, grants
3. `db/migrations/003_firewood_orders.sql`: firewood orders

Then set `BOOKING_STORE=supabase`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the server and redeploy. The service-role key bypasses row-level security, so it must stay server-side. To cancel a booking, set its `status` to `cancelled` in the Supabase table editor. That frees the slot.

## Firewood and Stripe

```
OrderForm  ->  /api/firewood/status    (is payment open? test mode?)
           ->  /api/firewood/checkout  validate, price, save as pending, create Checkout Session
                    |
             Stripe's hosted page (card details never touch this site)
                    |
    /api/stripe/webhook   verified signature -> order moves to paid -> emails, once
    /firewood/order       shows the order's real status
```

- **Prices come from the server.** It ignores any amount the browser sends and calculates the total from `content/firewood.ts`. If the page is stale, the customer sees the new total before paying.
- **Stripe can't take negative lines,** so the $30 dumping reduction is folded into the size's line on Stripe's page. The customer's own summary keeps it itemized, and the totals match.
- **Duplicates are harmless.** The same click maps to the same order and session. A repeated webhook finds nothing to change and sends no second email.
- **A mismatch stops for review.** If Stripe's amount differs from the order's, the order goes to `needs_review` and the owner email says so.
- **No tax, fees or refund rules are invented.** None are added until Jimmy decides.

### Unconfirmed values

Each group in `content/firewood.ts` has a status: `placeholder`, `contract` (from the agreement, not yet confirmed) or `confirmed`. While any group isn't `confirmed`, the page shows a "not taking real orders" panel and live payments are refused. To confirm one, correct the value and change its status.

### Setting up Stripe in test mode

1. Jimmy creates the Stripe account. It has to be his, because he's the merchant of record.
2. From the dashboard, in test mode, copy the secret key into `STRIPE_SECRET_KEY`.
3. Locally, install the Stripe CLI and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Put the `whsec_...` it prints in `STRIPE_WEBHOOK_SECRET` and restart the dev server.
4. Order at `/firewood` with card `4242 4242 4242 4242`, any future date, any CVC. The order page should say the payment was received.
5. For a Vercel preview, add a test-mode webhook endpoint in the dashboard at `https://<preview-url>/api/stripe/webhook`. Subscribe it to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired`. Put its signing secret in the preview's environment.

### What must be true for real payments

All four, checked in `lib/firewood/gate.ts`:

1. A live key in `STRIPE_SECRET_KEY`
2. `STRIPE_ALLOW_LIVE_PAYMENTS=true`
3. Every group in `content/firewood.ts` marked `confirmed`
4. `BOOKING_STORE=supabase`

A test key is refused on the real domain (`ALLOW_INDEXING=true`), so no customer can mistake it for a real order.

## Email

Booking and order emails go through Resend's HTTP API (`lib/notify/email.ts`). It's optional and off by default. Without `RESEND_API_KEY` and `EMAIL_FROM`, nothing is sent and the booking confirmation doesn't promise an email. Resend has a free tier, but any recurring cost needs Jimmy's approval. Its sending domain must be verified first. Swapping providers means changing that one file.

## SEO

- One H1, H2 per section, and a `HomeAndConstructionBusiness` + `Service` (with real prices) + `FAQPage` + `WebSite` JSON-LD graph built from `content/`.
- Canonical URLs, Open Graph and Twitter cards, and a generated share image at `/opengraph-image`.
- `robots.txt` and `sitemap.xml` are generated. `/referred` is `noindex` and left out of the sitemap until `referral.indexable` is true.
- No street address is published (service-area business). Add one under `address` in `lib/schema.ts` if Keystone has a public one.

## Production launch checklist

**Accounts (Jimmy's)**
- [ ] Vercel project transferred, with billing on his side
- [ ] Supabase project created
- [ ] Stripe account created and verified, with his bank details
- [ ] Domain pointed at Vercel
- [ ] Email provider set up, if wanted, with the sending domain verified

**Database**
- [ ] All three migrations run
- [ ] A test booking appears in the `bookings` table
- [ ] Two people booking the last spot at once on the deployed site gives one booking and one "just taken" message (`BASE=<url> npm run test:booking` does this, but it writes bookings, so delete them afterward)

**Gutter site**
- [ ] Items under "Things to confirm" below answered
- [ ] Scheduling rules decided, and `content/booking.ts` updated
- [ ] Terms, privacy and cancellation pages added, with Jimmy's approval
- [ ] `ALLOW_INDEXING=true` and `SITE_URL` set on the real domain, and `BOOKING_DEMO_MODE` removed

**Firewood, before the season**
- [ ] Every group in `content/firewood.ts` answered and marked `confirmed`
- [ ] A full test-mode order on a preview: pay, webhook, order page, both emails
- [ ] Canceled checkout and an expired session both tested
- [ ] Live webhook endpoint added, and the live signing secret set
- [ ] Live key and `STRIPE_ALLOW_LIVE_PAYMENTS=true` set
- [ ] One real low-value order placed and refunded
- [ ] `SITE_MODE=firewood` set, and the site redeployed

## Things to confirm with Jimmy

Everything factual came from the current site or the agreement. These items were either unclear or assumed:

- **Closed Sundays.** That's an assumption. The current site lets people book any day (`closedWeekdays` in `content/booking.ts`).
- **Start times.** 8, 10, 12, 2 and 4 are a proposal, and go away with day-only scheduling.
- **Late-cancel fee.** Addendum A1 says $50 inside 24 hours. It isn't shown until `lateCancelFeeDollars` is set in `content/site.ts`.
- **"Ground-based" / ladder-free.** This is in the old site's schema markup, but its 2-story description also says "insured for elevated work". The copy says the pole reaches 32 ft and doesn't promise "no ladders".
- **"Insured".** This is on the old site's trust bar and shown in the footer. Confirm it, and add a policy or registration number if he has one.
- **Newtown and Yardley.** These were only in the old site's hidden schema, not its visible town list.
- **"Houses and townhomes only."** This is inferred from the site saying "residential" everywhere.
- **Photos.** The rig photo is a stand-in from the current site that looks like a UK manufacturer shot, so swap it for Jimmy's own setup. The before/after pair is from the current site's gallery. Placeholders say exactly what to shoot.
- **Removed from the old site** because nothing backs them up: the "5.0" rating (the reviews list was empty), "100% debris captured", and "2× more thorough".

## Agreement, Addendum A status

| Requirement | Status |
|---|---|
| A1 No italics, polished buttons and layout | Done |
| A1 Referral page easier to reach | Link added to the desktop rail. The page's content is still placeholders. |
| A1 Alt text and accessible controls | Automated accessibility checks are clean. Client photos are still to come. |
| A1 Three jobs a day, no time slots, arrival explanation | Built, switched off until confirmed |
| A1 Vacuum visual resembling GutterPro-style equipment | Not started |
| A1 10-mile radius shown from the private address | Not started. Needs the address. |
| A1 Biography with age, school and quotation | Placeholders. Needs Jimmy's text. |
| A1 Recurring-plan request form | Not started. Needs email set up. |
| A1 Terms, privacy and cancellation policy pages | Not started. Needs approved text. |
| A2 Separate winter mode with switch, colors and igniting log visual | Done |
| A2 Prices, options and itemized total | Done, from config, marked unconfirmed |
| A3 Hosted checkout and order confirmation | Built and tested without a live account |
| A3 Order notification to the owner | Built. Needs an email provider. |
