import { getPlanFrequency } from "@/content/plans";
import { site } from "@/content/site";
import { formSubmitEnabled, planRequestNotice } from "@/lib/notify/formsubmit";
import { attachPlanToBooking } from "@/lib/plan/attach";
import { parsePlanRequest } from "@/lib/plan/validate";
import { allowRequest, readJson } from "@/lib/rateLimit";
import { isDemoStorage } from "@/lib/storage";

// POST /api/plan-requests
// Checks a recurring-plan request and returns Jimmy's FormSubmit notice for the browser to send.
// That email is the only record, so the page only says it worked once FormSubmit confirms it.
//   201 { ok: true, notice, booking? }  valid: the browser sends `notice` (lib/notify/notice.ts).
//                                       With bookingRef, the plan is added to that booking first
//                                       (lib/plan/attach.ts) and `booking` has its new price.
//   201 { ok: true, demo, booking? }    demo deployment: nothing is sent, and the page says so
//   404/409/422 { error }               the booking can't take the plan (not found, already on one, past)
//   400 { errors }            bad input
//   429 { error }             too many attempts from one address
//   503 { error }             notifications are off on a real deployment

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!allowRequest("plan-requests", request, 20)) {
    return Response.json({ error: "Too many attempts. Wait a minute, or call or text us." }, { status: 429, headers: noStore });
  }

  const body = await readJson(request);
  if (body === undefined) return Response.json({ error: "Expected JSON" }, { status: 400, headers: noStore });

  const parsed = parsePlanRequest(body);
  if (!parsed.ok) {
    // Quietly accept bot submissions so they don't learn anything.
    if (parsed.spam) return Response.json({ ok: true }, { status: 201, headers: noStore });
    return Response.json({ errors: parsed.errors }, { status: 400, headers: noStore });
  }

  if (!formSubmitEnabled() && !isDemoStorage()) {
    return Response.json(
      { error: `Online plan requests aren't open right now. Call or text ${site.phone.display} and we'll set it up.` },
      { status: 503, headers: noStore },
    );
  }

  const r = parsed.data;
  // Put the plan on the booking it starts with. If the database can't be reached, the request still
  // goes to Jimmy by email, the way plan requests worked before, and he changes the booking by hand.
  let attached: Awaited<ReturnType<typeof attachPlanToBooking>> | null = null;
  if (r.bookingRef) {
    try {
      attached = await attachPlanToBooking({ ref: r.bookingRef, email: r.email, frequencyId: r.frequencyId });
    } catch (err) {
      console.error("[plan-requests] couldn't update the booking", err);
    }
    if (attached && !attached.ok) return Response.json({ error: attached.message }, { status: attached.status, headers: noStore });
  }
  const booking =
    attached?.ok === true
      ? {
          ref: attached.booking.ref,
          priceDollars: attached.booking.priceDollars,
          planLabel: attached.plan.label,
          planFrequencyId: attached.plan.id,
        }
      : undefined;
  if (!formSubmitEnabled()) return Response.json({ ok: true, demo: true, booking }, { status: 201, headers: noStore });

  const notice = planRequestNotice({
    frequency: getPlanFrequency(r.frequencyId)?.label ?? r.frequencyId,
    name: r.name,
    email: r.email,
    phone: r.phone,
    street: r.street,
    city: r.city,
    zip: r.zip,
    notes: r.notes,
    booking:
      attached?.ok === true
        ? {
            ref: attached.booking.ref,
            date: attached.booking.date,
            priceBefore: attached.priceBefore,
            priceNow: attached.booking.priceDollars,
            firstYear: attached.q.firstYear,
            estimate: attached.booking.priceIsEstimate,
          }
        : undefined,
  });
  return Response.json({ ok: true, notice, booking }, { status: 201, headers: noStore });
}
