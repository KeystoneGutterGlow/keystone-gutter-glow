import { getPlanFrequency } from "@/content/plans";
import { site } from "@/content/site";
import { formatPhone } from "@/lib/booking/validate";
import { emailConfigured, ownerEmail, sendEmail } from "@/lib/notify/email";
import { parsePlanRequest } from "@/lib/plan/validate";
import { allowRequest, readJson } from "@/lib/rateLimit";
import { isDemoStorage } from "@/lib/storage";

// POST /api/plan-requests
// Emails Jimmy a recurring-plan request. The email is the only record, so the customer is only
// told it worked once it has been sent.
//   201 { ok: true, demo? }   sent (or, on a demo deployment with no email, deliberately not sent)
//   400 { errors }            bad input
//   429 { error }             too many attempts from one address
//   502 { error }             the email provider refused or failed
//   503 { error }             email isn't configured on a real deployment

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

  if (!emailConfigured()) {
    if (isDemoStorage()) return Response.json({ ok: true, demo: true }, { status: 201, headers: noStore });
    return Response.json(
      { error: `Online plan requests aren't open right now. Call or text ${site.phone.display} and we'll set it up.` },
      { status: 503, headers: noStore },
    );
  }

  const r = parsed.data;
  const frequency = getPlanFrequency(r.frequencyId)?.label ?? r.frequencyId;
  const sent = await sendEmail({
    to: ownerEmail(),
    replyTo: r.email,
    subject: `Recurring plan request: ${frequency}, ${r.city}`,
    text: [
      "This is a request. Nothing has been scheduled or billed.",
      "",
      `How often: ${frequency}`,
      `Where: ${r.street}, ${r.city}, ${site.state} ${r.zip}`,
      `Customer: ${r.name}, ${formatPhone(r.phone)}, ${r.email}`,
      r.notes ? `Additional information: ${r.notes}` : "",
    ]
      .filter((line, i) => line !== "" || i === 1)
      .join("\n"),
  });

  if (!sent.sent) {
    return Response.json(
      { error: `We couldn't send that, and Jimmy hasn't seen it. Call or text ${site.phone.display} and we'll set it up.` },
      { status: 502, headers: noStore },
    );
  }
  return Response.json({ ok: true }, { status: 201, headers: noStore });
}
