// End-to-end checks for the booking API against a running server.
//   npm run dev   (or BOOKING_DEMO_MODE=true npm start)   then:   npm run test:booking
// Uses the in-memory store, so it writes test bookings that vanish on restart.
// Assumes day-only scheduling, as the rules in content/booking.ts ship. The cap comes from the API.
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

// 1. Find a day with every spot open.
const { body: next } = await get("/api/availability?next=1");
const { today, horizonDays, maxJobsPerDay: cap } = next.meta;
const to = new Date(Date.parse(today + "T00:00:00Z") + Math.min(horizonDays, 60) * 86400000).toISOString().slice(0, 10);
const { body: range } = await get(`/api/availability?from=${today}&to=${to}`);
const untouched = range.days.find((d) => d.status === "open" && d.remaining === cap)?.date;
check("found an untouched day to test on", !!untouched, untouched);
if (!untouched) process.exit(1);

// 2. Ten people want the same day at the same moment: the cap holds.
const race = await Promise.all(Array.from({ length: 10 }, () => book({ date: untouched })));
const won = race.filter((r) => r.status === 201);
const lost = race.filter((r) => r.status === 409 && r.body.code === "day_full").length;
check(`same day, 10 concurrent requests -> ${cap} booked`, won.length === cap, `201s: ${won.length}`);
check(`the other ${10 - cap} get 409 day_full`, lost === 10 - cap, `409s: ${lost}`);
const internal = new Set(won.map((r) => r.body.booking?.slotId));
check("each job was filed under its own internal slot", internal.size === won.length);

// 3. The day now reads as full everywhere.
const { body: after } = await get(`/api/availability?date=${untouched}`);
check("day status is full", after.day.status === "full" && after.day.remaining === 0, after.day.status);
const conflict = race.find((r) => r.status === 409);
check("409 response carries the fresh day for the UI", conflict?.body.day?.status === "full");

// 4. Server-side rules the client can't bypass.
const sunday = range.days.find((d) => d.status === "closed")?.date;
if (sunday) {
  const r = await book({ date: sunday });
  check("closed day is refused", r.status === 422 && r.body.code === "date_unavailable", String(r.status));
}
const past = await book({ date: "2020-01-02" });
check("past date is refused", past.status === 422, String(past.status));
const badInput = await book({ date: next.next.date, email: "nope", zip: "12", phone: "12" });
check(
  "bad email, ZIP and phone are refused",
  badInput.status === 400 && ["email", "zip", "phone"].every((k) => badInput.body.errors?.[k]),
  JSON.stringify(Object.keys(badInput.body.errors ?? {})),
);
const badPkg = await book({ date: next.next.date, packageId: "mansion" });
check("unknown package is refused", badPkg.status === 400 && !!badPkg.body.errors?.packageId);
const bot = await book({ date: next.next.date, company: "Spam LLC" });
check("honeypot submission is swallowed, not booked", bot.status === 201 && bot.body.booking === null);

// 5. Price comes from the server, not the client.
const priced = won[0];
check("server computed the price", priced?.body.booking?.priceDollars === 169, String(priced?.body.booking?.priceDollars));

console.log(failures ? `\n${failures} check(s) failed` : "\nAll booking checks passed");
process.exit(failures ? 1 : 0);
