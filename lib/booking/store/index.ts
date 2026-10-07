import { bookingRules } from "@/content/booking";
import { todayIn } from "../dates";
import type { BookingStore } from "../types";
import { demoSeed } from "./demo-seed";
import { MemoryBookingStore } from "./memory";
import { SupabaseBookingStore } from "./supabase";

// Pick the storage backend from the environment.
//   BOOKING_STORE=memory   (default) in-process mock, seeded with demo bookings
//   BOOKING_STORE=supabase  Postgres via Supabase; set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//   BOOKING_DEMO_SEED=off   start the memory store empty

const globalForStore = globalThis as unknown as { __kggBookingStore?: BookingStore };

export function getBookingStore(): BookingStore {
  if (globalForStore.__kggBookingStore) return globalForStore.__kggBookingStore;

  let store: BookingStore;
  if (process.env.BOOKING_STORE === "supabase") {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("BOOKING_STORE=supabase needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    store = new SupabaseBookingStore(url.replace(/\/$/, ""), key);
  } else {
    const seed = process.env.BOOKING_DEMO_SEED === "off" ? [] : demoSeed(todayIn(bookingRules.timeZone), bookingRules);
    store = new MemoryBookingStore(seed);
  }

  globalForStore.__kggBookingStore = store;
  return store;
}
