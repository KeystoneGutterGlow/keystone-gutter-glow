import { bookingRules } from "@/content/booking";
import { resolveStorage, StorageUnavailableError } from "@/lib/storage";
import { todayIn } from "../dates";
import type { BookingStore } from "../types";
import { demoSeed } from "./demo-seed";
import { MemoryBookingStore } from "./memory";
import { SupabaseBookingStore } from "./supabase";

// Pick the storage backend from the environment (rules in lib/storage.ts).
//   BOOKING_DEMO_SEED=off   start the memory store empty

const globalForStore = globalThis as unknown as { __kggBookingStore?: BookingStore };

export function getBookingStore(): BookingStore {
  if (globalForStore.__kggBookingStore) return globalForStore.__kggBookingStore;

  const mode = resolveStorage();
  if (mode.kind === "unavailable") throw new StorageUnavailableError(mode.reason);

  let store: BookingStore;
  if (mode.kind === "supabase") {
    store = new SupabaseBookingStore(mode.url, mode.serviceKey);
  } else {
    const seed = process.env.BOOKING_DEMO_SEED === "off" ? [] : demoSeed(todayIn(bookingRules.timeZone), bookingRules);
    store = new MemoryBookingStore(seed);
  }

  globalForStore.__kggBookingStore = store;
  return store;
}

/** Tests only: forget the cached store so the next call re-reads the environment. */
export function resetBookingStore() {
  delete globalForStore.__kggBookingStore;
}
