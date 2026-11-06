// "Why choose Keystone Gutter Glow": the tour of Jimmy's vacuum, following one leaf from the
// gutter to the tank. Every figure below is from the manufacturer's published spec sheet for the
// kit Jimmy uses (Gutter Pro Vac, "16 Gallon Cyclone Classic Pro 3600W ... 40 Foot Carbon Clamping
// Pole Kit", read 2026-11-06). Nothing here is a Keystone claim beyond what the machine is.
// CONFIRM with Jimmy that this is the exact kit he works with (the listing was on preorder).

export const machine = {
  model: "Cyclone Classic Pro",
  maker: "Gutter Pro Vac",
  motors: 3,
  wattsPerMotor: 1200,
  totalWatts: 3600,
  airflowCfm: 342.6,
  waterLiftInches: 95,
  tankGallons: 16,
  hoseFeet: 16,
  hoseInches: 2,
  poleFeet: 40,
  poleSections: 10,
  sectionFeet: 4,
  bendDegrees: 135,
  heightInches: 38,
  weightLbs: 52,
};

export interface Chapter {
  id: string;
  title: string;
  body: string;
  /** Short facts shown as figures under the text */
  figures: { value: string; label: string }[];
  /** What a ladder and scoop does at the same point */
  byHand?: string;
}

const m = machine;

export const chapters: Chapter[] = [
  {
    id: "setup",
    title: "The whole setup",
    body: `A carbon pole up to the gutter, a hose across the lawn, and the vacuum on its cart. The pole does the reaching, so the cleaning is done from the ground. Scroll to follow one leaf out of your gutter.`,
    figures: [
      { value: `${m.poleFeet} ft`, label: "of carbon pole" },
      { value: `${m.tankGallons} gal`, label: "stainless tank" },
      { value: `${m.totalWatts.toLocaleString("en-US")} W`, label: "of suction" },
    ],
    byHand: "A ladder against your gutter, a scoop, and a bucket.",
  },
  {
    id: "nozzle",
    title: "The nozzle goes to the bottom",
    body: `An aluminum nozzle on a ${m.bendDegrees}° silicone bend reaches over the lip and sits on the floor of the gutter. That's where the wet, packed layer is, under the leaves, and that's where the suction starts.`,
    figures: [
      { value: `${m.bendDegrees}°`, label: "silicone bend" },
      { value: "Aluminum", label: "angled or straight nozzle" },
    ],
    byHand: "A scoop skims what's on top. The packed layer at the bottom tends to stay.",
  },
  {
    id: "pole",
    title: `Up to ${m.poleFeet} feet of carbon pole`,
    body: `${m.poleSections === 10 ? "Ten" : m.poleSections} ${m.sectionFeet}-foot carbon-fiber sections lock together with quick-release clamps, so the pole is as long as the house needs: up to three or four stories. Carbon is light and stiff, which keeps the nozzle where Jimmy puts it. The handle section has Kevlar woven into it for strength.`,
    figures: [
      { value: `${m.poleSections} × ${m.sectionFeet} ft`, label: "clamping sections" },
      { value: "Kevlar", label: "reinforced handle section" },
    ],
    byHand: "The ladder gets moved every few feet, and leans on the gutter each time.",
  },
  {
    id: "hose",
    title: "Down the pole, across the lawn",
    body: `Whatever the nozzle lifts goes straight down the inside of the pole and along ${m.hoseFeet} feet of ${m.hoseInches}-inch hose to the cart. It's one closed line from your gutter to the tank, so nothing falls out on the way.`,
    figures: [
      { value: `${m.hoseFeet} ft`, label: "of hose" },
      { value: `${m.hoseInches} in`, label: "opening, end to end" },
    ],
    byHand: "Handfuls go into a bucket hanging off the ladder, and some miss.",
  },
  {
    id: "motors",
    title: "Three motors pulling",
    body: `Three ${m.wattsPerMotor.toLocaleString("en-US")}-watt motors, ${m.totalWatts.toLocaleString("en-US")} watts together, move ${m.airflowCfm} cubic feet of air a minute. The pull is strong enough to lift a column of water ${m.waterLiftInches} inches high. That's what it takes to bring up soaked, packed debris and standing water, not just dry leaves.`,
    figures: [
      { value: `${m.motors} × ${m.wattsPerMotor.toLocaleString("en-US")} W`, label: "motors" },
      { value: `${m.airflowCfm}`, label: "cubic feet of air a minute" },
      { value: `${m.waterLiftInches} in`, label: "water lift" },
    ],
    byHand: "Wet sludge is heavy and smears, so it's the part that gets left.",
  },
  {
    id: "cyclone",
    title: "It spins, then it drops",
    body: `The hose comes into the tank from the side, so the air spins around the inside wall. Heavy, wet debris falls out of the spin into the ${m.tankGallons}-gallon stainless tank. A washable cloth filter catches what's left before it reaches the motors, and a float shuts the suction off if the tank fills.`,
    figures: [
      { value: "Cyclonic", label: "side inlet" },
      { value: `${m.tankGallons} gal`, label: "stainless steel tank" },
      { value: "Auto", label: "shut-off when full" },
    ],
  },
  {
    id: "cart",
    title: "And it leaves with us",
    body: `The tank rides on a welded steel cart with all-terrain wheels and locking front casters. It stands ${m.heightInches} inches tall and weighs ${m.weightLbs} pounds, so it rolls across the lawn and goes where Jimmy goes. Water drains out through its own hose. Nothing from your gutter lands in your beds.`,
    figures: [
      { value: "Steel", label: "welded cart" },
      { value: "All-terrain", label: "rear wheels" },
      { value: `${m.weightLbs} lb`, label: "on wheels" },
    ],
    byHand: "Whatever misses the bucket stays in your beds and on the lawn.",
  },
];
