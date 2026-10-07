import type { BookingRules } from "@/content/booking";
import { checkDate } from "../availability";
import { addDays } from "../dates";
import type { BookingRecord, ISODate } from "../types";

// FAKE bookings so the mockup calendar shows taken times and full days.
// Only the in-memory store uses this, and only when BOOKING_DEMO_SEED isn't "off".
// Nothing else in the app knows these exist.

// [index of the bookable day, slot ids taken]
const PATTERN: Array<[number, string[]]> = [
  [0, ["08:00", "12:00"]],
  [2, ["08:00", "10:00", "14:00"]],
  [3, ["08:00", "10:00", "12:00", "16:00"]], // full: hits the 4-a-day cap with one time still unbooked
  [4, ["10:00"]],
  [6, ["08:00", "10:00", "12:00", "14:00"]], // full
  [7, ["12:00", "16:00"]],
  [9, ["08:00"]],
  [11, ["10:00", "14:00", "16:00"]],
];

export function demoSeed(today: ISODate, rules: BookingRules): BookingRecord[] {
  const bookable: ISODate[] = [];
  for (let i = rules.minLeadDays; bookable.length < 14 && i <= rules.horizonDays; i++) {
    const d = addDays(today, i);
    if (checkDate(d, today, rules).ok) bookable.push(d);
  }

  const rows: BookingRecord[] = [];
  for (const [index, slotIds] of PATTERN) {
    const date = bookable[index];
    if (!date) continue;
    for (const slotId of slotIds) {
      rows.push({
        id: `demo-${date}-${slotId}`,
        ref: "KGG-DEMO",
        date,
        slotId,
        packageId: "two-story",
        rinse: false,
        priceDollars: 229,
        priceIsEstimate: false,
        customer: { name: "Demo booking", email: "demo@example.com", phone: "0000000000" },
        address: { street: "Demo", city: "Jamison", zip: "18929" },
        notes: "",
        status: "confirmed",
        createdAt: new Date(0).toISOString(),
      });
    }
  }
  return rows;
}
