import { stateForZip } from "@/content/area";
import { planRules } from "@/content/plans";
import { getPackage } from "@/content/pricing";
import { site } from "@/content/site";
import type { BookingRules } from "@/content/booking";
import { formatLong } from "@/lib/booking/dates";
import type { BookingRecord } from "@/lib/booking/types";
import { formatPhone } from "@/lib/booking/validate";
import { isDemoStorage } from "@/lib/storage";
import { FORMSUBMIT_AJAX, type Notice } from "./notice";

// Writes the FormSubmit notices for Jimmy. Server only: the API routes hand the result to the
// browser, which sends it (lib/notify/notice.ts). No API key, account or domain setup is involved.
//
//   FORMSUBMIT_ENABLED=true   turns notices on. OFF by default, and never on for Vercel previews
//                             or the demo store, whose bookings aren't real.
//
// Until Jimmy clicks "Activate Form" in FormSubmit's first email, every submission sends him
// another activation email instead of the notice. So only switch this on once he expects that
// email, and activate it straight away (README, "Notifications to Jimmy").
//
// Everything goes to the address published on the site, content/site.ts `email`.

type Env = Record<string, string | undefined>;

export function formSubmitEnabled(env: Env = process.env): boolean {
  if (env.FORMSUBMIT_ENABLED !== "true") return false;
  if (env.VERCEL_ENV === "preview") return false;
  return !isDemoStorage(env);
}

export function formSubmitEndpoint(): string {
  return `${FORMSUBMIT_AJAX}${site.email}`;
}

/** FormSubmit settings shared by every notice. */
function settings(subject: string, customerEmail: string): Record<string, string> {
  return {
    _subject: subject,
    // Reply goes straight to the customer.
    _replyto: customerEmail,
    _template: "table",
    // AJAX submissions can't show FormSubmit's reCAPTCHA. Our own checks run first (see README).
    _captcha: "false",
    // FormSubmit's honeypot. Always empty from us; anything that fills it gets silently dropped.
    _honey: "",
  };
}

function compact(fields: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(fields).filter((e): e is [string, string] => !!e[1]));
}

/** The notice for a booking the database has accepted. */
export function bookingNotice(
  b: BookingRecord,
  rules: BookingRules,
  extra: { planLabel?: string; notes?: string } = {},
): Notice {
  const pkg = getPackage(b.packageId);
  const when =
    rules.scheduleMode === "day-only"
      ? formatLong(b.date)
      : `${formatLong(b.date)}, ${rules.slots.find((s) => s.id === b.slotId)?.label ?? b.slotId}`;
  return {
    endpoint: formSubmitEndpoint(),
    fields: {
      ...settings(`New booking ${b.ref}: ${when}`, b.customer.email),
      ...compact({
        Booking: `${b.ref} (saved in the booking database)`,
        When: when,
        Address: `${b.address.street}, ${b.address.city}, ${stateForZip(b.address.zip)} ${b.address.zip}`,
        House: `${pkg?.name ?? b.packageId}${b.rinse ? ", with a rinse" : ""}`,
        Price: `${b.priceIsEstimate ? "Starting at " : ""}$${b.priceDollars}, invoiced after the job`,
        "Recurring plan": extra.planLabel
          ? `${extra.planLabel}. Agreed to the Recurring Plan Terms (version ${planRules.termsVersion}): paid in full after the first cleaning, renews yearly until cancelled, ${planRules.cancellationFeePercent}% of the annual total to cancel.`
          : undefined,
        Name: b.customer.name,
        Phone: formatPhone(b.customer.phone),
        // Lower-case "email" is the field FormSubmit reads for Reply-To.
        email: b.customer.email,
        "Additional information": extra.notes,
      }),
    },
  };
}

export interface PlanNoticeInput {
  frequency: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  notes?: string;
}

/** The notice for a recurring-plan request. The email is the only record of it. */
export function planRequestNotice(r: PlanNoticeInput): Notice {
  return {
    endpoint: formSubmitEndpoint(),
    fields: {
      ...settings(`Recurring plan request: ${r.frequency}, ${r.city}`, r.email),
      ...compact({
        Request: `Recurring plan. Agreed to the Recurring Plan Terms (version ${planRules.termsVersion}). Confirm the dates with the customer.`,
        "How often": r.frequency,
        Address: `${r.street}, ${r.city}, ${stateForZip(r.zip)} ${r.zip}`,
        Name: r.name,
        Phone: formatPhone(r.phone),
        email: r.email,
        "Additional information": r.notes,
      }),
    },
  };
}

/** The message sent from /notify-test, to activate FormSubmit and check it still works. */
export function testNotice(sentAt: string): Notice {
  return {
    endpoint: formSubmitEndpoint(),
    fields: {
      _subject: "Test: Keystone Gutter Glow website notifications",
      _template: "table",
      _captcha: "false",
      _honey: "",
      Test: "This is a test from the Keystone Gutter Glow website. Bookings and recurring-plan requests will arrive like this.",
      Sent: sentAt,
    },
  };
}
