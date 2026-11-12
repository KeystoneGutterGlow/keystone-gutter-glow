import { site } from "@/content/site";
import { getBookingStore } from "@/lib/booking/store";
import { formSubmitEnabled, referralNotice } from "@/lib/notify/formsubmit";
import { allowRequest, readJson } from "@/lib/rateLimit";
import { parseReferralRequest } from "@/lib/referral/validate";
import { isDemoStorage } from "@/lib/storage";

// POST /api/referrals
// Checks a referral from /refer, saves it with a personal code for the friend (the referrals table),
// and returns Jimmy's FormSubmit notice, with the friend's link, for the browser to send. The
// referrer never sees the code: Jimmy sends it to the friend.
//   201 { ok: true, notice }      valid and saved: the browser sends `notice` (lib/notify/notice.ts)
//   201 { ok: true, demo, code }  demo deployment: saved in memory, nothing sent, and the page shows the link
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

  // Jimmy only hears about a referral by email, so a real deployment without it refuses rather than
  // saving a referral nobody will act on.
  if (!formSubmitEnabled() && !isDemoStorage()) {
    return Response.json(
      { error: `Online referrals aren't open right now. Call or text ${site.phone.display} with their name and number.` },
      { status: 503, headers: noStore },
    );
  }

  const r = parsed.data;
  let code: string;
  try {
    const saved = await getBookingStore().createReferral({
      referrerName: r.name,
      referrerPhone: r.phone,
      referrerEmail: r.email,
      reward: r.reward,
      friendName: r.friendName,
      friendPhone: r.friendPhone,
      friendEmail: r.friendEmail,
      friendTown: r.friendTown,
      notes: r.notes,
    });
    code = saved.code;
  } catch (err) {
    console.error("[referrals] save failed", err);
    return Response.json(
      { error: `We couldn't save that. Call or text ${site.phone.display} with their name and number.` },
      { status: 503, headers: noStore },
    );
  }

  if (!formSubmitEnabled()) return Response.json({ ok: true, demo: true, code }, { status: 201, headers: noStore });
  return Response.json({ ok: true, notice: referralNotice(r, code) }, { status: 201, headers: noStore });
}
