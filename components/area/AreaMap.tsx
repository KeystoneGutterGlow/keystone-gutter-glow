import { KeystoneMark } from "@/components/Keystone";
import { delaware, towns } from "@/content/area";

// Towns placed by real coordinates on a simple equirectangular projection, with the
// Delaware River for orientation. Keystone pins, like the state's route markers.

const LON_MIN = -75.245;
const LAT_MAX = 40.347;
const COS_LAT = Math.cos((40.28 * Math.PI) / 180);
const K = 2819; // px per degree of latitude; 1000 px wide covers the area
const MILE_PX = K / 69;

function project(lat: number, lon: number): [number, number] {
  return [(lon - LON_MIN) * COS_LAT * K, (LAT_MAX - lat) * K];
}

export function AreaMap() {
  const river = delaware.map(([lat, lon]) => project(lat, lon));
  const riverPath =
    "M" + river.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");

  return (
    <svg viewBox="0 0 1000 400" role="img" aria-labelledby="map-title" style={{ width: "100%", height: "auto" }}>
      <title id="map-title">{`Map of the service area in Bucks County, Pennsylvania: ${towns
        .map((t) => t.name)
        .join(", ")}, with the Delaware River to the east.`}</title>
      <defs>
        <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#0d2a4e" strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="1000" height="400" fill="url(#map-grid)" />

      {/* New Jersey side, past the river */}
      <path d={`${riverPath} L1000 400 L1000 0 Z`} fill="#0d2a4e" fillOpacity="0.05" />
      <path d={riverPath} fill="none" stroke="#3bb0ee" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <text x="905" y="120" className="mapNote" transform="rotate(62 905 120)">
        Delaware River
      </text>
      <text x="960" y="250" className="mapNote mapNj">
        NJ
      </text>

      <text x="24" y="40" className="mapCounty">
        Bucks County, PA
      </text>

      {towns.map((t) => {
        const [x, y] = project(t.lat, t.lon);
        const pos = t.label ?? "right";
        const tx = pos === "left" ? x - 18 : pos === "below" ? x : x + 18;
        const ty = pos === "below" ? y + 38 : y + 5;
        const anchor = pos === "left" ? "end" : pos === "below" ? "middle" : "start";
        return (
          <g key={t.name}>
            <KeystoneMark x={x} y={y} scale={0.72} fill="var(--navy)" />
            <text x={tx} y={ty} textAnchor={anchor} className="mapTown">
              {t.name}
            </text>
            {t.sub && (
              <text x={tx} y={ty + 17} textAnchor={anchor} className="mapSub">
                {t.sub}
              </text>
            )}
          </g>
        );
      })}

      {/* scale bar + north */}
      <g transform="translate(24 360)">
        <path d={`M0 0V8H${(5 * MILE_PX).toFixed(1)}V0`} fill="none" stroke="#0d2a4e" strokeWidth="1.5" />
        <text x={5 * MILE_PX + 10} y="9" className="mapSub">
          5 miles
        </text>
      </g>
      <g transform="translate(36 300)">
        <path d="M0 -18L7 4L0 0L-7 4Z" fill="#0d2a4e" />
        <text x="0" y="22" textAnchor="middle" className="mapSub">
          N
        </text>
      </g>
    </svg>
  );
}
