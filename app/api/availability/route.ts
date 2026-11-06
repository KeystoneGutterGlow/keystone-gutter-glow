import { bookingRules } from "@/content/booking";
import { isISODate } from "@/lib/booking/dates";
import { getDay, getNextOpening, getRange, isRangeOk, MAX_RANGE_DAYS, today } from "@/lib/booking/service";
import { isDemoStorage } from "@/lib/storage";

// GET /api/availability?date=2026-10-16          -> one day with every start time and its state
// GET /api/availability?from=2026-10-01&to=...    -> per-day status for a calendar month
// GET /api/availability?next=1                    -> the first open day and time
// 503 { error } when storage isn't configured or can't be reached.

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

function meta() {
  return {
    today: today(),
    minLeadDays: bookingRules.minLeadDays,
    horizonDays: bookingRules.horizonDays,
    maxJobsPerDay: bookingRules.maxJobsPerDay,
    demo: isDemoStorage(),
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  try {
    if (params.get("next")) {
      return Response.json({ meta: meta(), next: await getNextOpening() }, { headers: noStore });
    }

    const date = params.get("date");
    if (date !== null) {
      if (!isISODate(date)) return Response.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
      return Response.json({ meta: meta(), day: await getDay(date) }, { headers: noStore });
    }

    const from = params.get("from");
    const to = params.get("to");
    if (!isISODate(from) || !isISODate(to)) {
      return Response.json({ error: "Pass ?date=, ?from=&to=, or ?next=1" }, { status: 400 });
    }
    if (!isRangeOk(from, to)) {
      return Response.json({ error: `Range must be 0 to ${MAX_RANGE_DAYS} days` }, { status: 400 });
    }
    return Response.json({ meta: meta(), days: await getRange(from, to) }, { headers: noStore });
  } catch (err) {
    console.error("[availability] failed", err);
    return Response.json({ error: "The schedule isn't available right now." }, { status: 503, headers: noStore });
  }
}
