import { site } from "@/content/site";
import { formSubmitEnabled, referralNotice } from "@/lib/notify/formsubmit";
import { allowRequest, readJson } from "@/lib/rateLimit";
import { parseReferralRequest } from "@/lib/referral/validate";
import { isDemoStorage } from "@/lib/storage";

// POST /api/referrals
// Checks a referral from /refer and returns Jimmy's FormSubmit notice for the browser to send.
// That email is the only record, so the page only says it worked once FormSubmit confirms it.
//   201 { ok: true, notice }  valid: the browser sends `notice` (lib/notify/notice.ts)
//   201 { ok: true, demo }    demo deployment: nothing is sent, and the page says so
//   400 { errors }            bad input
//   429 { error }             too many attempts from one address
//   503 { error }             notifications are off on a real deployment

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!allowRequest("referrals", request, 20)) {
    return Response.json({ error: "Too many attempts. Wait a minute, or call or text us." }, { status: 429, headers: noStore });
  }

  const body = await readJson(request);
  if (body === undefined) return Response.json({ error: "Expected JSON" }, { status: 400, headers: noStore });

  const parsed = parseReferralRequest(body);
  if (!parsed.ok) {
    // Quietly accept bot submissions so they don't learn anything.
    if (parsed.spam) return Response.json({ ok: true }, { status: 201, headers: noStore });
    return Response.json({ errors: parsed.errors }, { status: 400, headers: noStore });
  }

  if (!formSubmitEnabled()) {
    if (isDemoStorage()) return Response.json({ ok: true, demo: true }, { status: 201, headers: noStore });
    return Response.json(
      { error: `Online referrals aren't open right now. Call or text ${site.phone.display} with their name and number.` },
      { status: 503, headers: noStore },
    );
  }

  return Response.json({ ok: true, notice: referralNotice(parsed.data) }, { status: 201, headers: noStore });
}
