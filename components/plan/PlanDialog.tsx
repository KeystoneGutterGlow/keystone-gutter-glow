"use client";

import { cloneElement, useId, useRef, useState } from "react";
import { additionalInfo } from "@/content/booking";
import { getPlanFrequency, planFrequencies, planRules, recommendedPlan, recommendedWhy } from "@/content/plans";
import { site } from "@/content/site";
import { PlanAgreement } from "@/components/plan/PlanAgreement";
import { formatLong } from "@/lib/booking/dates";
import { formatPhone } from "@/lib/booking/validate";
import { sendNotice, type Notice } from "@/lib/notify/notice";
import { validatePlan, type PlanFieldErrors, type PlanRequest } from "@/lib/plan/validate";
import styles from "./PlanDialog.module.css";

// The recurring-plan request. A native modal <dialog>, so the browser handles the focus trap,
// Escape and hiding the page behind it from screen readers. Every customer sees 6 months selected
// and recommended first. The customer has to tick the Recurring Plan Terms box (PlanAgreement), the
// same as when booking a plan. Sending emails Jimmy (the server checks it, then this sends it through
// FormSubmit), and he confirms the dates. It only says "sent" once FormSubmit confirms it.

type Contact = Omit<PlanRequest, "frequencyId" | "notes" | "planTerms" | "bookingRef">;

/** What changed on the booking when a plan was added to it */
export interface PlanAdded {
  ref: string;
  priceDollars: number;
  planLabel: string;
  planFrequencyId: string;
}

const EMPTY: PlanRequest = {
  frequencyId: recommendedPlan,
  name: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  zip: "",
  notes: "",
  planTerms: false,
};

const FIELD_ORDER: Array<keyof PlanRequest> = ["street", "city", "zip", "name", "phone", "email", "planTerms"];

export function PlanDialog({
  className,
  initial,
  price,
  booking,
  onPlanAdded,
  children,
}: {
  className?: string;
  initial?: Partial<Contact>;
  /** One cleaning's regular price for this house, so the agreement can show the plan price and annual total */
  price?: { regular: number; isFrom: boolean };
  /** The booking the plan starts with. The server moves it to the plan price. */
  booking?: { ref: string; date: string };
  /** Called when the dialog closes after the plan was added, with the booking's new price */
  onPlanAdded?: (update: PlanAdded) => void;
  children: React.ReactNode;
}) {
  const uid = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bannerRef = useRef<HTMLParagraphElement>(null);
  const [form, setForm] = useState<PlanRequest>({ ...EMPTY, ...initial });
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<PlanFieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{ demo: boolean; booking?: PlanAdded } | null>(null);

  const set = <K extends keyof PlanRequest>(key: K, value: PlanRequest[K]) => {
    // A different frequency means different terms to agree to.
    setForm((f) => ({ ...f, [key]: value, ...(key === "frequencyId" && f.frequencyId !== value ? { planTerms: false } : {}) }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  function open() {
    dialogRef.current?.showModal();
    headingRef.current?.focus();
  }

  function close() {
    dialogRef.current?.close();
  }

  // Runs on the X, Escape and the backdrop alike. A sent form starts over next time.
  function onClosed() {
    if (!sent) return;
    if (sent.booking) onPlanAdded?.(sent.booking);
    setSent(null);
    setForm({ ...EMPTY, ...initial });
  }

  function showBanner(message: string) {
    setBanner(message);
    requestAnimationFrame(() => bannerRef.current?.focus());
  }

  function focusFirst(errs: PlanFieldErrors) {
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (first) document.getElementById(`${uid}-${first}`)?.focus();
  }

  async function submit() {
    if (submitting) return;
    setBanner(null);
    const errs = validatePlan(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      focusFirst(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/plan-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20_000),
        body: JSON.stringify({ ...form, company, bookingRef: booking?.ref }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        demo?: boolean;
        notice?: Notice;
        booking?: PlanAdded;
        errors?: PlanFieldErrors;
        error?: string;
      };
      if (res.ok) {
        if (data.notice) {
          const delivered = await sendNotice(data.notice);
          if (!delivered.ok) {
            showBanner(`We couldn't send that, and Jimmy hasn't seen it. Try again, or call or text ${site.phone.display}.`);
            return;
          }
        }
        setSent({ demo: data.demo === true, booking: data.booking });
        requestAnimationFrame(() => headingRef.current?.focus());
      } else if (res.status === 400 && data.errors) {
        setErrors(data.errors);
        focusFirst(data.errors);
      } else {
        showBanner(data.error ?? `Something went wrong and Jimmy hasn't seen this. Call or text ${site.phone.display}.`);
      }
    } catch {
      showBanner(`We couldn't reach the server, and Jimmy hasn't seen this. Try again, or call or text ${site.phone.display}.`);
    } finally {
      setSubmitting(false);
    }
  }

  const chosen = getPlanFrequency(form.frequencyId);

  return (
    <>
      <button type="button" className={className} onClick={open} aria-haspopup="dialog">
        {children}
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={`${uid}-title`}
        onClose={onClosed}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className={styles.panel}>
          <button type="button" className={styles.close} onClick={close} aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>

          {sent ? (
            <div className={styles.sent}>
              {sent.demo && <p className={styles.demo}>Demo only. This request didn&rsquo;t go anywhere, and nobody was told about it.</p>}
              <h2 id={`${uid}-title`} ref={headingRef} tabIndex={-1}>
                {sent.demo ? "That’s how a plan request works." : sent.booking ? "Your plan is set up." : "Your plan request is with Jimmy."}
              </h2>
              {sent.booking && booking ? (
                <p>
                  {chosen?.label}, starting with your cleaning on {formatLong(booking.date)}, which is now{" "}
                  <strong>${sent.booking.priceDollars}</strong>. Jimmy will be in touch to confirm the later dates.
                </p>
              ) : (
                <p>
                  {chosen?.label}, at {form.street}, {form.city}. He&rsquo;ll be in touch to confirm your dates.
                </p>
              )}
              <p>Your plan follows the Recurring Plan Terms you agreed to.</p>
              <button type="button" className="btn" onClick={close}>
                Done
              </button>
            </div>
          ) : (
            <form
              noValidate
              aria-busy={submitting}
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <h2 id={`${uid}-title`} ref={headingRef} tabIndex={-1}>
                How often should we clean your gutters?
              </h2>
              <p className={styles.deal}>
                <strong>Every cleaning on a plan is {planRules.discountPercent}% off.</strong> You pay for the whole year up front, in
                one payment after the first cleaning.
              </p>

              <fieldset className={styles.options}>
                <legend className="vh">Cleaning frequency</legend>
                {planFrequencies.map((f) => {
                  const recommended = f.id === recommendedPlan;
                  return (
                    <label key={f.id} className={styles.option} data-recommended={recommended || undefined}>
                      <input
                        type="radio"
                        name={`${uid}-frequency`}
                        checked={form.frequencyId === f.id}
                        onChange={() => set("frequencyId", f.id)}
                        aria-describedby={recommended ? `${uid}-why` : undefined}
                      />
                      <span className={styles.optionText}>
                        <span className={styles.optionName}>
                          {f.label}
                          {recommended && <span className={styles.tag}>Recommended</span>}
                        </span>
                        <span className={styles.optionVisits}>{f.visits}</span>
                        {recommended && (
                          <span id={`${uid}-why`} className={styles.why}>
                            {recommendedWhy}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              <div className={styles.fields}>
                <Field id={`${uid}-street`} label="Street address" error={errors.street} wide>
                  <input autoComplete="address-line1" value={form.street} onChange={(e) => set("street", e.target.value)} />
                </Field>
                <Field id={`${uid}-city`} label="Town" error={errors.city}>
                  <input autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field
                  id={`${uid}-zip`}
                  label="ZIP"
                  error={errors.zip}
                >
                  <input
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={5}
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
                  />
                </Field>
                <Field id={`${uid}-name`} label="Your name" error={errors.name} wide>
                  <input autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field id={`${uid}-phone`} label="Mobile number" error={errors.phone}>
                  <input
                    type="tel"
                    autoComplete="tel-national"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    onBlur={(e) => set("phone", formatPhone(e.target.value))}
                  />
                </Field>
                <Field id={`${uid}-email`} label="Email" error={errors.email}>
                  <input type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
                <Field id={`${uid}-notes`} label={additionalInfo.label} optional wide>
                  <textarea
                    rows={2}
                    placeholder={additionalInfo.placeholder}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </Field>
                <div className={styles.hp} aria-hidden="true">
                  <label>
                    Company
                    <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </label>
                </div>
              </div>

              <PlanAgreement
                id={`${uid}-planTerms`}
                frequencyId={form.frequencyId}
                regularPrice={price?.regular ?? null}
                priceIsFrom={price?.isFrom}
                checked={form.planTerms}
                onChange={(v) => set("planTerms", v)}
                error={errors.planTerms}
              />

              <p ref={bannerRef} tabIndex={-1} role="alert" className={banner ? styles.banner : "vh"}>
                {banner}
              </p>
              <div className={styles.actions}>
                <button type="submit" className="btn btn--sky" disabled={submitting}>
                  {submitting ? "Sending…" : "Send my request"}
                </button>
                <p>This goes to Jimmy, who confirms your dates with you.</p>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

function Field({
  id,
  label,
  error,
  note,
  optional,
  wide,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  note?: string;
  optional?: boolean;
  wide?: boolean;
  children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>;
}) {
  const describedBy = [error ? `${id}-err` : null, note ? `${id}-note` : null].filter(Boolean).join(" ") || undefined;
  const control = cloneElement(children, {
    id,
    name: id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    required: !optional,
  });
  return (
    <div className={`${styles.field} ${wide ? styles.wide : ""}`} data-invalid={error ? "" : undefined}>
      <label htmlFor={id}>
        {label}
        {optional && <span className={styles.optional}> (optional)</span>}
      </label>
      {control}
      {note && !error && (
        <p id={`${id}-note`} className={styles.note}>
          {note}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className={styles.err}>
          {error}
        </p>
      )}
    </div>
  );
}
