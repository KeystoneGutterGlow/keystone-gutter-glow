import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearOrderDraft } from "@/components/firewood/OrderForm";
import styles from "@/components/firewood/Firewood.module.css";
import { firewood } from "@/content/firewood";
import { getSiteMode, isFirewoodVisible } from "@/content/season";
import { site } from "@/content/site";
import { formatLong } from "@/lib/booking/dates";
import { getOrderView } from "@/lib/firewood/orderView";
import { formatCents } from "@/lib/firewood/pricing";

// Where Stripe sends the customer back to. Nothing here marks an order paid on its own. It shows
// whatever the order says, and the order only changes on a verified answer from Stripe.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your firewood order",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  if (!isFirewoodVisible()) notFound();
  const { session_id } = await searchParams;
  const backHref = getSiteMode() === "firewood" ? "/" : "/firewood";

  let order = null;
  let lookupFailed = false;
  try {
    order = await getOrderView(session_id);
  } catch (err) {
    console.error("[firewood] order lookup failed", err);
    lookupFailed = true;
  }

  const phone = (
    <a href={site.phone.href} className="textlink">
      {site.phone.display}
    </a>
  );

  return (
    <div data-season="firewood" className={styles.orderPage}>
      <main id="main" className={styles.orderCard}>
        <Link href={backHref} className={styles.orderLogo}>
          <Image src="/images/keystone-logo.png" alt={`${site.legalName}, back to firewood`} width={150} height={51} priority />
        </Link>
        {order?.testMode && <p className={styles.testNote}>Stripe test mode. No real money moved.</p>}

        {!order && (
          <>
            <h1>{lookupFailed ? "We can’t check your order right now" : "We can’t find that order"}</h1>
            <p>
              If you paid, your payment is safe and your receipt from Stripe has the details. Call or text {phone} and we&rsquo;ll
              sort it out.
            </p>
          </>
        )}

        {order && (order.status === "paid" || order.status === "needs_review") && (
          <>
            <ClearOrderDraft />
            <p className={styles.orderRef}>Order {order.ref}</p>
            <h1>Payment received. Thank you.</h1>
            <p>
              You asked for delivery on <strong>{formatLong(order.deliveryDate)}</strong>.
            </p>
            {firewood.fulfillment.value.afterPayment ? (
              <p>{firewood.fulfillment.value.afterPayment}</p>
            ) : (
              <p className="ph">What happens after payment goes here once Jimmy decides how orders get accepted.</p>
            )}
          </>
        )}

        {order?.status === "pending" && (
          <>
            <p className={styles.orderRef}>Order {order.ref}</p>
            <h1>Waiting on the payment</h1>
            <p>
              Stripe hasn&rsquo;t confirmed this payment yet. Some payment methods take longer than a card.{" "}
              <a href={`/firewood/order?session_id=${encodeURIComponent(session_id ?? "")}`} className="textlink">
                Check again
              </a>
              .
            </p>
          </>
        )}

        {order && (order.status === "payment_failed" || order.status === "expired") && (
          <>
            <p className={styles.orderRef}>Order {order.ref}</p>
            <h1>{order.status === "expired" ? "That checkout timed out" : "The payment didn’t go through"}</h1>
            <p>
              You weren&rsquo;t charged for this order. <Link href={`${backHref}#order`} className="textlink">Go back to your order</Link>{" "}
              to try again, or call or text {phone}.
            </p>
          </>
        )}

        {order && (
          <table className={styles.orderTable}>
            <caption className="vh">Order total</caption>
            <tbody>
              {order.lines.map((l) => (
                <tr key={l.id}>
                  <th scope="row">{l.label}</th>
                  <td>{formatCents(l.cents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td>{formatCents(order.totalCents)}</td>
              </tr>
            </tfoot>
          </table>
        )}

        <p className={styles.orderFoot}>
          Questions? Call or text {phone}. <Link href={backHref} className="textlink">Back to firewood</Link>
        </p>
      </main>
    </div>
  );
}
