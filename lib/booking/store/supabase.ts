import type { PackageId } from "@/content/pricing";
import type { BookingRecord, BookingStore, CreateResult, ISODate, NewBooking, TakenSlot } from "../types";

/**
 * Supabase / Postgres store, talking to PostgREST over fetch (no client library needed).
 * Pair it with db/migrations/. The database does the real enforcing:
 *   - a partial unique index allows one confirmed booking per (service_date, slot_id)
 *   - a trigger takes a per-day advisory lock and refuses a booking over the daily cap
 *   - a unique idempotency key makes retries return the original booking
 * so double booking is impossible even if two servers race, or someone inserts by hand.
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-side only, never NEXT_PUBLIC).
 * The tests run this adapter against the real migrations on PGlite, through a small
 * PostgREST stand-in. Its SQL side has been checked on the live project (2026-11-05); its HTTPS calls first run on the launch deploy.
 */

const TIMEOUT_MS = 8000;

interface Row {
  id: string;
  ref: string;
  service_date: string;
  slot_id: string;
  package_id: string;
  rinse: boolean;
  price_dollars: number;
  price_is_estimate: boolean;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  street: string;
  city: string;
  zip: string;
  notes: string;
  status: "confirmed" | "cancelled";
  created_at: string;
}

function toRow(b: NewBooking) {
  return {
    ref: b.ref,
    service_date: b.date,
    slot_id: b.slotId,
    package_id: b.packageId,
    rinse: b.rinse,
    price_dollars: b.priceDollars,
    price_is_estimate: b.priceIsEstimate,
    customer_name: b.customer.name,
    customer_email: b.customer.email,
    customer_phone: b.customer.phone,
    street: b.address.street,
    city: b.address.city,
    zip: b.address.zip,
    notes: b.notes,
    idempotency_key: b.idempotencyKey ?? null,
  };
}

function fromRow(r: Row): BookingRecord {
  return {
    id: r.id,
    ref: r.ref,
    date: r.service_date,
    slotId: r.slot_id,
    packageId: r.package_id as PackageId,
    rinse: r.rinse,
    priceDollars: r.price_dollars,
    priceIsEstimate: r.price_is_estimate,
    customer: { name: r.customer_name, email: r.customer_email, phone: r.customer_phone },
    address: { street: r.street, city: r.city, zip: r.zip },
    notes: r.notes,
    status: r.status,
    createdAt: r.created_at,
  };
}

export class SupabaseBookingStore implements BookingStore {
  constructor(
    private readonly url: string,
    private readonly serviceKey: string,
  ) {}

  private headers(): HeadersInit {
    return {
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      "Content-Type": "application/json",
    };
  }

  async listTaken(from: ISODate, to: ISODate): Promise<TakenSlot[]> {
    const q = new URLSearchParams({ select: "service_date,slot_id", status: "eq.confirmed" });
    q.append("service_date", `gte.${from}`);
    q.append("service_date", `lte.${to}`);
    const res = await fetch(`${this.url}/rest/v1/bookings?${q}`, {
      headers: this.headers(),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Supabase listTaken failed (${res.status})`);
    const rows = (await res.json()) as Array<Pick<Row, "service_date" | "slot_id">>;
    return rows.map((r) => ({ date: r.service_date, slotId: r.slot_id }));
  }

  // The database applies the lower of `maxPerDay` and booking_settings.max_jobs_per_day.
  async create(input: NewBooking, maxPerDay: number): Promise<CreateResult> {
    const res = await fetch(`${this.url}/rest/v1/rpc/create_booking`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ p: { ...toRow(input), max_jobs_per_day: maxPerDay } }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Supabase create_booking failed (${res.status})`);
    const out = (await res.json()) as { ok: boolean; reason?: string; booking?: Row; duplicate?: boolean };
    if (out.ok && out.booking) return { ok: true, booking: fromRow(out.booking), duplicate: out.duplicate };
    return { ok: false, reason: out.reason === "day_full" ? "day_full" : "slot_taken" };
  }
}
