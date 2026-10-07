# Keystone Gutter Glow: website

Redesign mockup for keystonegutterglow.com. It's a single scrolling page plus `/referred`, with a real booking flow behind it.

- Next.js 16 (App Router) + TypeScript. Plain CSS Modules, no UI library, no Tailwind.
- The visual system and the reasoning behind it are in [DESIGN.md](DESIGN.md).

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && npm start
```

## Where to edit things

All business content lives in `content/`. The page, the booking API and the SEO markup all read from it.

| File | What's in it |
|---|---|
| `content/site.ts` | Name, phone, email, policies (24h reschedule, 48h return visit, pay-after) |
| `content/pricing.ts` | House types, prices, rinse add-on. **The server computes totals from this.** |
| `content/booking.ts` | Start times, the 4-a-day cap, closed weekdays, blackout dates, lead time, horizon |
| `content/services.ts` | The four parts of a cleaning (matched to the drawing callouts) |
| `content/faqs.ts` | FAQ. Also generates the FAQPage schema. |
| `content/area.ts` | Towns, ZIPs (for the "do we come to you?" check), map coordinates |
| `content/owner.ts` | Jimmy's section. Every field is a `draft: true` placeholder until his bio arrives. |
| `content/referral.ts` | `/referred` page. All placeholders, plus `live` and `indexable` switches. |

## Booking architecture

```
BookingApp (client)  ->  /api/availability  (GET: month summary, one day's times, next opening)
                     ->  /api/bookings      (POST: validate, re-check, create)
                              |
                       lib/booking/service.ts     rules in availability.ts (pure functions)
                              |
                       lib/booking/store/          BookingStore interface
                         memory.ts   (default: in-process mock, seeded with demo bookings)
                         supabase.ts (Postgres via PostgREST; no client library)
```

The flow: the customer picks a date, the browser fetches that day's times, and booked times show disabled. On submit, the server validates everything again, re-checks the date, computes the price itself, and asks the store to create the booking atomically. If someone took the slot in the meantime, the API returns `409` with fresh availability. The UI sends the customer back to Day & time with a message and the slot marked booked.

**Double booking is blocked in storage, not in the UI.**
- Memory store: every create runs through one queue, so the check and the insert happen as one step.
- Postgres (`db/migrations/001_bookings.sql`):
  - A partial unique index on `(service_date, slot_id)` allows one confirmed booking per time.
  - A trigger takes a per-day advisory lock and refuses a fifth confirmed booking on a date, even for a raw `INSERT`.
  - `create_booking()` returns `{ ok, reason }`.
  - Row-level security is on, and the anon role has no access.

The rules are two separate checks. There are five start times but a cap of four jobs a day, so a day closes after any four bookings, whichever times they take.

### Going live with Supabase

1. Run `db/migrations/001_bookings.sql` in the Supabase SQL editor.
2. Set `BOOKING_STORE=supabase`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the server. Never use a `NEXT_PUBLIC_` variable for the key.
3. Keep `booking_settings.max_jobs_per_day` and `content/booking.ts` in step.
4. Add the confirmation email where `service.ts` has `TODO(production)`, for example with Resend or Postmark.

The memory store resets on restart and isn't shared between server instances, so it's for the mockup only. `BOOKING_DEMO_SEED=off` starts it empty.

## Tests

```bash
npm run test:sql       # runs the migration on PGlite (real Postgres in WASM) and checks the constraints
npm run dev            # then, in another terminal:
npm run test:booking   # 15 API checks incl. 10 simultaneous requests for one slot -> exactly 1 booked
```

## Deploying

The site is set up for Vercel: import the repo, no build settings needed. Environment variables are documented in `.env.example`.

- **Indexing is off by default.** Every page is `noindex` and `robots.txt` disallows everything, so the `.vercel.app` mockup can't compete with the live keystonegutterglow.com in Google. When the real domain points here, set `ALLOW_INDEXING=true` and redeploy.
- **Links follow the deployment.** Canonical, Open Graph and schema URLs use Vercel's production domain automatically, which becomes keystonegutterglow.com once that domain is attached. Use `SITE_URL` to force a value.
- **On Vercel the memory booking store is per serverless instance.** Demo bookings can differ between requests and reset on cold starts. That's fine for showing the flow; real bookings need `BOOKING_STORE=supabase`.

## SEO

- One H1, H2 per section, and an `HomeAndConstructionBusiness` + `Service` (with real prices) + `FAQPage` + `WebSite` JSON-LD graph built from `content/`.
- Canonical URLs, Open Graph and Twitter cards, and a generated share image at `/opengraph-image`.
- `robots.txt` and `sitemap.xml` are generated. `/referred` is `noindex` and left out of the sitemap until `referral.indexable` is true.
- No street address is published (service-area business). Add one under `address` in `lib/schema.ts` if Keystone has a public one.

## Before launch: things to confirm with Jimmy

Everything factual came from the current site. These items were either unclear or assumed:

- **Closed Sundays.** That's an assumption. The current site lets people book any day (`closedWeekdays` in `content/booking.ts`).
- **Start times.** 8, 10, 12, 2 and 4 are a proposal.
- **"Ground-based" / ladder-free.** This is in the old site's schema markup, but its 2-story description also says "insured for elevated work". The copy says the pole reaches 32 ft and doesn't promise "no ladders".
- **"Insured".** This is on the old site's trust bar and shown in the footer. Confirm it, and add a policy or registration number if he has one.
- **Newtown and Yardley.** These were only in the old site's hidden schema, not its visible town list.
- **"Houses and townhomes only."** This is inferred from the site saying "residential" everywhere.
- **Photos.**
  - The rig photo is a stand-in from the current site. It looks like a UK manufacturer shot (brick semi, hi-vis, TV aerial), so swap it for Jimmy's own setup.
  - The before/after pair is from the current site's gallery.
  - Placeholders say exactly what to shoot.
- **Removed from the old site** because nothing backs them up: the "5.0" rating (the reviews list was empty), "100% debris captured", and "2× more thorough".
- **Old site pages not rebuilt here:** privacy, terms, cookie policy and cancellation policy. Their content should move over before launch.
