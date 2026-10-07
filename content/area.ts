// Service area. Towns come from the current site: the visible list (Doylestown, Warwick,
// New Britain, Chalfont, Buckingham) plus the ones in its schema markup (Jamison, Newtown,
// Yardley, Warrington). CONFIRM Newtown and Yardley, since they only appear in the schema.
// Coordinates are approximate town centers and only position pins on the drawn map.

export interface Town {
  name: string;
  /** Shown under the name on the map */
  sub?: string;
  lat: number;
  lon: number;
  zips: string[];
  /** Nudge the map label when two pins sit close together */
  label?: "left" | "right" | "below";
}

export const towns: Town[] = [
  { name: "Jamison", sub: "Warwick Twp.", lat: 40.2546, lon: -75.0868, zips: ["18929"], label: "below" },
  { name: "Doylestown", lat: 40.3101, lon: -75.1299, zips: ["18901", "18902"] },
  { name: "New Britain", lat: 40.299, lon: -75.1813, zips: ["18901"], label: "right" },
  { name: "Chalfont", lat: 40.2884, lon: -75.2093, zips: ["18914"], label: "below" },
  { name: "Buckingham", lat: 40.3207, lon: -75.0613, zips: ["18912"], label: "right" },
  { name: "Warrington", lat: 40.249, lon: -75.158, zips: ["18976"], label: "below" },
  { name: "Newtown", lat: 40.229, lon: -74.9368, zips: ["18940"], label: "below" },
  { name: "Yardley", lat: 40.2457, lon: -74.846, zips: ["19067"], label: "left" },
];

/** Rough course of the Delaware River for the map's east edge (New Hope down to Morrisville). */
export const delaware: Array<[lat: number, lon: number]> = [
  [40.3643, -74.9513],
  [40.336, -74.928],
  [40.2934, -74.8724],
  [40.2655, -74.8455],
  [40.2457, -74.8352],
  [40.2245, -74.8053],
  [40.2115, -74.7882],
];

export const serviceZips = new Map<string, string>(
  towns.flatMap((t) => t.zips.map((z) => [z, t.name] as [string, string])),
);

export function lookupArea(input: string): { status: "yes"; town: string } | { status: "ask" } | { status: "invalid" } {
  const raw = input.trim();
  if (!raw) return { status: "invalid" };
  if (/^\d{5}$/.test(raw)) {
    const town = serviceZips.get(raw);
    return town ? { status: "yes", town } : { status: "ask" };
  }
  if (/^\d+$/.test(raw)) return { status: "invalid" };
  const needle = raw.toLowerCase().replace(/,?\s*(pa|pennsylvania)$/, "").trim();
  const hit = towns.find(
    (t) => t.name.toLowerCase() === needle || (t.sub && t.sub.toLowerCase().replace(".", "") === needle.replace(".", "")),
  );
  if (hit) return { status: "yes", town: hit.name };
  if (needle === "warwick" || needle === "warwick township") return { status: "yes", town: "Jamison" };
  return { status: "ask" };
}
