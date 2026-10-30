// A cord of wood drawn at scale, the firewood counterpart of the pricing street's houses.
// Every size shows the same 8 x 4 ft face. Only the depth changes, so the drawing explains
// what a quarter, half and full cord are without a table. Log ends are generated once with a
// seeded generator and reused through <use>, which keeps the markup small.

const SCALE = 30; // px per foot
const FACE_W = 8 * SCALE;
const FACE_H = 4 * SCALE;
/** Up and to the right, per log of depth */
const DEPTH_X = 13;
const DEPTH_Y = 9;
const SNOW = 13;

const WOOD = ["#c9a26b", "#b98b54", "#d6b27e", "#a97b47", "#cfa873"];

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function LogEnds() {
  const r = rng(17);
  const logs: React.ReactNode[] = [];
  const rows = 8;
  const rowH = FACE_H / rows;
  for (let row = 0; row < rows; row++) {
    const y = FACE_H - rowH / 2 - row * rowH;
    const offset = row % 2 ? rowH / 2 : 0;
    for (let x = offset; x < FACE_W + rowH; x += rowH) {
      const rad = rowH * (0.46 + r() * 0.1);
      const cx = (x + (r() - 0.5) * 2.4).toFixed(1);
      const cy = (y + (r() - 0.5) * 1.6).toFixed(1);
      logs.push(
        <g key={`${row}-${x}`}>
          <circle cx={cx} cy={cy} r={rad.toFixed(1)} fill={WOOD[Math.floor(r() * WOOD.length)]} stroke="#4a2e1b" strokeWidth="1.2" />
          <circle cx={cx} cy={cy} r={(rad * 0.45).toFixed(1)} fill="none" stroke="#8a5f33" strokeWidth="0.7" />
        </g>,
      );
    }
  }
  return <>{logs}</>;
}

/** Render once on the page, before any CordStack. */
export function CordDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <clipPath id="kgw-face-clip">
          <rect width={FACE_W} height={FACE_H} />
        </clipPath>
        <g id="kgw-face" clipPath="url(#kgw-face-clip)">
          <rect width={FACE_W} height={FACE_H} fill="#3a2416" />
          <LogEnds />
        </g>
      </defs>
    </svg>
  );
}

export function cordDrawingWidth(depthLogs: number) {
  return FACE_W + DEPTH_X * depthLogs + 4;
}

export function CordStack({ depthLogs, label, className }: { depthLogs: number; label: string; className?: string }) {
  const width = cordDrawingWidth(depthLogs);
  const top = DEPTH_Y * depthLogs + SNOW;
  const height = FACE_H + top + 8;
  const back = { x: DEPTH_X * depthLogs, y: top - DEPTH_Y * depthLogs };
  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {/* back to front, so each row of logs shows behind the one in front of it */}
      {Array.from({ length: depthLogs }, (_, i) => depthLogs - 1 - i).map((d) => (
        <g key={d} transform={`translate(${DEPTH_X * d} ${top - DEPTH_Y * d})`}>
          <use href="#kgw-face" />
          {d > 0 && <rect width={FACE_W} height={FACE_H} fill="#20120a" opacity={0.28 + 0.1 * d} />}
        </g>
      ))}
      {/* snow lying along the top of the stack */}
      <path
        d={`M0 ${top + 1} C14 ${top - 8} 30 ${top - 6} 46 ${top - 9} S${FACE_W * 0.45} ${back.y - 7} ${back.x + FACE_W * 0.5} ${back.y - 8} S${back.x + FACE_W - 14} ${back.y - 6} ${back.x + FACE_W} ${back.y + 2} L${back.x + FACE_W - 12} ${back.y + 6} L${FACE_W} ${top + 8} C${FACE_W * 0.7} ${top + 3} ${FACE_W * 0.4} ${top + 9} ${FACE_W * 0.2} ${top + 4} C${FACE_W * 0.1} ${top + 2} 8 ${top + 9} 0 ${top + 1}Z`}
        fill="#fff"
        stroke="#c9c2b8"
        strokeWidth="1"
      />
      {/* ground */}
      <path d={`M0 ${top + FACE_H + 1}H${width}`} stroke="#2b1a14" strokeWidth="2.5" />
    </svg>
  );
}
