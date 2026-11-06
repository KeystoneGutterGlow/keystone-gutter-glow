"use client";

import { cloneElement, useEffect, useId, useMemo, useRef, useState } from "react";
import { firewood, firewoodExtras, firewoodMethods, firewoodProducts, type DeliveryMethodId, type ExtraId, type ProductId } from "@/content/firewood";
import { site } from "@/content/site";
import { formatLong, isISODate, todayIn } from "@/lib/booking/dates";
import { formatPhone } from "@/lib/booking/validate";
import { formatCents, priceOrder, type PriceLine } from "@/lib/firewood/pricing";
import { deliveryWindow, validateOrder, type OrderDraft, type OrderFieldErrors } from "@/lib/firewood/validate";
import styles from "./Firewood.module.css";
import { PICK_EVENT } from "./PickLink";

// The firewood order form. Prices come from the same function the server uses, but the server
// recalculates everything and Stripe only ever sees the server's total. Card details are entered
// on Stripe's hosted page, never here.

interface Status {
  open: boolean;
  mode: "off" | "test" | "live";
  demoStore: boolean;
  today: string;
}

const DRAFT_KEY = "kgw-order-draft";

const EMPTY: OrderDraft = {
  productId: "",
  methodId: "stacked",
  extras: [],
  deliveryDate: "",
  street: "",
  city: "",
  zip: "",
  name: "",
  phone: "",
  email: "",
  instructions: "",
};

const FIELD_ORDER: Array<keyof OrderDraft> = [
  "productId",
  "methodId",
  "deliveryDate",
  "street",
  "city",
  "zip",
  "instructions",
  "name",
  "phone",
  "email",
];

/** Storage can throw in private windows. The draft is only a convenience, so ignore that. */
function saveDraft(draft: OrderDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

function loadDraft(): OrderDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<OrderDraft>) } : null;
  } catch {
    return null;
  }
}

/** Rendered on the "payment received" page. */
export function ClearOrderDraft() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, []);
  return null;
}

export function OrderForm() {
  const uid = useId();
  const [draft, setDraft] = useState<OrderDraft>(EMPTY);
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<OrderFieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [statusFailed, setStatusFailed] = useState(false);
  const [restored, setRestored] = useState(false);
  const attemptKey = useRef<string | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  useEffect(() => {
    const saved = loadDraft();
    if (saved) setDraft(saved);
    setRestored(true);
    if (new URLSearchParams(window.location.search).get("checkout") === "canceled") {
      setNotice("Checkout canceled and nothing was charged. Your order is still filled in below.");
    }

    const ctrl = new AbortController();
    fetch("/api/firewood/status", { cache: "no-store", signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<Status>) : Promise.reject(new Error(String(r.status)))))
      .then(setStatus)
      .catch((err) => {
        if ((err as Error).name !== "AbortError") setStatusFailed(true);
      });

    const onPick = (e: Event) => {
      const productId = (e as CustomEvent<ProductId>).detail;
      setDraft((d) => ({ ...d, productId }));
      setErrors((er) => ({ ...er, productId: undefined }));
    };
    window.addEventListener(PICK_EVENT, onPick);
    return () => {
      ctrl.abort();
      window.removeEventListener(PICK_EVENT, onPick);
    };
  }, []);

  useEffect(() => {
    if (restored) saveDraft(draft);
  }, [draft, restored]);

  const today = status?.today ?? todayIn(firewood.timeZone);
  const window_ = deliveryWindow(today);

  const priced = useMemo(
    () =>
      draft.productId
        ? priceOrder({
            productId: draft.productId as ProductId,
            methodId: draft.methodId as DeliveryMethodId,
            extras: draft.extras as ExtraId[],
          })
        : null,
    [draft.productId, draft.methodId, draft.extras],
  );
  const [serverLines, setServerLines] = useState<{ lines: PriceLine[]; totalCents: number } | null>(null);
  const shown = serverLines ?? priced;

  function toggleExtra(id: string, on: boolean) {
    setDraft((d) => ({ ...d, extras: on ? [...d.extras, id] : d.extras.filter((e) => e !== id) }));
  }

  function showBanner(message: string) {
    setBanner(message);
    requestAnimationFrame(() => bannerRef.current?.focus());
  }

  async function submit() {
    if (submitting) return;
    setBanner(null);
    setNotice(null);

    const errs = validateOrder(draft, today);
    setErrors(errs);
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (first) {
      const el = document.getElementById(`${uid}-${first}`) ?? document.querySelector<HTMLElement>(`[data-field="${first}"] input`);
      el?.focus();
      showBanner("A few details need another look. They're marked below.");
      el?.focus();
      return;
    }

    setSubmitting(true);
    attemptKey.current ??= crypto.randomUUID();
    try {
      const res = await fetch("/api/firewood/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          ...draft,
          company,
          idempotencyKey: attemptKey.current,
          expectedTotalCents: priced?.totalCents,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        errors?: OrderFieldErrors;
        error?: string;
        message?: string;
        code?: string;
        lines?: PriceLine[];
        totalCents?: number;
      };

      if (res.ok && data.url) {
        // Leave `submitting` on: the page is about to change.
        window.location.assign(data.url);
        return;
      }
      setSubmitting(false);
      if (res.status === 400 && data.errors) {
        setErrors(data.errors);
        showBanner("A few details need another look. They're marked below.");
      } else if (res.status === 409 && data.code === "price_changed" && data.lines && data.totalCents) {
        setServerLines({ lines: data.lines, totalCents: data.totalCents });
        showBanner(data.message ?? "The price changed. Check the new total.");
      } else {
        showBanner(data.error ?? `Something went wrong and nothing was charged. Call or text ${site.phone.display}.`);
      }
    } catch {
      setSubmitting(false);
      showBanner(`We couldn't reach the server, and nothing was charged. Check your connection and try again, or call ${site.phone.display}.`);
    }
  }

  const checkoutOpen = status?.open === true;
  const payLabel = submitting ? "Opening secure checkout…" : "Continue to payment";
  const payDisabled = submitting || !checkoutOpen;

  const payState = !status && !statusFailed ? (
    <p className={styles.payNote}>Checking whether online payment is open…</p>
  ) : !checkoutOpen ? (
    <p className={styles.payNote}>
      Online payment isn&rsquo;t open yet. Call or text <a href={site.phone.href}>{site.phone.display}</a> and we&rsquo;ll take
      your order by hand.
    </p>
  ) : status?.mode === "test" ? (
    <p className={styles.testNote}>
      Stripe test mode. No real charge. Use card 4242 4242 4242 4242 with any future date and any CVC.
    </p>
  ) : (
    <p className={styles.payNote}>You&rsquo;ll enter your card on Stripe&rsquo;s secure page. Card details never reach this site.</p>
  );

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
      <div className={styles.formMain}>
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
        <div ref={bannerRef} tabIndex={-1} role="alert" className={banner ? styles.banner : "vh"}>
          {banner}
        </div>

        <fieldset className={styles.group} data-field="productId" aria-describedby={errors.productId ? `${uid}-productId-err` : undefined}>
          <legend>How much wood?</legend>
          <div className={styles.sizeOpts}>
            {firewoodProducts.map((p) => (
              <label key={p.id} className={styles.opt}>
                <input
                  type="radio"
                  name={`${uid}-product`}
                  checked={draft.productId === p.id}
                  onChange={() => set("productId", p.id)}
                />
                <span className={styles.optName}>{p.name}</span>
                <span className={styles.optDetail}>{p.logs}</span>
                <span className={styles.optPrice}>${p.price}</span>
              </label>
            ))}
          </div>
          {errors.productId && (
            <p id={`${uid}-productId-err`} className={styles.err}>
              {errors.productId}
            </p>
          )}
        </fieldset>

        <fieldset className={styles.group} data-field="methodId">
          <legend>Stacked or dumped?</legend>
          <div className={styles.lineOpts}>
            {firewoodMethods.map((m) => (
              <label key={m.id} className={styles.opt}>
                <input type="radio" name={`${uid}-method`} checked={draft.methodId === m.id} onChange={() => set("methodId", m.id)} />
                <span className={styles.optName}>{m.name}</span>
                <span className={styles.optDetail}>{m.description}</span>
                <span className={styles.optPrice}>{m.adjustment === 0 ? "Included" : `-$${Math.abs(m.adjustment)}`}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend>
            Anything in the way? <span className={styles.optional}>(optional)</span>
          </legend>
          <div className={styles.lineOpts}>
            {firewoodExtras.map((x) => (
              <label key={x.id} className={styles.opt}>
                <input type="checkbox" checked={draft.extras.includes(x.id)} onChange={(e) => toggleExtra(x.id, e.target.checked)} />
                <span className={styles.optName}>{x.name}</span>
                <span className={styles.optDetail}>{x.description}</span>
                <span className={styles.optPrice}>+${x.price}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={styles.fields}>
          <Field
            id={`${uid}-deliveryDate`}
            label="Delivery date"
            error={errors.deliveryDate}
            note={firewood.schedule.value.summary}
          >
            <input
              type="date"
              min={window_.min}
              max={window_.max}
              value={draft.deliveryDate}
              onChange={(e) => set("deliveryDate", e.target.value)}
            />
          </Field>
          <Field id={`${uid}-street`} label="Delivery address" error={errors.street} wide>
            <input autoComplete="address-line1" value={draft.street} onChange={(e) => set("street", e.target.value)} />
          </Field>
          <Field id={`${uid}-city`} label="Town" error={errors.city}>
            <input autoComplete="address-level2" value={draft.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field id={`${uid}-zip`} label="ZIP" error={errors.zip}>
            <input
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={5}
              value={draft.zip}
              onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
            />
          </Field>
          <Field
            id={`${uid}-instructions`}
            label="Where should the wood go?"
            error={errors.instructions}
            note="The more detail the better: which side of the house, how you want it stacked, anything the driver should watch for."
            wide
          >
            <textarea rows={4} value={draft.instructions} onChange={(e) => set("instructions", e.target.value)} />
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
          <Field id={`${uid}-email`} label="Email" error={errors.email}>
            <input type="email" autoComplete="email" inputMode="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <div className={styles.hp} aria-hidden="true">
            <label>
              Company
              <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      <aside className={styles.ticket} aria-label="Your order so far">
        <p className={styles.ticketHead}>Delivery ticket</p>
        {shown ? (
          <table className={styles.ticketLines}>
            <caption className="vh">Itemized total</caption>
            <tbody>
              {shown.lines.map((l) => (
                <tr key={l.id}>
                  <th scope="row">{l.label}</th>
                  <td>{formatCents(l.cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.ticketEmpty}>Pick a size to see your total.</p>
        )}
        <p className={styles.ticketDate}>
          {isISODate(draft.deliveryDate) ? `Delivery: ${formatLong(draft.deliveryDate)}` : "Delivery date: not picked yet"}
        </p>
        <p className={styles.ticketTotal} aria-live="polite">
          <span>Total</span>
          <strong>{shown ? formatCents(shown.totalCents) : "—"}</strong>
        </p>
        {firewood.tax.value.note && <p className={styles.ticketTax}>{firewood.tax.value.note}</p>}
        {firewood.policies.value.checkoutTerms && <p className={styles.payNote}>{firewood.policies.value.checkoutTerms}</p>}
        {payState}
        {status?.demoStore && checkoutOpen && <p className={styles.payNote}>Demo storage: test orders reset when the server restarts.</p>}
        <div className={styles.payBar}>
          <button type="submit" className="btn btn--sky" disabled={payDisabled}>
            {payLabel}
          </button>
        </div>
      </aside>

      {/* Phones: the total and the pay button stay on screen the whole way down the form */}
      <div className={styles.payBarPhone}>
        <p className={styles.payBarTotal}>
          <span>Total</span>
          <strong>{shown ? formatCents(shown.totalCents) : "Pick a size"}</strong>
        </p>
        <button type="submit" className="btn btn--sky" disabled={payDisabled}>
          {payLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  note,
  wide,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  note?: string;
  wide?: boolean;
  children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>;
}) {
  const describedBy = [error ? `${id}-err` : null, note ? `${id}-note` : null].filter(Boolean).join(" ") || undefined;
  const control = cloneElement(children, {
    id,
    name: id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    required: true,
  });
  return (
    <div className={`${styles.field} ${wide ? styles.wide : ""}`} data-invalid={error ? "" : undefined}>
      <label htmlFor={id}>{label}</label>
      {control}
      {note && (
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
