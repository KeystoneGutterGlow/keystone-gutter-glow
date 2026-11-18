// Service area: everywhere within 15 miles of Jamison, in Pennsylvania only (Sam, 2026-11-17).
// Addendum A1 said 10 miles. It was set to 30 and then 20 on 2026-11-11, and to 15 on 2026-11-17. Jimmy
// can't do business in New Jersey, so no New Jersey ZIP is listed and the map's shaded area stops
// at the Delaware River. `areaZips` drives the "Do we come to you?" check, the town and county lists,
// and who can book: only these ZIPs can (lib/booking/validate.ts), and anything else is refused.
//
// It lists every ZIP whose Census 2020 ZIP-area center (ZCTA internal point) is within
// `serviceRadius.miles` of the center below and in Pennsylvania: 71 of them.
// Built 2026-11-11 from the Census TIGERweb ZCTA layer (centers), the TIGERweb county containing
// each center, and GeoNames post-office names (via the Zippopotam API); the 33 ZIPs inside 10 miles
// keep their hand-checked names. Each ZIP's distance is in `miles`, so a smaller radius is a filter.
// Just outside 15 miles, and so not listed: 19444 Lafayette Hill (15.1), 19490 Worcester (15.1), 19054 Levittown (15.2), 19021 Croydon (15.4), 19149 Philadelphia (15.4), 19119 Philadelphia (15.5), 18942 Ottsville (15.5), 19007 Bristol (15.5), 19136 Philadelphia (15.5), 19141 Philadelphia (15.7), 19120 Philadelphia (15.7), 18969 Telford (15.9).

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
export const serviceRadius = { miles: 15, lat: 40.26, lon: -75.08 };

/**
 * The service area as the map draws it: the 15-mile circle, clipped to Pennsylvania, so the shaded
 * area ends at the Delaware River and takes in no New Jersey. [lat, lon] points, built 2026-11-17 from
 * the Census TIGERweb state boundary (Pennsylvania), cut to the circle and simplified to about 30 m.
 * If the radius or the center changes, rebuild it the same way (or ask Claude to).
 */
export const serviceShape: Array<[number, number]> = [[40.26,-75.3642], [40.2813,-75.3628], [40.2919,-75.3611], [40.3076,-75.3573], [40.3282,-75.3498], [40.3481,-75.3398], [40.3672,-75.3272], [40.3852,-75.3123], [40.402,-75.2952], [40.4174,-75.2759], [40.4314,-75.2548], [40.4437,-75.232], [40.4542,-75.2078], [40.4608,-75.1887], [40.4647,-75.1757], [40.4709,-75.149], [40.475,-75.1217], [40.4771,-75.0939], [40.4774,-75.08], [40.4771,-75.0644], [40.4737,-75.0677], [40.4714,-75.068], [40.4653,-75.067], [40.4622,-75.0682], [40.4588,-75.0703], [40.4568,-75.0707], [40.4453,-75.066], [40.4418,-75.0656], [40.4382,-75.0642], [40.4364,-75.0644], [40.4301,-75.0623], [40.4241,-75.0618], [40.4182,-75.0586], [40.4161,-75.0548], [40.4137,-75.0455], [40.411,-75.0423], [40.4074,-75.0355], [40.4061,-75.0344], [40.404,-75.0286], [40.4035,-75.0257], [40.4037,-75.023], [40.4076,-75.0074], [40.4075,-75.0041], [40.4098,-75.0], [40.4104,-74.9959], [40.4085,-74.9884], [40.4046,-74.9831], [40.402,-74.9774], [40.3994,-74.9688], [40.3982,-74.9665], [40.3952,-74.964], [40.3889,-74.9615], [40.38,-74.9558], [40.3651,-74.9489], [40.3551,-74.9458], [40.3451,-74.9445], [40.3415,-74.9428], [40.338,-74.9397], [40.3331,-74.9331], [40.3294,-74.9268], [40.3224,-74.9174], [40.3169,-74.9083], [40.3156,-74.9033], [40.3151,-74.8964], [40.313,-74.8916], [40.3056,-74.8806], [40.2952,-74.8682], [40.2846,-74.8605], [40.2773,-74.8565], [40.2697,-74.8531], [40.2617,-74.848], [40.2505,-74.8423], [40.2462,-74.8363], [40.2415,-74.8239], [40.2385,-74.8195], [40.2307,-74.7985], [40.2124,-74.8027], [40.1918,-74.8102], [40.1719,-74.8202], [40.1528,-74.8328], [40.1392,-74.8437], [40.1221,-74.8603], [40.1063,-74.8791], [40.092,-74.8997], [40.0823,-74.9164], [40.0709,-74.9399], [40.0613,-74.9648], [40.0536,-74.9909], [40.0479,-75.0177], [40.0442,-75.0452], [40.0427,-75.073], [40.0432,-75.1009], [40.0458,-75.1286], [40.0505,-75.1558], [40.0572,-75.1823], [40.0658,-75.2078], [40.0763,-75.232], [40.0854,-75.2493], [40.0989,-75.2708], [40.114,-75.2906], [40.1263,-75.304], [40.1437,-75.3201], [40.1623,-75.3338], [40.1818,-75.3451], [40.202,-75.3539], [40.2176,-75.3587], [40.2387,-75.3628]];

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
 * yes: a ZIP or place inside the area. outside: a Pennsylvania ZIP outside it, which can't book.
 * outOfState: a ZIP in another state, which we can't serve at all.
 * unknown: words we can't match to a place. invalid: empty, or digits that aren't a ZIP.
 */
export function lookupArea(
  input: string,
): { status: "yes"; town: string } | { status: "outside" } | { status: "outOfState"; state: string } | { status: "unknown" } | { status: "invalid" } {
  const raw = input.trim();
  if (!raw) return { status: "invalid" };
  const zip = raw.match(/^(\d{5})(-\d{4})?$/)?.[1];
  if (zip) {
    const town = serviceZips.get(zip);
    if (town) return { status: "yes", town };
    const state = stateForZip(zip);
    // Only the ZIPs listed above can book (Sam, 2026-11-14): inside the circle and in Pennsylvania.
    return state === "PA" ? { status: "outside" } : { status: "outOfState", state };
  }
  if (/^[\d\s-]+$/.test(raw)) return { status: "invalid" };
  const town = byName.get(clean(raw));
  return town ? { status: "yes", town } : { status: "unknown" };
}
