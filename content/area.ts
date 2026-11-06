// Service area: everywhere within 10 miles of Jamison (Addendum A1).
// `areaZips` drives the "Do we come to you?" check, the booking form's out-of-area note and
// firewood delivery. It lists every ZIP whose Census 2020 ZIP-area center (ZCTA internal point)
// is within `serviceRadius.miles` of the center below, with the post-office name for each.
// Built 2026-11-05 from the Census TIGERweb ZCTA layer. Just outside, and so not listed:
// Lumberville 18933 (10.1 mi), Langhorne 19047 and Philadelphia 19116 (10.4), Washington
// Crossing 18977 (11.0) and Yardley 19067 (11.8). Those still get "ask us" rather than "no".

export interface AreaZip {
  zip: string;
  /** Post-office name */
  name: string;
  /** Other names people use for places in this ZIP */
  aka?: string[];
  /** Miles from the center of the circle to the middle of the ZIP area */
  miles: number;
}

export const areaZips: AreaZip[] = [
  { zip: "18929", name: "Jamison", aka: ["Warwick"], miles: 0.1 },
  { zip: "18925", name: "Furlong", miles: 1.9 },
  { zip: "18974", name: "Warminster", aka: ["Ivyland", "Hartsville"], miles: 3.0 },
  { zip: "18976", name: "Warrington", miles: 3.4 },
  { zip: "18980", name: "Wycombe", miles: 3.7 },
  { zip: "18912", name: "Buckingham", miles: 3.9 },
  { zip: "18946", name: "Pineville", miles: 4.3 },
  { zip: "18901", name: "Doylestown", aka: ["New Britain"], miles: 4.8 },
  { zip: "18954", name: "Richboro", miles: 5.2 },
  { zip: "19040", name: "Hatboro", miles: 5.9 },
  { zip: "18966", name: "Southampton", aka: ["Holland", "Churchville", "Upper Southampton", "Northampton"], miles: 6.2 },
  { zip: "19044", name: "Horsham", miles: 6.2 },
  { zip: "18902", name: "Doylestown", miles: 6.5 },
  { zip: "18914", name: "Chalfont", miles: 7.2 },
  { zip: "18940", name: "Newtown", miles: 7.5 },
  { zip: "18938", name: "New Hope", miles: 7.6 },
  { zip: "18913", name: "Carversville", miles: 7.9 },
  { zip: "18923", name: "Fountainville", miles: 7.9 },
  { zip: "19090", name: "Willow Grove", miles: 8.1 },
  { zip: "18936", name: "Montgomeryville", miles: 8.1 },
  { zip: "19009", name: "Bryn Athyn", miles: 8.5 },
  { zip: "19002", name: "Ambler", aka: ["Maple Glen"], miles: 8.7 },
  { zip: "19454", name: "North Wales", miles: 9.0 },
  { zip: "19025", name: "Dresher", miles: 9.0 },
  { zip: "19006", name: "Huntingdon Valley", miles: 9.1 },
  { zip: "19053", name: "Feasterville-Trevose", aka: ["Feasterville", "Trevose", "Lower Southampton"], miles: 9.2 },
  { zip: "18932", name: "Line Lexington", miles: 9.2 },
  { zip: "18915", name: "Colmar", miles: 9.3 },
  { zip: "19001", name: "Abington", miles: 9.6 },
  { zip: "18927", name: "Hilltown", miles: 9.6 },
  { zip: "19477", name: "Spring House", miles: 9.7 },
  { zip: "19436", name: "Gwynedd", miles: 9.8 },
  { zip: "18917", name: "Dublin", miles: 9.8 },
];

/** Each place name once, in order of distance */
export const areaPlaces: string[] = [...new Set(areaZips.map((z) => z.name))];

/**
 * Named on the map. The map's own labels already name the bigger towns, so this is only the
 * base the circle is drawn around, which the tiles leave unnamed at this zoom.
 */
export const mapLabels = [{ name: "Jamison", lat: 40.2546, lon: -75.0868 }];

/**
 * Center of the 10-mile service radius (Addendum A1). It comes from Jimmy's private service-origin
 * address, rounded to about half a mile so his home can't be read out of the page. The address
 * itself stays out of this repo and off the site.
 */
export const serviceRadius = { miles: 10, lat: 40.26, lon: -75.08 };

export const serviceZips = new Map<string, string>(areaZips.map((z) => [z.zip, z.name]));

const clean = (v: string) =>
  v
    .toLowerCase()
    .replace(/,?\s*(pa|pennsylvania)\.?$/, "")
    .replace(/\s+(township|twp\.?|borough|boro)$/, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const byName = new Map<string, string>(
  areaZips.flatMap((z) => [z.name, ...(z.aka ?? [])].map((n) => [clean(n), z.name] as [string, string])),
);

/**
 * yes: a ZIP or place inside the circle. ask: a real-looking ZIP outside it.
 * unknown: words we can't match to a place. invalid: empty, or digits that aren't a ZIP.
 */
export function lookupArea(
  input: string,
): { status: "yes"; town: string } | { status: "ask" } | { status: "unknown" } | { status: "invalid" } {
  const raw = input.trim();
  if (!raw) return { status: "invalid" };
  const zip = raw.match(/^(\d{5})(-\d{4})?$/)?.[1];
  if (zip) {
    const town = serviceZips.get(zip);
    return town ? { status: "yes", town } : { status: "ask" };
  }
  if (/^[\d\s-]+$/.test(raw)) return { status: "invalid" };
  const town = byName.get(clean(raw));
  return town ? { status: "yes", town } : { status: "unknown" };
}
