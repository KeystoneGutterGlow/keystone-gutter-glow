// Runs db/migrations/001_bookings.sql on PGlite (real Postgres compiled to WASM, in-process)
// and checks that the database itself refuses double bookings and a fifth job on a day.
//   npm run test:sql

import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const sql = await readFile(new URL("../db/migrations/001_bookings.sql", import.meta.url), "utf8");
const db = new PGlite();
await db.exec(sql);

let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
};

let n = 0;
async function create(date, slot) {
  n++;
  const p = {
    ref: `KGG-T${n}`,
    service_date: date,
    slot_id: slot,
    package_id: "two-story",
    rinse: false,
    price_dollars: 229,
    customer_name: "SQL Test",
    customer_email: "sql@example.com",
    customer_phone: "2155550100",
    street: "1 Test Ln",
    city: "Jamison",
    zip: "18929",
  };
  const { rows } = await db.query("select public.create_booking($1::jsonb) as r", [JSON.stringify(p)]);
  return rows[0].r;
}

const D = "2026-11-03";

const first = await create(D, "08:00");
check("first booking is created", first.ok === true && first.booking?.slot_id === "08:00");

const dup = await create(D, "08:00");
check("same day + time is refused as slot_taken", dup.ok === false && dup.reason === "slot_taken", JSON.stringify(dup));

for (const slot of ["10:00", "12:00", "14:00"]) await create(D, slot);
const fifth = await create(D, "16:00");
check("a fifth booking on the day is refused as day_full", fifth.ok === false && fifth.reason === "day_full", JSON.stringify(fifth));

const { rows: count } = await db.query(
  "select count(*)::int as c from bookings where service_date = $1 and status = 'confirmed'",
  [D],
);
check("exactly 4 confirmed bookings on the day", count[0].c === 4, String(count[0].c));

// Going around the function doesn't help: the trigger and the index still apply.
let directErr = "";
try {
  await db.query(
    `insert into bookings (ref, service_date, slot_id, package_id, price_dollars, customer_name, customer_email, customer_phone, street, city, zip)
     values ('KGG-RAW', $1, '16:00', 'one-story', 169, 'Raw', 'raw@example.com', '1', 'x', 'y', '18929')`,
    [D],
  );
} catch (e) {
  directErr = e.message;
}
check("a raw INSERT over the cap is blocked by the trigger", directErr.includes("day_full"), directErr);

// Cancelling frees the time and the capacity.
await db.query("update bookings set status = 'cancelled' where service_date = $1 and slot_id = '08:00'", [D]);
const rebook = await create(D, "08:00");
check("after a cancellation the time can be booked again", rebook.ok === true, JSON.stringify(rebook.reason ?? ""));

// Re-confirming the cancelled row now would make five: refused.
let reconfirmErr = "";
try {
  await db.query("update bookings set status = 'confirmed' where ref = 'KGG-T1'");
} catch (e) {
  reconfirmErr = e.message;
}
check(
  "re-confirming a cancelled booking can't break the rules",
  reconfirmErr.includes("day_full") || reconfirmErr.includes("bookings_one_per_slot"),
  reconfirmErr,
);

const other = await create("2026-11-04", "08:00");
check("other days are unaffected", other.ok === true);

const badSlot = await db.query("select 1").then(async () => {
  try {
    await create("2026-11-05", "8am");
    return "";
  } catch (e) {
    return e.message;
  }
});
check("malformed start time is rejected by a CHECK constraint", badSlot.includes("check"), badSlot);

console.log(failures ? `\n${failures} check(s) failed` : "\nAll database checks passed");
await db.close();
process.exit(failures ? 1 : 0);
