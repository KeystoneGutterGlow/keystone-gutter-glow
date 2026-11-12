// Service area: everywhere within 20 miles of Jamison, in Pennsylvania only. Addendum A1 said 10 miles;
// Sam set 20 on 2026-11-11, and Jimmy can't do business in New Jersey, so no NJ ZIP is listed.
// `areaZips` drives the "Do we come to you?" check, the town and county lists, the booking form's
// out-of-area note and firewood delivery. Addresses outside Pennsylvania are refused outright
// (lib/booking/validate.ts).
//
// It lists every ZIP whose Census 2020 ZIP-area center (ZCTA internal point) is within
// `serviceRadius.miles` of the center below and in Pennsylvania: 116 of them. (25 New Jersey ZIPs
// across the Delaware River are also within 20 miles. They're left out on purpose.)
// Built 2026-11-11 (30 miles), then cut to 20 miles and Pennsylvania the same day:
// - the ZIP areas and their centers come from the Census TIGERweb ZCTA layer;
// - each county is the TIGERweb county containing that center;
// - post-office names come from GeoNames, via the Zippopotam API;
// - the 33 ZIPs inside 10 miles keep their hand-checked names and other names.
// Just outside, and so not listed: 18930 (20.1), 19131 (20.3), 18935 (20.4), 19123 (20.8), 19096 (20.8), 19130 (20.8), 19085 (21.0), 19010 (21.0), 19108 (21.2), 19473 (21.2), 19003 (21.2).
// Those still get "ask us" rather than "no".

export type AreaState = "PA";

export interface AreaZip {
  zip: string;
  /** Post-office name */
  name: string;
  /** Other names people use for places in this ZIP */
  aka?: string[];
  state: AreaState;
  /** County the ZIP area's center is in, without the word "County" */
  county: string;
  /** Miles from the center of the circle to the middle of the ZIP area */
  miles: number;
}

export const areaZips: AreaZip[] = [
  { zip: "18929", name: "Jamison", aka: ["Warwick"], state: "PA", county: "Bucks", miles: 0.1 },
  { zip: "18925", name: "Furlong", state: "PA", county: "Bucks", miles: 1.9 },
  { zip: "18974", name: "Warminster", aka: ["Ivyland", "Hartsville"], state: "PA", county: "Bucks", miles: 3.0 },
  { zip: "18976", name: "Warrington", state: "PA", county: "Bucks", miles: 3.4 },
  { zip: "18980", name: "Wycombe", state: "PA", county: "Bucks", miles: 3.7 },
  { zip: "18912", name: "Buckingham", state: "PA", county: "Bucks", miles: 3.9 },
  { zip: "18946", name: "Pineville", state: "PA", county: "Bucks", miles: 4.3 },
  { zip: "18901", name: "Doylestown", aka: ["New Britain"], state: "PA", county: "Bucks", miles: 4.8 },
  { zip: "18954", name: "Richboro", state: "PA", county: "Bucks", miles: 5.2 },
  { zip: "19040", name: "Hatboro", state: "PA", county: "Montgomery", miles: 5.9 },
  { zip: "18966", name: "Southampton", aka: ["Holland", "Churchville", "Upper Southampton", "Northampton"], state: "PA", county: "Bucks", miles: 6.2 },
  { zip: "19044", name: "Horsham", state: "PA", county: "Montgomery", miles: 6.2 },
  { zip: "18902", name: "Doylestown", state: "PA", county: "Bucks", miles: 6.5 },
  { zip: "18914", name: "Chalfont", state: "PA", county: "Bucks", miles: 7.2 },
  { zip: "18940", name: "Newtown", state: "PA", county: "Bucks", miles: 7.5 },
  { zip: "18938", name: "New Hope", state: "PA", county: "Bucks", miles: 7.6 },
  { zip: "18913", name: "Carversville", state: "PA", county: "Bucks", miles: 7.9 },
  { zip: "18923", name: "Fountainville", state: "PA", county: "Bucks", miles: 7.9 },
  { zip: "19090", name: "Willow Grove", state: "PA", county: "Montgomery", miles: 8.1 },
  { zip: "18936", name: "Montgomeryville", state: "PA", county: "Montgomery", miles: 8.1 },
  { zip: "19009", name: "Bryn Athyn", state: "PA", county: "Montgomery", miles: 8.5 },
  { zip: "19002", name: "Ambler", aka: ["Maple Glen"], state: "PA", county: "Montgomery", miles: 8.7 },
  { zip: "19454", name: "North Wales", state: "PA", county: "Montgomery", miles: 9.0 },
  { zip: "19025", name: "Dresher", state: "PA", county: "Montgomery", miles: 9.0 },
  { zip: "19006", name: "Huntingdon Valley", state: "PA", county: "Montgomery", miles: 9.1 },
  { zip: "19053", name: "Feasterville-Trevose", aka: ["Feasterville", "Trevose", "Lower Southampton"], state: "PA", county: "Bucks", miles: 9.2 },
  { zip: "18932", name: "Line Lexington", state: "PA", county: "Bucks", miles: 9.2 },
  { zip: "18915", name: "Colmar", state: "PA", county: "Montgomery", miles: 9.3 },
  { zip: "19001", name: "Abington", state: "PA", county: "Montgomery", miles: 9.6 },
  { zip: "18927", name: "Hilltown", state: "PA", county: "Bucks", miles: 9.6 },
  { zip: "19477", name: "Spring House", state: "PA", county: "Montgomery", miles: 9.7 },
  { zip: "19436", name: "Gwynedd", state: "PA", county: "Montgomery", miles: 9.8 },
  { zip: "18917", name: "Dublin", state: "PA", county: "Bucks", miles: 9.8 },
  { zip: "18933", name: "Lumberville", state: "PA", county: "Bucks", miles: 10.1 },
  { zip: "19047", name: "Langhorne", state: "PA", county: "Bucks", miles: 10.4 },
  { zip: "19116", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 10.4 },
  { zip: "18977", name: "Washington Crossing", state: "PA", county: "Bucks", miles: 11.0 },
  { zip: "19437", name: "Gwynedd Valley", state: "PA", county: "Montgomery", miles: 11.0 },
  { zip: "19046", name: "Jenkintown", state: "PA", county: "Montgomery", miles: 11.0 },
  { zip: "19034", name: "Fort Washington", state: "PA", county: "Montgomery", miles: 11.1 },
  { zip: "19440", name: "Hatfield", state: "PA", county: "Montgomery", miles: 11.3 },
  { zip: "18947", name: "Pipersville", state: "PA", county: "Bucks", miles: 11.4 },
  { zip: "19075", name: "Oreland", state: "PA", county: "Montgomery", miles: 11.6 },
  { zip: "18962", name: "Silverdale", state: "PA", county: "Bucks", miles: 11.6 },
  { zip: "19038", name: "Glenside", state: "PA", county: "Montgomery", miles: 11.7 },
  { zip: "19067", name: "Yardley", aka: ["Morrisville", "Lower Makefield"], state: "PA", county: "Bucks", miles: 11.8 },
  { zip: "19115", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 11.9 },
  { zip: "19446", name: "Lansdale", state: "PA", county: "Montgomery", miles: 12.0 },
  { zip: "18944", name: "Perkasie", state: "PA", county: "Bucks", miles: 12.3 },
  { zip: "19154", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 12.5 },
  { zip: "19095", name: "Wyncote", state: "PA", county: "Montgomery", miles: 12.6 },
  { zip: "19422", name: "Blue Bell", state: "PA", county: "Montgomery", miles: 12.7 },
  { zip: "19031", name: "Flourtown", state: "PA", county: "Montgomery", miles: 12.8 },
  { zip: "19056", name: "Levittown", state: "PA", county: "Bucks", miles: 12.8 },
  { zip: "19027", name: "Elkins Park", state: "PA", county: "Montgomery", miles: 13.1 },
  { zip: "19020", name: "Bensalem", state: "PA", county: "Bucks", miles: 13.4 },
  { zip: "19111", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 13.8 },
  { zip: "19152", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 13.8 },
  { zip: "19114", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 13.8 },
  { zip: "19150", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 13.8 },
  { zip: "19012", name: "Cheltenham", state: "PA", county: "Montgomery", miles: 13.9 },
  { zip: "18964", name: "Souderton", state: "PA", county: "Montgomery", miles: 13.9 },
  { zip: "19030", name: "Fairless Hills", state: "PA", county: "Bucks", miles: 14.0 },
  { zip: "18950", name: "Point Pleasant", state: "PA", county: "Bucks", miles: 14.2 },
  { zip: "19057", name: "Levittown", state: "PA", county: "Bucks", miles: 14.3 },
  { zip: "19126", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 14.4 },
  { zip: "19118", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 14.6 },
  { zip: "19462", name: "Plymouth Meeting", state: "PA", county: "Montgomery", miles: 14.6 },
  { zip: "19138", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 14.7 },
  { zip: "19055", name: "Levittown", state: "PA", county: "Bucks", miles: 14.8 },
  { zip: "18960", name: "Sellersville", state: "PA", county: "Bucks", miles: 14.9 },
  { zip: "19444", name: "Lafayette Hill", state: "PA", county: "Montgomery", miles: 15.1 },
  { zip: "19490", name: "Worcester", state: "PA", county: "Montgomery", miles: 15.1 },
  { zip: "19054", name: "Levittown", state: "PA", county: "Bucks", miles: 15.2 },
  { zip: "19021", name: "Croydon", state: "PA", county: "Bucks", miles: 15.4 },
  { zip: "19149", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 15.4 },
  { zip: "19119", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 15.5 },
  { zip: "18942", name: "Ottsville", state: "PA", county: "Bucks", miles: 15.5 },
  { zip: "19007", name: "Bristol", state: "PA", county: "Bucks", miles: 15.5 },
  { zip: "19136", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 15.5 },
  { zip: "19141", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 15.7 },
  { zip: "19120", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 15.7 },
  { zip: "18969", name: "Telford", state: "PA", county: "Montgomery", miles: 15.9 },
  { zip: "19401", name: "Norristown", state: "PA", county: "Montgomery", miles: 16.0 },
  { zip: "18920", name: "Erwinna", state: "PA", county: "Bucks", miles: 16.1 },
  { zip: "19438", name: "Harleysville", state: "PA", county: "Montgomery", miles: 16.4 },
  { zip: "19135", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 16.5 },
  { zip: "19144", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 16.6 },
  { zip: "19128", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 16.6 },
  { zip: "19124", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 16.8 },
  { zip: "19428", name: "Conshohocken", state: "PA", county: "Montgomery", miles: 17.1 },
  { zip: "19474", name: "Skippack", state: "PA", county: "Montgomery", miles: 17.3 },
  { zip: "19405", name: "Bridgeport", state: "PA", county: "Montgomery", miles: 17.4 },
  { zip: "19140", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 17.5 },
  { zip: "19403", name: "Norristown", state: "PA", county: "Montgomery", miles: 17.6 },
  { zip: "19127", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 17.7 },
  { zip: "19035", name: "Gladwyne", state: "PA", county: "Montgomery", miles: 17.8 },
  { zip: "19129", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 18.0 },
  { zip: "19137", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 18.5 },
  { zip: "18972", name: "Upper Black Eddy", state: "PA", county: "Bucks", miles: 18.6 },
  { zip: "19133", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 18.7 },
  { zip: "19134", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 18.8 },
  { zip: "19132", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 18.8 },
  { zip: "19072", name: "Narberth", state: "PA", county: "Montgomery", miles: 18.8 },
  { zip: "18970", name: "Trumbauersville", state: "PA", county: "Bucks", miles: 19.0 },
  { zip: "19004", name: "Bala Cynwyd", state: "PA", county: "Montgomery", miles: 19.1 },
  { zip: "18921", name: "Ferndale", state: "PA", county: "Bucks", miles: 19.2 },
  { zip: "19426", name: "Collegeville", state: "PA", county: "Montgomery", miles: 19.5 },
  { zip: "18955", name: "Richlandtown", state: "PA", county: "Bucks", miles: 19.6 },
  { zip: "18951", name: "Quakertown", state: "PA", county: "Bucks", miles: 19.7 },
  { zip: "19125", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 19.7 },
  { zip: "19406", name: "King of Prussia", state: "PA", county: "Montgomery", miles: 19.8 },
  { zip: "19122", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 19.8 },
  { zip: "19121", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 19.9 },
  { zip: "19066", name: "Merion Station", state: "PA", county: "Montgomery", miles: 19.9 },
  { zip: "18054", name: "Green Lane", state: "PA", county: "Montgomery", miles: 20.0 },
];

/** Each place name once, in order of distance */
export const areaPlaces: string[] = [...new Set(areaZips.map((z) => z.name))];

export interface AreaCounty {
  county: string;
  state: AreaState;
  /** Place names in this county, alphabetical */
  towns: string[];
}

/** Counties inside the area, nearest first. */
export const areaCounties: AreaCounty[] = (() => {
  const groups = new Map<string, AreaCounty>();
  for (const z of areaZips) {
    const key = `${z.state}|${z.county}`;
    const g = groups.get(key) ?? { county: z.county, state: z.state, towns: [] };
    if (!g.towns.includes(z.name)) g.towns.push(z.name);
    groups.set(key, g);
  }
  // areaZips is in order of distance, so insertion order is already nearest-first within each state.
  const all = [...groups.values()].map((g) => ({ ...g, towns: [...g.towns].sort((a, b) => a.localeCompare(b)) }));
  return all;
})();

/** "Bucks County", "Philadelphia" (city and county are the same) */
export const countyName = (c: Pick<AreaCounty, "county">) => (c.county === "Philadelphia" ? "Philadelphia" : `${c.county} County`);

/**
 * Named on the map. The map's own labels already name the bigger towns, so this is only the
 * base the circle is drawn around, which the tiles leave unnamed at this zoom.
 */
export const mapLabels = [{ name: "Jamison", lat: 40.2546, lon: -75.0868 }];

/**
 * Center of the service radius. It comes from Jimmy's private service-origin address, rounded to
 * about half a mile so his home can't be read out of the page. The address itself stays out of this
 * repo and off the site.
 */
export const serviceRadius = { miles: 20, lat: 40.26, lon: -75.08 };

export const serviceZips = new Map<string, string>(areaZips.map((z) => [z.zip, z.name]));
const zipState = new Map<string, AreaState>(areaZips.map((z) => [z.zip, z.state]));

/**
 * The state for an address, from its ZIP's first digits (they map to states). Used to print addresses
 * and to turn away anything outside Pennsylvania, where Jimmy can't do business.
 */
export function stateForZip(zip: string): string {
  const known = zipState.get(zip);
  if (known) return known;
  const n = Number(zip.slice(0, 3));
  if (!/^\d{5}$/.test(zip)) return "PA";
  if (n >= 70 && n <= 89) return "NJ";
  if (n >= 100 && n <= 149) return "NY";
  if (n >= 197 && n <= 199) return "DE";
  if (n >= 206 && n <= 219) return "MD";
  return "PA";
}

const clean = (v: string) =>
  v
    .toLowerCase()
    .replace(/,?\s*(pa|pennsylvania|nj|new jersey)\.?$/, "")
    .replace(/\s+(township|twp\.?|borough|boro)$/, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const byName = new Map<string, string>();
for (const z of areaZips) {
  for (const n of [z.name, ...(z.aka ?? [])]) if (!byName.has(clean(n))) byName.set(clean(n), z.name);
}

/**
 * yes: a ZIP or place inside the area. ask: a Pennsylvania ZIP outside it.
 * outOfState: a ZIP in another state, which we can't serve at all.
 * unknown: words we can't match to a place. invalid: empty, or digits that aren't a ZIP.
 */
export function lookupArea(
  input: string,
): { status: "yes"; town: string } | { status: "ask" } | { status: "outOfState"; state: string } | { status: "unknown" } | { status: "invalid" } {
  const raw = input.trim();
  if (!raw) return { status: "invalid" };
  const zip = raw.match(/^(\d{5})(-\d{4})?$/)?.[1];
  if (zip) {
    const town = serviceZips.get(zip);
    if (town) return { status: "yes", town };
    const state = stateForZip(zip);
    return state === "PA" ? { status: "ask" } : { status: "outOfState", state };
  }
  if (/^[\d\s-]+$/.test(raw)) return { status: "invalid" };
  const town = byName.get(clean(raw));
  return town ? { status: "yes", town } : { status: "unknown" };
}
