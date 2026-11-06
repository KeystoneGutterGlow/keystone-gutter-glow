import { firewood } from "@/content/firewood";
import { todayIn } from "@/lib/booking/dates";
import { checkoutGate } from "@/lib/firewood/gate";
import { isDemoStorage } from "@/lib/storage";

// GET /api/firewood/status. What the order form needs to know that depends on the server:
// whether payment is open, whether this is test mode, and today's date in the business time zone.
// Never returns keys or the reason a key is missing.

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = checkoutGate();
  return Response.json(
    {
      open: gate.open,
      mode: gate.mode,
      demoStore: isDemoStorage(),
      today: todayIn(firewood.timeZone),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
