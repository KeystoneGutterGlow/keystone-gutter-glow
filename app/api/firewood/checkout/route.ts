import { explainClosed, startCheckout } from "@/lib/firewood/checkout";
import { allowRequest, readJson } from "@/lib/rateLimit";
import { StorageUnavailableError } from "@/lib/storage";
import { checkoutOrigin } from "@/lib/env";
import { site } from "@/content/site";

// POST /api/firewood/checkout
//   200 { url, ref }                 go to Stripe's hosted payment page
//   200 { alreadyPaid, ref, url }    this exact order was already paid. Go to the order page.
//   400 { errors }                   bad input
//   409 { code: "price_changed" }    the price changed since the page loaded (fresh lines included)
//   429                              too many attempts
//   502                              Stripe couldn't be reached
//   503 { code: "closed" }           checkout isn't open (see lib/firewood/gate.ts)

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const closedMessage = `Online payment isn't open yet. Call or text ${site.phone.display} and we'll take your order by hand.`;

export async function POST(request: Request) {
  if (!allowRequest("firewood-checkout", request, 20)) {
    return Response.json({ error: "Too many attempts. Wait a minute and try again." }, { status: 429, headers: noStore });
  }

  const body = await readJson(request);
  if (body === undefined) return Response.json({ error: "Expected JSON" }, { status: 400, headers: noStore });

  try {
    const origin = checkoutOrigin(request);
    const out = await startCheckout(body, origin);
    switch (out.kind) {
      case "redirect":
        return Response.json({ url: out.url, ref: out.ref }, { headers: noStore });
      case "already_paid":
        return Response.json(
          {
            alreadyPaid: true,
            ref: out.ref,
            url: out.sessionId ? `${origin}/firewood/order?session_id=${encodeURIComponent(out.sessionId)}` : `${origin}/firewood`,
          },
          { headers: noStore },
        );
      case "invalid":
        return Response.json({ errors: out.errors }, { status: 400, headers: noStore });
      case "price_changed":
        return Response.json(
          {
            code: "price_changed",
            lines: out.lines,
            totalCents: out.totalCents,
            message: "The price changed since this page loaded. Check the new total and try again.",
          },
          { status: 409, headers: noStore },
        );
      case "spam":
        return Response.json({ error: "Couldn't start checkout." }, { status: 400, headers: noStore });
      case "closed":
        console.warn(`[firewood] checkout refused: ${explainClosed(out.reason)}`);
        return Response.json({ code: "closed", error: closedMessage }, { status: 503, headers: noStore });
      case "stripe_error":
        return Response.json(
          { error: `We couldn't open the payment page. Nothing was charged. Try again, or call or text ${site.phone.display}.` },
          { status: 502, headers: noStore },
        );
    }
  } catch (err) {
    console.error("[firewood] checkout failed", err);
    const closed = err instanceof StorageUnavailableError;
    return Response.json(
      {
        ...(closed ? { code: "closed" } : {}),
        error: closed ? closedMessage : `Something went wrong and nothing was charged. Call or text ${site.phone.display}.`,
      },
      { status: closed ? 503 : 500, headers: noStore },
    );
  }
}
