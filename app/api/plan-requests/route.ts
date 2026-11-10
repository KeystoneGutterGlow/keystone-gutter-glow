import { getPlanFrequency } from "@/content/plans";
import { site } from "@/content/site";
import { formSubmitEnabled, planRequestNotice } from "@/lib/notify/formsubmit";
import { parsePlanRequest } from "@/lib/plan/validate";
import { allowRequest, readJson } from "@/lib/rateLimit";
import { isDemoStorage } from "@/lib/storage";

// POST /api/plan-requests
// Checks a recurring-plan request and returns Jimmy's FormSubmit notice for the browser to send.
// That email is the only record, so the page only says it worked once FormSubmit confirms it.
//   201 { ok: true, notice }  valid: the browser sends `notice` (lib/notify/notice.ts)
//   201 { ok: true, demo }    demo deployment: nothing is sent, and the page says so
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

  if (!formSubmitEnabled()) {
    if (isDemoStorage()) return Response.json({ ok: true, demo: true }, { status: 201, headers: noStore });
    return Response.json(
      { error: `Online plan requests aren't open right now. Call or text ${site.phone.display} and we'll set it up.` },
      { status: 503, headers: noStore },
    );
  }

  const r = parsed.data;
  const notice = planRequestNotice({
    frequency: getPlanFrequency(r.frequencyId)?.label ?? r.frequencyId,
    name: r.name,
    email: r.email,
    phone: r.phone,
    street: r.street,
    city: r.city,
    zip: r.zip,
    notes: r.notes,
  });
  return Response.json({ ok: true, notice }, { status: 201, headers: noStore });
}
