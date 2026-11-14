import type { Metadata } from "next";
import Link from "next/link";
import { Keystone } from "@/components/Keystone";
import { getPackage } from "@/content/pricing";
import { referralRewards } from "@/content/referral";
import { site } from "@/content/site";
import { formatLong } from "@/lib/booking/dates";
import { getBookingStore } from "@/lib/booking/store";
import type { BookingRecord, ReferralRecord } from "@/lib/booking/types";
import { formatPhone } from "@/lib/booking/validate";
import { verifyCheck, type CheckKind } from "@/lib/notify/check";
import styles from "./check.module.css";

// /check/<booking|referral>/<id>?s=<signature>: the "Check it's real" link in Jimmy's emails
// (lib/notify/check.ts). With a valid signature it shows the record straight from the database, so
// Jimmy can tell a real booking email from a fake one. Without one it shows nothing at all.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Check a booking email",
  robots: { index: false, follow: false },
};

type Search = Promise<{ s?: string | string[] }>;

export default async function CheckPage({ params, searchParams }: { params: Promise<{ kind: string; id: string }>; searchParams: Search }) {
  const { kind: rawKind, id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const sig = (await searchParams).s;
  const kind: CheckKind | null = rawKind === "booking" || rawKind === "referral" ? rawKind : null;
  const valid = !!kind && typeof sig === "string" && verifyCheck(kind, id, sig);

  let body: React.ReactNode;
  if (!valid) {
    body = (
      <div className={styles.bad} role="status">
        <h1>This link wasn&rsquo;t made by the website.</h1>
        <p>
          If it came in an email that looks like a booking or a referral, treat that email as fake. Real ones always have a working
          link. To be sure, look for it in the bookings or referrals table in Supabase.
        </p>
      </div>
    );
  } else {
    let record: BookingRecord | ReferralRecord | null = null;
    let failed = false;
    try {
      const store = getBookingStore();
      record = kind === "booking" ? await store.findBooking(id) : await store.findReferral(id);
    } catch (err) {
      console.error("[check] lookup failed", err);
      failed = true;
    }
    body = failed ? (
      <div className={styles.bad} role="status">
        <h1>The link is real, but the database can&rsquo;t be reached right now.</h1>
        <p>Try again in a few minutes.</p>
      </div>
    ) : !record ? (
      <div className={styles.bad} role="status">
        <h1>The link is real, but that {kind} isn&rsquo;t in the database any more.</h1>
        <p>Someone may have deleted it in Supabase.</p>
      </div>
    ) : kind === "booking" ? (
      <BookingFacts b={record as BookingRecord} />
    ) : (
      <ReferralFacts r={record as ReferralRecord} />
    );
  }

  return (
    <main id="main" className={styles.page}>
      <Link href="/" className={styles.home} aria-label={`${site.name} home`}>
        <Keystone className={styles.logo} />
        <span>{site.name}</span>
      </Link>
      {body}
    </main>
  );
}

function Facts({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className={styles.facts}>
      {rows
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
    </dl>
  );
}

function BookingFacts({ b }: { b: BookingRecord }) {
  const pkg = getPackage(b.packageId);
  return (
    <div className={styles.good}>
      <p className={styles.tag}>Real booking</p>
      <h1>
        {b.ref}: {formatLong(b.date)}
      </h1>
      {b.status === "cancelled" && <p className={styles.warn}>This booking has been cancelled.</p>}
      <Facts
        rows={[
          ["Status", b.status],
          ["House", `${pkg?.name ?? b.packageId}${b.rinse ? ", with a rinse" : ""}`],
          ["Price", `${b.priceIsEstimate ? "From " : ""}$${b.priceDollars}`],
          ["Name", b.customer.name],
          ["Phone", formatPhone(b.customer.phone)],
          ["Email", b.customer.email],
          ["Address", `${b.address.street}, ${b.address.city} ${b.address.zip}`],
          ["Notes", b.notes],
          ["Booked", new Date(b.createdAt).toLocaleString("en-US", { timeZone: "America/New_York" })],
        ]}
      />
    </div>
  );
}

function ReferralFacts({ r }: { r: ReferralRecord }) {
  const at = (v: string | null) => (v ? new Date(v).toLocaleString("en-US", { timeZone: "America/New_York" }) : null);
  return (
    <div className={styles.good}>
      <p className={styles.tag}>Real referral</p>
      <h1>
        {r.referrerName} referred {r.friendName}
      </h1>
      <Facts
        rows={[
          ["Code", r.code],
          ["Thank-you", referralRewards[r.reward].label],
          ["Referrer's phone", formatPhone(r.referrerPhone)],
          ["Referrer's email", r.referrerEmail],
          ["Friend's phone", r.friendPhone ? formatPhone(r.friendPhone) : ""],
          ["Friend's email", r.friendEmail],
          ["Friend's town", r.friendTown],
          ["Notes", r.notes],
          ["Referred", at(r.createdAt)],
          ["Booked", r.bookingRef ? `${r.bookingRef}, ${at(r.bookedAt)}` : "Not yet"],
          ["Thank-you paid", at(r.thankedAt) ?? "Not yet"],
        ]}
      />
    </div>
  );
}
