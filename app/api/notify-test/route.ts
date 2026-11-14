import { formSubmitEnabled, notifyTestEnabled, testNotice } from "@/lib/notify/formsubmit";
import { allowRequest } from "@/lib/rateLimit";

// POST /api/notify-test
// Hands /notify-test a test notice for the browser to send through FormSubmit. Used once to activate
// FormSubmit for this site, then whenever someone wants to check that notices still arrive.
//   201 { notice }   notifications are on here
//   409 { error }    they're off (FORMSUBMIT_ENABLED isn't "true", a preview, or the demo store)
//   429 { error }    too many tests from one address
//   404              the test page is switched off (NOTIFY_TEST_ENABLED isn't "true"), the normal state

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!notifyTestEnabled()) return new Response(null, { status: 404, headers: noStore });
  if (!allowRequest("notify-test", request, 5)) {
    return Response.json({ error: "Too many tests. Wait a minute." }, { status: 429, headers: noStore });
  }
  if (!formSubmitEnabled()) {
    return Response.json({ error: "Notifications are off on this deployment." }, { status: 409, headers: noStore });
  }
  const sentAt = new Date().toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "full", timeStyle: "short" });
  return Response.json({ notice: testNotice(sentAt) }, { status: 201, headers: noStore });
}
