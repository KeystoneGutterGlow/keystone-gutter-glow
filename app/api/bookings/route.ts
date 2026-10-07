import { createBooking } from "@/lib/booking/service";
import { parseBookingRequest } from "@/lib/booking/validate";

// POST /api/bookings
// Re-validates everything the form already checked, re-checks the date, then asks the
// store to create the booking atomically. The client's idea of availability is never trusted.
//   201 { booking }                    created
//   400 { errors }                     bad input
//   409 { code, message, day }         slot or day was taken in the meantime (fresh slots included)
//   422 { code, message, day }         the date itself isn't bookable

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON" }, { status: 400 });
  }

  const parsed = parseBookingRequest(body);
  if (!parsed.ok) {
    // Quietly accept bot submissions so they don't learn anything.
    if (parsed.spam) return Response.json({ booking: null }, { status: 201 });
    return Response.json({ errors: parsed.errors }, { status: 400 });
  }

  try {
    const outcome = await createBooking(parsed.data);
    if (!outcome.ok) {
      return Response.json({ code: outcome.code, message: outcome.message, day: outcome.day }, { status: outcome.status });
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
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[bookings] create failed", err);
    return Response.json(
      { error: "Something went wrong on our end. Call or text and we'll book you by hand." },
      { status: 500 },
    );
  }
}
