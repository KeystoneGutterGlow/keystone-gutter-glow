// Firewood, sold all year: every business value the firewood pages, the order form, the price
// calculation and Stripe read. Nothing about firewood is hard-coded anywhere else.
//
// Every group carries a status:
//   "placeholder"  Nobody has decided this yet. The value only exists so the flow can be tested.
//   "contract"     From the Website Agreement, Addendum A2. Jimmy still has to confirm it.
//   "confirmed"    Jimmy confirmed it.
//
// Real payments stay refused until every group below is "confirmed" (lib/firewood/gate.ts).
// To confirm one: correct the value, then change its status to "confirmed".

import { serviceRadius, serviceZips } from "./area";

export type ConfigStatus = "placeholder" | "contract" | "confirmed";

export interface Confirmable<T> {
  status: ConfigStatus;
  /** What Jimmy needs to decide or check. Shown in the "not ready" panel. */
  ask: string;
  value: T;
}

export type ProductId = "quarter-cord" | "half-cord" | "full-cord";
export type DeliveryMethodId = "stacked" | "dumped";
export type ExtraId = "steps" | "rough-terrain";

export interface FirewoodProduct {
  id: ProductId;
  name: string;
  /** Whole dollars, delivery and stacking included */
  price: number;
  dimensions: string;
  logs: string;
  /** How many logs deep the 4 x 8 ft stack runs. Drives the drawing. */
  depthLogs: number;
}

export interface DeliveryMethod {
  id: DeliveryMethodId;
  name: string;
  description: string;
  /** Whole dollars added to the base price. Negative is a discount. */
  adjustment: number;
}

export interface FirewoodExtra {
  id: ExtraId;
  name: string;
  description: string;
  /** Whole dollars */
  price: number;
}

export const firewood = {
  label: "Firewood",
  timeZone: "America/New_York",
  currency: "usd",

  products: {
    status: "contract",
    ask: "Confirm prices, sizes and log counts. They're approximations from Addendum A2.",
    value: [
      {
        id: "quarter-cord",
        name: "Quarter cord",
        price: 200,
        dimensions: "About 4 ft high, 8 ft long, 1 log deep",
        logs: "About 100 logs",
        depthLogs: 1,
      },
      {
        id: "half-cord",
        name: "Half cord",
        price: 350,
        dimensions: "About 4 ft high, 8 ft long, 2 logs deep",
        logs: "About 180 to 200 logs",
        depthLogs: 2,
      },
      {
        id: "full-cord",
        name: "Full cord",
        price: 600,
        dimensions: "About 4 ft high, 8 ft long, 4 logs deep",
        logs: "About 360 to 400 logs",
        depthLogs: 4,
      },
    ],
  } satisfies Confirmable<FirewoodProduct[]>,

  deliveryMethods: {
    status: "contract",
    ask: "Confirm the $30 reduction for dumping instead of stacking.",
    value: [
      {
        id: "stacked",
        name: "Delivered and stacked",
        description: "We stack it where you tell us. This is the base price.",
        adjustment: 0,
      },
      {
        id: "dumped",
        name: "Delivered and dumped",
        description: "We unload it in one spot and you stack it.",
        adjustment: -30,
      },
    ],
  } satisfies Confirmable<DeliveryMethod[]>,

  extras: {
    status: "contract",
    ask: "Confirm the $25 steps charge and the $30 rough-terrain charge.",
    value: [
      { id: "steps", name: "Carrying up steps", description: "The wood has to go up steps to reach its spot.", price: 25 },
      {
        id: "rough-terrain",
        name: "Carrying over rough ground",
        description: "Mud, snow, ice or a hilly backyard between the truck and the spot.",
        price: 30,
      },
    ],
  } satisfies Confirmable<FirewoodExtra[]>,

  schedule: {
    status: "confirmed",
    ask: "Which days do you deliver, how much notice do you need, and how far ahead can people order?",
    value: {
      /** Earliest delivery, in days from today. Jimmy: one week ahead. */
      minLeadDays: 7,
      /** Latest delivery, in days from today. Firewood is always available, so this is only the date picker's limit. */
      horizonDays: 365,
      /** 0 = Sunday. Jimmy: any day of the week. */
      closedWeekdays: [] as number[],
      /** "YYYY-MM-DD" days with no deliveries */
      blackoutDates: [] as string[],
      summary: "Any day of the week. Order at least a week ahead.",
      availability: "Firewood is always available.",
    },
  } satisfies Confirmable<{
    minLeadDays: number;
    horizonDays: number;
    closedWeekdays: number[];
    blackoutDates: string[];
    summary: string;
    availability: string;
  }>,

  deliveryArea: {
    status: "confirmed",
    ask: "How far do you deliver? List the ZIP codes, and say whether any carry a fee.",
    value: {
      /** Jimmy: the same area as gutter cleaning. Paid up front with no refunds, so other ZIPs are told to call. */
      zips: [...serviceZips.keys()] as string[] | null,
      description: `The same area as our gutter cleaning: anywhere within ${serviceRadius.miles} miles of Jamison.` as string | null,
    },
  } satisfies Confirmable<{ zips: string[] | null; description: string | null }>,

  tax: {
    status: "placeholder",
    ask: "Do you charge sales tax on firewood? Check with an accountant. No tax is added until this is answered.",
    value: { note: null as string | null },
  } satisfies Confirmable<{ note: string | null }>,

  policies: {
    status: "placeholder",
    ask: "No refunds and 4 days' notice to reschedule are set. Still needed: approve how failed deliveries are handled.",
    value: {
      cancellation: "To move your delivery, call or text us at least 4 days before it." as string | null,
      refunds: "No refunds." as string | null,
      checkoutTerms: "No refunds. You can reschedule with at least 4 days' notice." as string | null,
    },
  } satisfies Confirmable<{ cancellation: string | null; refunds: string | null; checkoutTerms: string | null }>,

  fulfillment: {
    status: "confirmed",
    ask: "Is a paid order accepted right away, or do you confirm each delivery by hand first?",
    value: {
      /** Shown after payment and in the customer's email. Jimmy reviewed the confirmation rules. */
      afterPayment: "We'll deliver on that date. To move it, call or text us at least 4 days before. Firewood orders aren't refundable." as string | null,
    },
  } satisfies Confirmable<{ afterPayment: string | null }>,
};

export type FirewoodConfig = typeof firewood;

/** Every group that a real order depends on, in the order they're shown to Jimmy. */
export function configGroups(config: FirewoodConfig = firewood) {
  return [
    { key: "products", label: "Sizes and prices", group: config.products as Confirmable<unknown> },
    { key: "deliveryMethods", label: "Stacked or dumped", group: config.deliveryMethods as Confirmable<unknown> },
    { key: "extras", label: "Extra charges", group: config.extras as Confirmable<unknown> },
    { key: "schedule", label: "Delivery days", group: config.schedule as Confirmable<unknown> },
    { key: "deliveryArea", label: "Delivery area", group: config.deliveryArea as Confirmable<unknown> },
    { key: "tax", label: "Sales tax", group: config.tax as Confirmable<unknown> },
    { key: "policies", label: "Cancellation and refunds", group: config.policies as Confirmable<unknown> },
    { key: "fulfillment", label: "How orders get accepted", group: config.fulfillment as Confirmable<unknown> },
  ];
}

export function getProduct(id: string, config: FirewoodConfig = firewood) {
  return (config.products.value as FirewoodProduct[]).find((p) => p.id === id);
}

export function getDeliveryMethod(id: string, config: FirewoodConfig = firewood) {
  return (config.deliveryMethods.value as DeliveryMethod[]).find((m) => m.id === id);
}

export const firewoodProducts = firewood.products.value as FirewoodProduct[];
export const firewoodMethods = firewood.deliveryMethods.value as DeliveryMethod[];
export const firewoodExtras = firewood.extras.value as FirewoodExtra[];
export const firewoodStartingPrice = Math.min(...firewoodProducts.map((p) => p.price));
