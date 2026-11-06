"use client";

import Link from "next/link";
import { cloneElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { BOOK_EVENT, type BookIntent } from "@/components/BookLink";
import { House } from "@/components/pricing/Houses";
import { areaPlaces, serviceZips } from "@/content/area";
import { PlanDialog } from "@/components/plan/PlanDialog";
import { additionalInfo, bookingRules } from "@/content/booking";
import { getPlanFrequency, planFrequencies, recommendedPlan, recommendedWhy } from "@/content/plans";
import { getPackage, packages, rinse, totalFor, type PackageId } from "@/content/pricing";
import { site } from "@/content/site";
import { addDays, addMonths, formatLong, formatShort, monthStart } from "@/lib/booking/dates";
import type { DayDetail, DaySummary } from "@/lib/booking/types";
import { formatPhone, validateContact, type FieldErrors } from "@/lib/booking/validate";
import { fetchDay, fetchRange, submitBooking, type Confirmation, type Meta } from "./api";
import styles from "./Booking.module.css";
import { Calendar } from "./Calendar";
import { buildIcs, downloadIcs } from "./ics";

type Step = 0 | 1 | 2 | 3;
const dayOnly = bookingRules.scheduleMode === "day-only";
const STEPS = ["House", dayOnly ? "Day" : "Day & time", "Address & contact", "Check & book"] as const;

interface Draft {
  packageId: PackageId | null;
  rinse: boolean;
  /** "" means just this once */
  plan: string;
  date: string | null;
  slotId: string | null;
  street: string;
  city: string;
  zip: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  company: string;
}

const EMPTY: Draft = {
  packageId: null,
  rinse: false,
  plan: "",
  date: null,
  slotId: null,
  street: "",
  city: "",
  zip: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
  company: "",
};

const slotLabel = (id: string | null) => bookingRules.slots.find((s) => s.id === id)?.label ?? "";

export function BookingApp({ planRequests = true }: { planRequests?: boolean }) {
  const uid = useId();
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Confirmation | null>(null);

  const [meta, setMeta] = useState<Meta | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [monthDays, setMonthDays] = useState<Map<string, DaySummary> | null>(null);
  const [day, setDay] = useState<DayDetail | null>(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  // One key per attempt to book, so a retried request can't create a second booking.
  const attemptKey = useRef<string | null>(null);
  // Until the customer picks a month, skip past any with nothing open (late in the month, say).
  const seekOpenMonth = useRef(true);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const timesRef = useRef<HTMLFieldSetElement>(null);
  const focusOnStep = useRef(false);

  // Editing a field clears its error, so a fixed field stops showing red straight away.
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      const k = key as keyof FieldErrors;
      if (!e[k]) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });
  };

  const go = useCallback((next: Step) => {
    setBanner(null);
    focusOnStep.current = true;
    setStep(next);
  }, []);

  // After a step change, bring the new step's heading on screen (if it isn't) and focus it,
  // so keyboard and screen-reader users land at the start of the new step.
  useEffect(() => {
    if (!focusOnStep.current) return;
    focusOnStep.current = false;
    const el = headingRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 60 || top > window.innerHeight * 0.55) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
    el.focus({ preventScroll: true });
  }, [step, done]);

  // ---- Preselection from links elsewhere on the page (pricing, hero "next opening") ----
  useEffect(() => {
    const onIntent = (e: Event) => {
      const intent = (e as CustomEvent<BookIntent>).detail ?? {};
      if (done) return;
      setDraft((d) => ({
        ...d,
        packageId: intent.packageId ?? d.packageId,
        date: intent.date ?? d.date,
        slotId: intent.date ? (intent.slotId ?? null) : d.slotId,
      }));
      if (intent.date) setMonth(monthStart(intent.date));
      // A link can preselect the house or day, but booking always starts on the house step.
      if (intent.packageId || intent.date) go(0);
    };
    window.addEventListener(BOOK_EVENT, onIntent);
    return () => window.removeEventListener(BOOK_EVENT, onIntent);
  }, [done, go]);

  // ---- Availability: month view ----
  useEffect(() => {
    if (step !== 1) return;
    const ctrl = new AbortController();
    const load = async () => {
      try {
        setLoadError(false);
        let m = month;
        if (!m) {
          // First visit to this step: ask the server what "today" is in Bucks County.
          const first = await fetchRange(addDays(todayGuess(), 0), addDays(todayGuess(), 0), ctrl.signal);
          setMeta(first.meta);
          m = monthStart(draft.date ?? addDays(first.meta.today, first.meta.minLeadDays));
          setMonth(m);
          return;
        }
        setMonthDays(null);
        const last = addDays(addMonths(m, 1), -1);
        const res = await fetchRange(m, last, ctrl.signal);
        setMeta(res.meta);
        const horizonMonth = monthStart(addDays(res.meta.today, res.meta.horizonDays));
        if (seekOpenMonth.current && !draft.date && m < horizonMonth && !res.days.some((d) => d.status === "open")) {
          setMonth(addMonths(m, 1));
          return;
        }
        seekOpenMonth.current = false;
        setMonthDays(new Map(res.days.map((d) => [d.date, d])));
      } catch (err) {
        if ((err as Error).name !== "AbortError") setLoadError(true);
      }
    };
    load();
    return () => ctrl.abort();
  }, [step, month, retry]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Availability: chosen day's start times (fresh from the server every time) ----
  const loadDay = useCallback(async (date: string, signal?: AbortSignal) => {
    setDayLoading(true);
    try {
      const res = await fetchDay(date, signal);
      setDay(res.day);
      setLoadError(false);
      setDraft((d) => {
        if (d.date !== date || !d.slotId) return d;
        const still = res.day.slots.find((s) => s.id === d.slotId)?.state === "open";
        return still ? d : { ...d, slotId: null };
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") setLoadError(true);
    } finally {
      // An aborted request has been replaced by a newer one, which owns the spinner now.
      if (!signal?.aborted) setDayLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step !== 1 || !draft.date) return;
    const ctrl = new AbortController();
    loadDay(draft.date, ctrl.signal);
    return () => ctrl.abort();
  }, [step, draft.date, loadDay, retry]);

  const pkg = draft.packageId ? getPackage(draft.packageId) : undefined;
  const total = pkg ? totalFor(pkg, draft.rinse) : null;

  // ---- Step transitions with validation ----
  function next() {
    setBanner(null);
    if (step === 0) {
      if (!draft.packageId) {
        setErrors({ packageId: "Pick the house type that fits best." });
        return;
      }
      setErrors({});
      go(1);
    } else if (step === 1) {
      if (!draft.date || (!dayOnly && !draft.slotId)) {
        setErrors({ slotId: !draft.date ? "Pick a day first." : "Pick a start time." });
        return;
      }
      // In day-only mode the day also has to still be open.
      if (dayOnly && day?.date === draft.date && day.status !== "open") {
        setErrors({ slotId: "That day just filled up. Pick another." });
        return;
      }
      setErrors({});
      go(2);
    } else if (step === 2) {
      const errs = validateContact(draft);
      setErrors(errs);
      const first = Object.keys(errs)[0];
      if (first) {
        document.getElementById(`${uid}-${first}`)?.focus();
        return;
      }
      go(3);
    }
  }

  async function submit() {
    if (submitting || !draft.packageId || !draft.date || (!dayOnly && !draft.slotId)) return;
    setSubmitting(true);
    setBanner(null);
    attemptKey.current ??= crypto.randomUUID();
    const result = await submitBooking({
      idempotencyKey: attemptKey.current,
      packageId: draft.packageId,
      rinse: draft.rinse,
      planFrequencyId: draft.plan,
      date: draft.date,
      slotId: draft.slotId ?? "",
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      street: draft.street,
      city: draft.city,
      zip: draft.zip,
      notes: draft.notes,
      company: draft.company,
    });
    setSubmitting(false);

    if (result.kind === "ok") {
      focusOnStep.current = true;
      attemptKey.current = null;
      setDone(result.booking);
      return;
    }
    // Anything else was refused, so the next try is a new attempt. A network error is the one
    // exception: that request may have gone through, and the same key finds it if it did.
    if (result.kind !== "error") attemptKey.current = null;
    if (result.kind === "conflict") {
      setDay(result.day);
      setMonthDays((m) => {
        if (!m) return m;
        const copy = new Map(m);
        const { slots: _s, ...summary } = result.day;
        copy.set(result.day.date, summary);
        return copy;
      });
      setDraft((d) => ({ ...d, slotId: null, date: result.code === "slot_taken" ? d.date : null }));
      go(1);
      setBanner(result.message);
      return;
    }
    if (result.kind === "invalid") {
      setErrors(result.errors);
      const keys = Object.keys(result.errors);
      if (keys.some((k) => k === "packageId")) go(0);
      else if (keys.some((k) => k === "date" || k === "slotId")) go(1);
      else go(2);
      setBanner("A couple of details need another look.");
      return;
    }
    setBanner(`${result.message} Or call or text ${site.phone.display} and we'll book you by hand.`);
  }

  function reset() {
    setDraft(EMPTY);
    attemptKey.current = null;
    setDone(null);
    setDay(null);
    setErrors({});
    go(0);
  }

  // ---------------------------------------------------------------- render

  if (done)
    return (
      <Done booking={done} name={draft.name} phone={draft.phone} onAnother={reset} headingRef={headingRef} planRequests={planRequests} />
    );

  const minMonth = meta ? monthStart(addDays(meta.today, meta.minLeadDays)) : null;
  const maxMonth = meta ? monthStart(addDays(meta.today, meta.horizonDays)) : null;
  const zipOutside = /^\d{5}$/.test(draft.zip) && !serviceZips.has(draft.zip);

  return (
    <div className={styles.app}>
      <ol className={styles.progress}>
        {STEPS.map((label, i) => {
          const state = i < step ? "done" : i === step ? "now" : "todo";
          return (
            <li key={label} data-state={state}>
              {i < step ? (
                <button type="button" onClick={() => go(i as Step)}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <span className={styles.stepLabel}>{label}</span>
                  <span className="vh"> (done, edit)</span>
                </button>
              ) : (
                <span aria-current={i === step ? "step" : undefined}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <span className={styles.stepLabel}>{label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className={styles.body}>
        <div className={styles.main}>
          <div role="status" aria-live="assertive" className={banner ? styles.banner : "vh"}>
            {banner}
          </div>

          <div key={step} className={styles.stepPane}>
            {/* ---------------- 1. House ---------------- */}
            {step === 0 && (
              <fieldset className={styles.fieldset} aria-describedby={errors.packageId ? `${uid}-pkg-err` : undefined}>
                <legend>
                  <h3 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
                    Which one looks like your house?
                  </h3>
                </legend>
                <div className={styles.houses}>
                  {packages.map((p) => (
                    <label key={p.id} className={styles.houseOpt}>
                      <input
                        type="radio"
                        name={`${uid}-pkg`}
                        value={p.id}
                        checked={draft.packageId === p.id}
                        onChange={() => {
                          set("packageId", p.id);
                          setErrors({});
                        }}
                      />
                      <House shape={p.shape} className={styles.houseSvg} />
                      <span className={styles.houseText}>
                        <span className={styles.houseName}>{p.name}</span>
                        <span className={styles.houseFits}>{p.fits}</span>
                      </span>
                      <span className={styles.housePrice}>
                        {p.isFrom && <small>from </small>}${p.price}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.packageId && (
                  <p id={`${uid}-pkg-err`} className={styles.err}>
                    {errors.packageId}
                  </p>
                )}
                {pkg?.needsQuote && (
                  <p className={styles.hint}>
                    For bigger houses we confirm the final price with you before the visit. Booking {dayOnly ? "a day" : "a time"} now
                    just holds your spot.
                  </p>
                )}

                <label className={styles.rinseOpt}>
                  <input type="checkbox" checked={draft.rinse} onChange={(e) => set("rinse", e.target.checked)} />
                  <span>
                    <strong>
                      Add a rinse, +${rinse.price}
                      {rinse.regularPrice && <span className={styles.was}> (normally ${rinse.regularPrice})</span>}
                    </strong>
                    <span className={styles.rinseText}>{rinse.short}</span>
                  </span>
                </label>

                <fieldset className={styles.repeat} aria-describedby={`${uid}-repeat-why`}>
                  <legend>Want this on a schedule?</legend>
                  <div className={styles.repeatOpts}>
                    {[{ id: "", label: "Just this once" }, ...planFrequencies].map((f) => (
                      <label key={f.id} className={styles.repeatOpt}>
                        <input type="radio" name={`${uid}-plan`} checked={draft.plan === f.id} onChange={() => set("plan", f.id)} />
                        <span>
                          {f.label}
                          {f.id === recommendedPlan && <span className={styles.repeatTag}>Recommended</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p id={`${uid}-repeat-why`} className={styles.repeatWhy}>
                    {recommendedWhy} Nothing bills automatically. Jimmy sets up a plan with you.
                  </p>
                </fieldset>
              </fieldset>
            )}

            {/* ---------------- 2. Day & time ---------------- */}
            {step === 1 && (
              <div>
                <h3 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
                  {dayOnly ? "Pick a day" : "Pick a day, then a start time"}
                </h3>
                {meta?.demo && <DemoNote />}
                {loadError && (
                  <p className={styles.err}>
                    We couldn&rsquo;t load the schedule.{" "}
                    <button type="button" className={styles.linkBtn} onClick={() => setRetry((n) => n + 1)}>
                      Try again
                    </button>{" "}
                    or call {site.phone.display}.
                  </p>
                )}
                <div className={styles.when}>
                  {month && meta ? (
                    <Calendar
                      month={month}
                      days={monthDays}
                      selected={draft.date}
                      today={meta.today}
                      maxPerDay={meta.maxJobsPerDay}
                      canPrev={!!minMonth && month > minMonth}
                      canNext={!!maxMonth && month < maxMonth}
                      onMonth={(delta) => {
                        seekOpenMonth.current = false;
                        setMonth(addMonths(month, delta));
                      }}
                      onSelect={(date) => {
                        setDraft((d) => ({ ...d, date, slotId: d.date === date ? d.slotId : null }));
                        setErrors({});
                        setBanner(null);
                        // With start times to pick next, phones scroll down to them. Otherwise stay put.
                        if (!dayOnly && window.matchMedia("(max-width: 899px)").matches) {
                          requestAnimationFrame(() =>
                            timesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                          );
                        }
                      }}
                    />
                  ) : (
                    <div className={styles.calLoading} aria-busy="true">
                      <span className="vh">Checking the schedule…</span>
                      <div className={styles.skHead} aria-hidden="true">
                        <span className="skel" />
                      </div>
                      <div className={styles.skGrid} aria-hidden="true">
                        {Array.from({ length: 35 }, (_, i) => (
                          <span key={i} className="skel" />
                        ))}
                      </div>
                    </div>
                  )}

                  {dayOnly ? (
                    <div className={styles.times} ref={timesRef as React.Ref<HTMLDivElement>}>
                      <p className={styles.timesTitle}>{draft.date ? formatShort(draft.date) : "What to expect"}</p>
                      <ul className={styles.dayOnlyNotes}>
                        <li>We don&rsquo;t normally give an exact arrival time. If you need one, ask in the additional information box on the next step.</li>
                        <li>You don&rsquo;t need to be home.</li>
                        <li>An invoice follows once the work is done.</li>
                      </ul>
                      {errors.slotId && <p className={styles.err} role="alert">{errors.slotId}</p>}
                    </div>
                  ) : (
                  <fieldset ref={timesRef} className={styles.times} aria-busy={dayLoading}>
                    <legend className={styles.timesTitle}>
                      {draft.date ? `Start times, ${formatShort(draft.date)}` : "Start times"}
                    </legend>
                    {!draft.date && <p className={styles.timesEmpty}>Pick a day to see its open times.</p>}
                    {draft.date && dayLoading && !day && <p className={styles.timesEmpty}>Checking…</p>}
                    {draft.date && day && day.date === draft.date && (
                      <div className={styles.slotList} data-loading={dayLoading || undefined}>
                        {day.slots.map((s) => {
                          const open = s.state === "open";
                          return (
                            <label key={s.id} className={styles.slot} data-state={s.state}>
                              <input
                                type="radio"
                                name={`${uid}-slot`}
                                value={s.id}
                                disabled={!open}
                                checked={draft.slotId === s.id}
                                onChange={() => {
                                  set("slotId", s.id);
                                  setErrors({});
                                }}
                              />
                              <span className={styles.slotTime}>{s.label}</span>
                              <span className={styles.slotState}>
                                {open ? s.part : s.state === "taken" ? "Booked" : s.state === "closed" ? "Closed" : "Day's full"}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {errors.slotId && <p className={styles.err} role="alert">{errors.slotId}</p>}
                  </fieldset>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- 3. Address & contact ---------------- */}
            {step === 2 && (
              <div>
                <h3 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
                  Where&rsquo;s the house, and who do we talk to?
                </h3>
                <div className={styles.form}>
                  <Field id={`${uid}-street`} label="Street address" error={errors.street} wide>
                    <input
                      autoComplete="address-line1"
                      value={draft.street}
                      onChange={(e) => set("street", e.target.value)}
                    />
                  </Field>
                  <Field id={`${uid}-city`} label="Town" error={errors.city}>
                    <input
                      autoComplete="address-level2"
                      list={`${uid}-towns`}
                      value={draft.city}
                      onChange={(e) => set("city", e.target.value)}
                    />
                  </Field>
                  <datalist id={`${uid}-towns`}>
                    {areaPlaces.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                  <Field
                    id={`${uid}-zip`}
                    label="ZIP"
                    error={errors.zip}
                    note={zipOutside ? "That's outside our usual area. Book anyway and we'll confirm we can make it." : undefined}
                  >
                    <input
                      autoComplete="postal-code"
                      inputMode="numeric"
                      maxLength={5}
                      value={draft.zip}
                      onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
                    />
                  </Field>
                  <Field id={`${uid}-name`} label="Your name" error={errors.name} wide>
                    <input autoComplete="name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
                  </Field>
                  <Field id={`${uid}-phone`} label="Mobile number" error={errors.phone}>
                    <input
                      type="tel"
                      autoComplete="tel-national"
                      inputMode="tel"
                      value={draft.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      onBlur={(e) => set("phone", formatPhone(e.target.value))}
                    />
                  </Field>
                  <Field id={`${uid}-email`} label="Email" error={errors.email} note="Your confirmation goes here.">
                    <input
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={draft.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </Field>
                  <Field id={`${uid}-notes`} label={additionalInfo.label} note={additionalInfo.note} optional wide>
                    <textarea
                      rows={3}
                      placeholder={additionalInfo.placeholder}
                      value={draft.notes}
                      onChange={(e) => set("notes", e.target.value)}
                    />
                  </Field>
                  <div className={styles.hp} aria-hidden="true">
                    <label>
                      Company
                      <input
                        tabIndex={-1}
                        autoComplete="off"
                        value={draft.company}
                        onChange={(e) => set("company", e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 4. Check & book ---------------- */}
            {step === 3 && pkg && draft.date && (dayOnly || draft.slotId) && (
              <div>
                <h3 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
                  Look it over, then book
                </h3>
                <dl className={styles.review}>
                  <div>
                    <dt>House</dt>
                    <dd>
                      {pkg.name}
                      {draft.rinse && ", with a rinse"}
                    </dd>
                    <button type="button" className={styles.linkBtn} onClick={() => go(0)}>
                      Change
                    </button>
                  </div>
                  <div>
                    <dt>Schedule</dt>
                    <dd>{getPlanFrequency(draft.plan)?.label ?? "Just this once"}</dd>
                    <button type="button" className={styles.linkBtn} onClick={() => go(0)}>
                      Change
                    </button>
                  </div>
                  <div>
                    <dt>When</dt>
                    <dd>
                      {formatLong(draft.date)}
                      {!dayOnly && `, ${slotLabel(draft.slotId)}`}
                    </dd>
                    <button type="button" className={styles.linkBtn} onClick={() => go(1)}>
                      Change
                    </button>
                  </div>
                  <div>
                    <dt>Where</dt>
                    <dd>
                      {draft.street}, {draft.city} {draft.zip}
                    </dd>
                    <button type="button" className={styles.linkBtn} onClick={() => go(2)}>
                      Change
                    </button>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>
                      {draft.name}, {formatPhone(draft.phone)}, {draft.email}
                    </dd>
                    <button type="button" className={styles.linkBtn} onClick={() => go(2)}>
                      Change
                    </button>
                  </div>
                  {draft.notes && (
                    <div>
                      <dt>Additional info</dt>
                      <dd>{draft.notes}</dd>
                    </div>
                  )}
                </dl>
                <p className={styles.totalLine}>
                  <span>{pkg.needsQuote ? "Starting at" : "Total"}</span>
                  <strong>${total}</strong>
                </p>
                <ul className={styles.fine}>
                  <li>Nothing is charged now. We invoice after the cleaning.</li>
                  <li>
                    Free to cancel or move with {site.policies.freeRescheduleHours} hours&rsquo; notice.
                    {site.policies.lateCancelFeeDollars !== null &&
                      ` Inside ${site.policies.freeRescheduleHours} hours, a cancellation may cost $${site.policies.lateCancelFeeDollars}.`}{" "}
                    Bad weather means we reschedule at no cost.
                  </li>
                  {dayOnly && <li>We don&rsquo;t normally give an exact arrival time, and you don&rsquo;t need to be home.</li>}
                  {pkg.needsQuote && <li>We&rsquo;ll confirm the final price with you before the visit.</li>}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            {step > 0 ? (
              <button type="button" className={styles.back} onClick={() => go((step - 1) as Step)}>
                ← Back
              </button>
            ) : (
              <span />
            )}
            {total !== null && (
              <span className={styles.actTotal} aria-hidden="true">
                {pkg?.isFrom ? "from " : ""}${total}
              </span>
            )}
            {step < 3 ? (
              <button type="button" className="btn" onClick={next}>
                {step === 0 ? "Choose a day" : step === 1 ? "Add your address" : "Review"}
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </button>
            ) : (
              <button type="button" className="btn btn--sky" onClick={submit} disabled={submitting} aria-busy={submitting}>
                {submitting
                  ? "Checking the schedule…"
                  : `Book ${draft.date ? formatShort(draft.date) : ""}${dayOnly ? "" : `, ${slotLabel(draft.slotId)}`}`}
              </button>
            )}
          </div>
        </div>

        {/* Running summary, like a work order filling in */}
        <aside className={styles.ticket} aria-label="Your booking so far">
          <p className={styles.ticketHead}>Work order</p>
          <dl>
            <div>
              <dt>House</dt>
              <dd>{pkg ? pkg.name : "—"}</dd>
              <dd className={styles.amt}>{pkg ? `${pkg.isFrom ? "from " : ""}$${pkg.price}` : ""}</dd>
            </div>
            {draft.rinse && (
              <div>
                <dt>Rinse</dt>
                <dd>Yes</dd>
                <dd className={styles.amt}>+${rinse.price}</dd>
              </div>
            )}
            {draft.plan && (
              <div>
                <dt>Schedule</dt>
                <dd>{getPlanFrequency(draft.plan)?.label}</dd>
              </div>
            )}
            <div>
              <dt>Day</dt>
              <dd>{draft.date ? formatShort(draft.date) : "—"}</dd>
            </div>
            {!dayOnly && (
              <div>
                <dt>Start</dt>
                <dd>{draft.slotId ? slotLabel(draft.slotId) : "—"}</dd>
              </div>
            )}
            <div>
              <dt>Where</dt>
              <dd>{draft.street && draft.city ? `${draft.street}, ${draft.city}` : "—"}</dd>
            </div>
          </dl>
          <p className={styles.ticketTotal}>
            <span>{pkg?.needsQuote ? "From" : "Total"}</span>
            <strong>{total !== null ? `$${total}` : "—"}</strong>
          </p>
          <p className={styles.ticketNote}>Paid after the job.</p>
        </aside>
      </div>
    </div>
  );
}

/** Rough local "today" just to make the first request; the server's answer replaces it. */
function todayGuess() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function DemoNote({ done }: { done?: boolean }) {
  return (
    <p className={styles.demoNote}>
      {done
        ? "Demo only. This isn't a real booking, and nobody was told about it."
        : `Demo schedule. Some days are filled with sample bookings, and nothing you book here is real. To book, call or text ${site.phone.display}.`}
    </p>
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

function Done({
  booking,
  name,
  phone,
  onAnother,
  headingRef,
  planRequests,
}: {
  booking: Confirmation;
  name: string;
  phone: string;
  onAnother: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  planRequests: boolean;
}) {
  const pkg = getPackage(booking.packageId);
  const address = `${booking.address.street}, ${booking.address.city}, PA ${booking.address.zip}`;
  return (
    <div className={`${styles.app} ${styles.done}`}>
      {booking.demo && <DemoNote done />}
      <p className={styles.doneRef}>Booking {booking.ref}</p>
      <h3 ref={headingRef} tabIndex={-1} className={styles.doneTitle}>
        {booking.demo ? "That\u2019s how booking works." : "You\u2019re on the schedule."}
      </h3>
      <p className={styles.doneWhen}>
        {formatLong(booking.date)}
        {!dayOnly && `, ${slotLabel(booking.slotId)}`}
        <br />
        <span>{address}</span>
      </p>
      <dl className={styles.doneFacts}>
        <div>
          <dt>House</dt>
          <dd>
            {pkg?.name}
            {booking.rinse ? ", with a rinse" : ""}
          </dd>
        </div>
        <div>
          <dt>{booking.priceIsEstimate ? "Starting at" : "Total"}</dt>
          <dd>${booking.priceDollars}, invoiced after</dd>
        </div>
      </dl>
      <h4 className={styles.nextTitle}>What happens now</h4>
      <ol className={styles.nextList}>
        {booking.emailSent ? (
          <li>A confirmation email is on its way to {booking.email}.</li>
        ) : (
          !booking.demo && <li>Keep this reference number. We&rsquo;ll be in touch at {booking.email} if anything changes.</li>
        )}
        <li>On the day, we clean. You don&rsquo;t need to be home if we can reach the gutters.</li>
        <li>Photos and the invoice come after.</li>
        {booking.planLabel && (
          <li>
            You asked for a recurring plan: {booking.planLabel.toLowerCase()}. Jimmy will be in touch to set it up. Nothing bills
            automatically.
          </li>
        )}
      </ol>
      <div className={styles.doneActions}>
        <button
          type="button"
          className="btn btn--sky"
          onClick={() =>
            downloadIcs(
              `keystone-${booking.date}.ics`,
              buildIcs({ ref: booking.ref, date: booking.date, slotId: dayOnly ? null : booking.slotId, address }),
            )
          }
        >
          Add to my calendar
        </button>
        {!booking.planLabel && planRequests && (
          <PlanDialog className="btn" initial={{ ...booking.address, name, phone, email: booking.email }}>
            Make it recurring
          </PlanDialog>
        )}
        <button type="button" className={styles.back} onClick={onAnother}>
          Book another house
        </button>
      </div>
      <p className={styles.doneFoot}>
        Need to change something? Call or text {site.phone.display}.{" "}
        <Link href="/referred" className="textlink">
          Send a neighbor our way
        </Link>
      </p>
    </div>
  );
}
