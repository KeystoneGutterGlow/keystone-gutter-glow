// Prices and packages from the current site's pricing page and booking flow.
// The booking API reads these too, so the server always computes the total itself.

export type PackageId = "one-story" | "townhome" | "two-story" | "large";
export type HouseShape = "ranch" | "townhome" | "colonial" | "large";

export interface Package {
  id: PackageId;
  name: string;
  /** Short "is this my house?" line */
  fits: string;
  /** Whole dollars */
  price: number;
  /** "From $249" rather than a fixed price */
  isFrom: boolean;
  /** Final price gets confirmed before the visit */
  needsQuote: boolean;
  shape: HouseShape;
  /** Typical time on site, from the current FAQ */
  duration?: string;
}

export const packages: Package[] = [
  {
    id: "one-story",
    name: "One-story",
    fits: "Ranches, bungalows, any single-level house up to about 2,500 sq ft",
    price: 169,
    isFrom: false,
    needsQuote: false,
    shape: "ranch",
    duration: "45 to 60 minutes",
  },
  {
    id: "townhome",
    name: "Townhome",
    fits: "Attached townhomes and rowhomes",
    price: 199,
    isFrom: false,
    needsQuote: false,
    shape: "townhome",
  },
  {
    id: "two-story",
    name: "Two-story",
    fits: "Colonials, split-levels, anything with two floors",
    price: 229,
    isFrom: false,
    needsQuote: false,
    shape: "colonial",
    duration: "60 to 90 minutes",
  },
  {
    id: "large",
    name: "Bigger than that",
    fits: "Three floors, a big footprint, or a roofline that's a puzzle",
    price: 249,
    isFrom: true,
    needsQuote: true,
    shape: "large",
  },
];

export const rinse = {
  name: "Gutter rinse",
  price: 25,
  // The current homepage shows $50 struck through. Set to null to hide the comparison.
  regularPrice: 50 as number | null,
  short: "Water flush after the vacuum pass, for the fine grit on the bottom.",
};

export const startingPrice = Math.min(...packages.map((p) => p.price));

export function getPackage(id: string): Package | undefined {
  return packages.find((p) => p.id === id);
}

export function priceLabel(p: Pick<Package, "price" | "isFrom">): string {
  return p.isFrom ? `From $${p.price}` : `$${p.price}`;
}

export function totalFor(pkg: Package, withRinse: boolean): number {
  return pkg.price + (withRinse ? rinse.price : 0);
}
