// End-to-end checks for the booking API against a running server.
//   npm run dev   (or BOOKING_DEMO_MODE=true npm start)   then:   npm run test:booking
// Uses the in-memory store, so it writes test bookings that vanish on restart.
// Assumes the rules in content/booking.ts as they ship: time slots and four jobs a day.
// Set BASE to point somewhere else, e.g. BASE=http://localhost:3000.

const BASE = process.env.BASE ?? "http://localhost:3100";
let failures = 0;

function check(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
}

async function get(path) {
  const res = await fetch(BASE + path);
  return { status: res.status, body: await res.json() };
}

async function book(over = {}) {
  const res = await fetch(BASE + "/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      packageId: "one-story",
      rinse: false,
      name: "API Test",
      email: "api-test@example.com",
      phone: "2155550100",
      street: "1 Test Ln",
      city: "Jamison",
      zip: "18929",
      notes: "",
      ...over,
    }),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

// 1. Find a day with every start time open.
const { body: next } = await get("/api/availability?next=1");
const { today, horizonDays } = next.meta;
const to = new Date(Date.parse(today + "T00:00:00Z") + Math.min(horizonDays, 60) * 86400000).toISOString().slice(0, 10);
const { body: range } = await get(`/api/availability?from=${today}&to=${to}`);
let day = null;
for (const d of range.days.filter((d) => d.status === "open")) {
  const { body } = await get(`/api/availability?date=${d.date}`);
  if (body.day.slots.every((s) => s.state === "open")) {
    day = body.day;
    break;
  }
}
check("found an untouched day to test on", !!day, day?.date);
if (!day) process.exit(1);
const slots = day.slots.map((s) => s.id);

// 2. Ten people grab the same time at the same moment: exactly one wins.
const race = await Promise.all(Array.from({ length: 10 }, () => book({ date: day.date, slotId: slots[0] })));
const won = race.filter((r) => r.status === 201).length;
const lost = race.filter((r) => r.status === 409 && r.body.code === "slot_taken").length;
check("same slot, 10 concurrent requests -> 1 booked", won === 1, `201s: ${won}`);
check("the other 9 get 409 slot_taken", lost === 9, `409s: ${lost}`);

// 3. Everyone else takes the remaining times at once: the 4-a-day cap holds.
const rest = await Promise.all(slots.slice(1).map((slotId) => book({ date: day.date, slotId })));
const restWon = rest.filter((r) => r.status === 201).length;
const dayFull = rest.filter((r) => r.status === 409 && r.body.code === "day_full").length;
check(`${slots.length - 1} other times at once -> only 3 more fit`, restWon === 3, `201s: ${restWon}`);
check("the extra one gets 409 day_full", dayFull === slots.length - 1 - 3, `day_full: ${dayFull}`);

// 4. The day now reads as full everywhere.
const { body: after } = await get(`/api/availability?date=${day.date}`);
check("day status is full", after.day.status === "full" && after.day.remaining === 0, after.day.status);
check("no start time is still open", after.day.slots.every((s) => s.state !== "open"));
const conflict = rest.find((r) => r.status === 409);
check("409 response carries fresh slots for the UI", Array.isArray(conflict?.body.day?.slots));

// 5. Server-side rules the client can't bypass.
const sunday = range.days.find((d) => d.status === "closed")?.date;
if (sunday) {
  const r = await book({ date: sunday, slotId: slots[0] });
  check("closed day is refused", r.status === 422 && r.body.code === "date_unavailable", String(r.status));
}
const past = await book({ date: "2020-01-02", slotId: slots[0] });
check("past date is refused", past.status === 422, String(past.status));
const badSlot = await book({ date: next.next.date, slotId: "03:00" });
check("unknown start time is refused", badSlot.status === 400 && !!badSlot.body.errors?.slotId, String(badSlot.status));
const badInput = await book({ date: next.next.date, slotId: slots[1], email: "nope", zip: "12", phone: "12" });
check(
  "bad email, ZIP and phone are refused",
  badInput.status === 400 && ["email", "zip", "phone"].every((k) => badInput.body.errors?.[k]),
  JSON.stringify(Object.keys(badInput.body.errors ?? {})),
);
const badPkg = await book({ date: next.next.date, slotId: slots[1], packageId: "mansion" });
check("unknown package is refused", badPkg.status === 400 && !!badPkg.body.errors?.packageId);
const bot = await book({ date: next.next.date, slotId: slots[1], company: "Spam LLC" });
check("honeypot submission is swallowed, not booked", bot.status === 201 && bot.body.booking === null);

// 6. Price comes from the server, not the client.
const priced = race.find((r) => r.status === 201);
check("server computed the price", priced?.body.booking?.priceDollars === 169, String(priced?.body.booking?.priceDollars));

console.log(failures ? `\n${failures} check(s) failed` : "\nAll booking checks passed");
process.exit(failures ? 1 : 0);
