// What's in a cleaning. Numbers match the keystone callouts on the house-corner drawing.

export interface JobPart {
  n: number;
  title: string;
  body: string;
  /** Small print under the body */
  note?: string;
  addOn?: boolean;
}

export const jobParts: JobPart[] = [
  {
    n: 1,
    title: "Every gutter run, vacuumed out",
    body: "Front, back, and the short runs over porches and garages. Leaves, pine needles, maple helicopters, shingle grit, and the wet black layer packed into the bottom.",
  },
  {
    n: 2,
    title: "Downspouts cleared and tested",
    body: "We clear the opening, then run water down each one to make sure it actually drains.",
  },
  {
    n: 3,
    title: "Before and after photos",
    body: "Taken along the runs while we work and sent to you afterward, so you can see the job without climbing anything.",
    note: "When conditions allow.",
  },
  {
    n: 4,
    title: "A rinse, if you want one",
    body: "After the vacuum pass we flush the troughs to lift the fine grit off the bottom.",
    note: "+$25. Worth doing at least once a year.",
    addOn: true,
  },
];
