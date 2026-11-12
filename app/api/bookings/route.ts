import { getPlanFrequency } from "@/content/plans";
import { createBooking } from "@/lib/booking/service";
import { parseBookingRequest } from "@/lib/booking/validate";
import { allowRequest, readJson } from "@/lib/rateLimit";
import { isDemoStorage, StorageUnavailableError } from "@/lib/storage";

// POST /api/bookings
// Re-validates everything the form already checked, re-checks the date, then asks the
// store to create the booking atomically. The client's idea of availability is never trusted.
//   201 { booking, notice }            created (or already created by this same request). `notice`
//                                      is Jimmy's FormSubmit notification for the browser to send,
//                                      or null when notifications are off (lib/notify/formsubmit.ts).
//   400 { errors }                     bad input
//   409 { code, message, day }         slot or day was taken in the meantime (fresh slots included)
//   422 { code, message, day }         the date itself isn't bookable
//   429 { error }                      too many attempts from one address
//   503 { error }                      storage isn't configured (see lib/storage.ts)

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!allowRequest("bookings", request, 40)) {
    return Response.json({ error: "Too many attempts. Wait a minute, or call or text us." }, { status: 429, headers: noStore });
  }

  const body = await readJson(request);
  if (body === undefined) return Response.json({ error: "Expected JSON" }, { status: 400, headers: noStore });

  const parsed = parseBookingRequest(body);
  if (!parsed.ok) {
    // Quietly accept bot submissions so they don't learn anything.
    if (parsed.spam) return Response.json({ booking: null }, { status: 201, headers: noStore });
    return Response.json({ errors: parsed.errors }, { status: 400, headers: noStore });
  }

  try {
    const outcome = await createBooking(parsed.data);
    if (!outcome.ok) {
      return Response.json(
        { code: outcome.code, message: outcome.message, day: outcome.day },
        { status: outcome.status, headers: noStore },
      );
    }
    const b = outcome.booking;
    return Response.json(
      {
        booking: {
          ref: b.ref,
          date: b.date,
          slotId: b.slotId,
          packageId: b.packageId,
          rinse: b.rinse,
          priceDollars: b.priceDollars,
          priceIsEstimate: b.priceIsEstimate,
          email: b.customer.email,
          address: b.address,
          planLabel: parsed.data.planFrequencyId ? (getPlanFrequency(parsed.data.planFrequencyId)?.label ?? null) : null,
          planFrequencyId: parsed.data.planFrequencyId ? (getPlanFrequency(parsed.data.planFrequencyId)?.id ?? null) : null,
          referralOff: outcome.referralOff,
          referredBy: parsed.data.referral ? parsed.data.referredBy : null,
          demo: isDemoStorage(),
        },
        notice: outcome.notice,
      },
      { status: 201, headers: noStore },
    );
  } catch (err) {
    console.error("[bookings] create failed", err);
    const unavailable = err instanceof StorageUnavailableError;
    return Response.json(
      {
        error: unavailable
          ? "Online booking isn't open right now. Call or text and we'll book you by hand."
          : "Something went wrong on our end. Call or text and we'll book you by hand.",
      },
      { status: unavailable ? 503 : 500, headers: noStore },
    );
  }
}
