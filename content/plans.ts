// Recurring cleaning plans. A request only emails Jimmy; nothing is scheduled or billed
// automatically (Website Agreement, Addendum A1). The frequencies are Jimmy's.

export type PlanFrequencyId = "3-months" | "4-months" | "6-months" | "12-months";

export interface PlanFrequency {
  id: PlanFrequencyId;
  label: string;
  visits: string;
}

export const planFrequencies: PlanFrequency[] = [
  { id: "6-months", label: "Every 6 months", visits: "2 cleanings a year" },
  { id: "3-months", label: "Every 3 months", visits: "4 cleanings a year" },
  { id: "4-months", label: "Every 4 months", visits: "3 cleanings a year" },
  { id: "12-months", label: "Once a year", visits: "1 cleaning a year" },
];

/** Recommended to every customer, and selected when the dialog opens. */
export const recommendedPlan: PlanFrequencyId = "6-months";

export const recommendedWhy =
  "Gutters fill up fastest in two seasons: spring seeds and fall leaves. A cleaning every 6 months clears each one before it can clog or overflow.";

export function getPlanFrequency(id: string) {
  return planFrequencies.find((f) => f.id === id);
}
