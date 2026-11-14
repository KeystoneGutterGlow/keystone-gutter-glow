import { today } from "@/lib/booking/service";
import { getBookingStore } from "@/lib/booking/store";

// GET /api/keepalive
// Vercel runs this once a day (vercel.json, "crons"). Supabase's free plan pauses a database after
// a week with no activity, and a paused database means nobody can book until someone restores it
// by hand. One small read a day counts as activity, so the database never sits idle that long.
// It reads one day's taken slots and returns nothing about them.
//   200 { ok: true }    the database answered
//   503 { ok: false }   it didn't: look at Supabase (paused, or having an outage)

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  // If CRON_SECRET is set in Vercel, only Vercel's scheduler (which sends it) can run this.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401, headers: noStore });
  }
  try {
    const day = today();
    await getBookingStore().listTaken(day, day);
    return Response.json({ ok: true }, { headers: noStore });
  } catch (err) {
    console.error("[keepalive] the database didn't answer", err);
    return Response.json({ ok: false }, { status: 503, headers: noStore });
  }
}
