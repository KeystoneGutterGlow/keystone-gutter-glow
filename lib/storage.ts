// Decides where bookings and firewood orders are stored. Fails closed: a production server
// that isn't explicitly configured refuses to take bookings rather than quietly writing them
// to memory, where they would disappear on the next restart.
//
//   BOOKING_STORE=supabase     Postgres. Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
//   BOOKING_STORE=memory       In-process demo data. Allowed in `next dev`. A production build
//   (or unset)                 also needs BOOKING_DEMO_MODE=true, and it's never allowed on the
//                              indexable real domain (ALLOW_INDEXING=true).

export type StorageMode =
  | { kind: "supabase"; url: string; serviceKey: string }
  | { kind: "memory" }
  | { kind: "unavailable"; reason: string };

type Env = Record<string, string | undefined>;

export function resolveStorage(env: Env = process.env): StorageMode {
  if (env.BOOKING_STORE === "supabase") {
    const url = env.SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return { kind: "unavailable", reason: "BOOKING_STORE=supabase needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" };
    }
    return { kind: "supabase", url: url.replace(/\/$/, ""), serviceKey };
  }

  if (env.ALLOW_INDEXING === "true") {
    return { kind: "unavailable", reason: "The real domain (ALLOW_INDEXING=true) can't use the demo store. Set BOOKING_STORE=supabase." };
  }
  if (env.NODE_ENV !== "production" || env.BOOKING_DEMO_MODE === "true") return { kind: "memory" };
  return { kind: "unavailable", reason: "Production needs BOOKING_STORE=supabase, or BOOKING_DEMO_MODE=true on a demo deployment" };
}

export function isDemoStorage(env: Env = process.env): boolean {
  return resolveStorage(env).kind === "memory";
}

/** The server can't reach storage or isn't configured for it. API routes answer 503. */
export class StorageUnavailableError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "StorageUnavailableError";
  }
}
