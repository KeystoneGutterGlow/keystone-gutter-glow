"use client";

import { useId, useRef, useState } from "react";
import { referralPaths, referralRewards, referralRules, type ReferralReward } from "@/content/referral";
import { site } from "@/content/site";
import { formatPhone } from "@/lib/booking/validate";
import { sendNotice, type Notice } from "@/lib/notify/notice";
import { REFERRAL_FIELDS, validateReferral, type ReferralFieldErrors, type ReferralRequest } from "@/lib/referral/validate";
import styles from "./ReferForm.module.css";

// The "Refer someone" form on /refer. The server checks it (/api/referrals), then this sends the
// referral to Jimmy through FormSubmit. The email is the only record, so it only says "sent" once
// FormSubmit confirms it.

const EMPTY: ReferralRequest = {
  name: "",
  phone: "",
  email: "",
  reward: "",
  friendName: "",
  friendPhone: "",
  friendEmail: "",
  friendTown: "",
  notes: "",
  consent: false,
};

const first = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export function ReferForm() {
  const uid = useId();
  const [form, setForm] = useState<ReferralRequest>(EMPTY);
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<ReferralFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [sent, setSent] = useState<{ demo: boolean; friend: string; reward: ReferralReward; code?: string } | null>(null);
  const bannerRef = useRef<HTMLParagraphElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);

  const set = <K extends keyof ReferralRequest>(key: K, value: ReferralRequest[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  function focusFirst(errs: ReferralFieldErrors) {
    const k = REFERRAL_FIELDS.find((f) => errs[f]);
    if (k) document.getElementById(`${uid}-${k}`)?.focus();
  }

  function showBanner(message: string) {
    setBanner(message);
    requestAnimationFrame(() => bannerRef.current?.focus());
  }

  async function submit() {
    if (submitting) return;
    setBanner(null);
    const errs = validateReferral(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      focusFirst(errs);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20_000),
        body: JSON.stringify({ ...form, company }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        demo?: boolean;
        /** Demo only: the friend's code, which Jimmy would normally send them */
        code?: string;
        notice?: Notice;
        errors?: ReferralFieldErrors;
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
        setSent({ demo: data.demo === true, friend: form.friendName, reward: form.reward as ReferralReward, code: data.code });
        requestAnimationFrame(() => sentRef.current?.focus());
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

  // Another referral keeps the customer's own details and their choice of thank-you.
  function another() {
    setForm((f) => ({ ...EMPTY, name: f.name, phone: f.phone, email: f.email, reward: f.reward }));
    setSent(null);
    requestAnimationFrame(() => document.getElementById(`${uid}-friendName`)?.focus());
  }

  if (sent) {
    const friend = first(sent.friend);
    return (
      <div className={styles.form}>
        <div className={styles.sent} role="status">
          {sent.demo && <p className={styles.demo}>Demo only. This referral didn&rsquo;t go anywhere, and nobody was told about it.</p>}
          <h3 ref={sentRef} tabIndex={-1}>
            {sent.demo ? "That’s how a referral works." : `Thanks, ${first(form.name)}. Jimmy has your referral.`}
          </h3>
          <p>
            He&rsquo;ll get in touch with {friend} and send them their own link, which takes ${referralRules.friendDiscount} off
            their cleaning.
          </p>
          {sent.demo && sent.code && (
            <p className={styles.demo}>
              The link Jimmy would send:{" "}
              <a href={`${referralPaths.friend}/${sent.code}`} target="_blank" rel="noopener">
                {referralPaths.friend}/{sent.code}
              </a>
            </p>
          )}
          <p>
            {sent.reward === "plan"
              ? `Jimmy will call you to set up your $${referralRules.planCredit} off a recurring plan. It's yours once ${friend} has booked and we've cleaned their gutters.`
              : `Your $${referralRules.cashReward} comes once ${friend} has booked and we've cleaned their gutters.`}
          </p>
          <button type="button" className="btn btn--sky" onClick={another}>
            Refer someone else
          </button>
        </div>
      </div>
    );
  }

  const err = (k: keyof ReferralRequest) =>
    errors[k] ? (
      <p id={`${uid}-${k}-err`} className={styles.err}>
        {errors[k]}
      </p>
    ) : null;
  const a11y = (k: keyof ReferralRequest, note?: boolean) => ({
    id: `${uid}-${k}`,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": [errors[k] ? `${uid}-${k}-err` : null, note ? `${uid}-${k}-note` : null].filter(Boolean).join(" ") || undefined,
  });
  const friend = first(form.friendName);

  return (
    <form
      className={styles.form}
      noValidate
      aria-busy={submitting}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <fieldset className={styles.group}>
        <legend>You</legend>
        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.wide}`} data-invalid={errors.name ? "" : undefined}>
            <label htmlFor={`${uid}-name`}>Your name</label>
            <input {...a11y("name")} autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            {err("name")}
          </div>
          <div className={styles.field} data-invalid={errors.phone ? "" : undefined}>
            <label htmlFor={`${uid}-phone`}>Your phone</label>
            <input
              {...a11y("phone")}
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              onBlur={(e) => set("phone", formatPhone(e.target.value))}
            />
            {err("phone")}
          </div>
          <div className={styles.field} data-invalid={errors.email ? "" : undefined}>
            <label htmlFor={`${uid}-email`}>
              Your email <span className={styles.optional}>(optional)</span>
            </label>
            <input
              {...a11y("email")}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {err("email")}
          </div>
        </div>
      </fieldset>

      <fieldset
        className={styles.group}
        data-invalid={errors.reward ? "" : undefined}
        aria-describedby={errors.reward ? `${uid}-reward-err` : undefined}
      >
        <legend>Your thank-you</legend>
        <div className={styles.rewards}>
          {(Object.keys(referralRewards) as ReferralReward[]).map((r) => (
            <label key={r} className={styles.reward}>
              <input
                type="radio"
                name={`${uid}-reward`}
                id={r === "cash" ? `${uid}-reward` : undefined}
                checked={form.reward === r}
                onChange={() => set("reward", r)}
              />
              <span>
                <strong>{referralRewards[r].label}</strong>
                <span className={styles.rewardDetail}>{referralRewards[r].detail}</span>
              </span>
            </label>
          ))}
        </div>
        {err("reward")}
        {form.reward === "plan" && (
          <p className={styles.callNote} role="status">
            Jimmy will call you{form.phone ? ` at ${formatPhone(form.phone)}` : ""} to set up your $
            {referralRules.planCredit} off a recurring plan.
          </p>
        )}
        <p className={styles.when}>Either one is paid after they&rsquo;ve booked and we&rsquo;ve cleaned their gutters.</p>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>Who you&rsquo;re referring</legend>
        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.wide}`} data-invalid={errors.friendName ? "" : undefined}>
            <label htmlFor={`${uid}-friendName`}>Their name</label>
            <input {...a11y("friendName")} autoComplete="off" value={form.friendName} onChange={(e) => set("friendName", e.target.value)} />
            {err("friendName")}
          </div>
          <div className={styles.field} data-invalid={errors.friendPhone ? "" : undefined}>
            <label htmlFor={`${uid}-friendPhone`}>Their phone</label>
            <input
              {...a11y("friendPhone", true)}
              type="tel"
              autoComplete="off"
              inputMode="tel"
              value={form.friendPhone}
              onChange={(e) => set("friendPhone", e.target.value)}
              onBlur={(e) => e.target.value && set("friendPhone", formatPhone(e.target.value))}
            />
            {err("friendPhone") ?? (
              <p id={`${uid}-friendPhone-note`} className={styles.note}>
                Their phone or email, or both.
              </p>
            )}
          </div>
          <div className={styles.field} data-invalid={errors.friendEmail ? "" : undefined}>
            <label htmlFor={`${uid}-friendEmail`}>Their email</label>
            <input
              {...a11y("friendEmail")}
              type="email"
              autoComplete="off"
              inputMode="email"
              value={form.friendEmail}
              onChange={(e) => set("friendEmail", e.target.value)}
            />
            {err("friendEmail")}
          </div>
          <div className={`${styles.field} ${styles.wide}`}>
            <label htmlFor={`${uid}-friendTown`}>
              Their town <span className={styles.optional}>(optional)</span>
            </label>
            <input {...a11y("friendTown")} autoComplete="off" value={form.friendTown} onChange={(e) => set("friendTown", e.target.value)} />
          </div>
          <div className={`${styles.field} ${styles.wide}`}>
            <label htmlFor={`${uid}-notes`}>
              Anything Jimmy should know? <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              {...a11y("notes")}
              rows={2}
              placeholder="Best time to call, how you know them…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
        <div className={styles.hp} aria-hidden="true">
          <label>
            Company
            <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
        </div>
      </fieldset>

      <div className={styles.consent} data-invalid={errors.consent ? "" : undefined}>
        <label className={styles.check}>
          <input
            {...a11y("consent")}
            type="checkbox"
            checked={form.consent}
            onChange={(e) => set("consent", e.target.checked)}
          />
          <span>
            {friend || "They"} know{friend ? "s" : ""} I&rsquo;m passing on their details, and they&rsquo;re happy to hear
            from Jimmy about a cleaning.
          </span>
        </label>
        {err("consent")}
      </div>

      <p ref={bannerRef} tabIndex={-1} role="alert" className={banner ? styles.banner : "vh"}>
        {banner}
      </p>
      <button type="submit" className="btn btn--sky btn--wide" disabled={submitting}>
        {submitting ? "Sending it to Jimmy…" : "Send referral"}
      </button>
      <p className={styles.fine}>
        We only use their details to get in touch about a cleaning. See our{" "}
        <a href="/privacy" target="_blank" rel="noopener">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
