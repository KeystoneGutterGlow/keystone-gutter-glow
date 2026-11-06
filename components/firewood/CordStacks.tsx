// A cord of wood drawn at scale, the firewood counterpart of the pricing street's houses.
// Every size shows the same 8 x 4 ft face. Only the depth changes, so the drawing explains
// what a quarter, half and full cord are without a table. Split ends are generated once with a
// seeded generator and reused through <use>, which keeps the markup small.

const SCALE = 30; // px per foot
const FACE_W = 8 * SCALE;
const FACE_H = 4 * SCALE;
/** Up and to the right, per log of depth */
const DEPTH_X = 13;
const DEPTH_Y = 9;
/** Room above the back edge of the stack */
const TOP_PAD = 2;
const ROWS = 8;

const WOOD = ["#c9a26b", "#b98b54", "#d6b27e", "#a97b47", "#cfa873"];

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An uneven closed shape around a center, so a log end reads as split wood and not a circle. */
function splitEnd(cx: number, cy: number, rad: number, r: () => number, wobble: number) {
  const n = 7;
  const start = r() * Math.PI * 2;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = start + (i / n) * Math.PI * 2;
    const d = rad * (1 - wobble + r() * wobble * 2);
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d] as const;
  });
  let d = "";
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const next = pts[(i + 1) % n]!;
    const mid = [(p[0] + next[0]) / 2, (p[1] + next[1]) / 2];
    d += `${i ? "" : `M${((pts[n - 1]![0] + p[0]) / 2).toFixed(1)} ${((pts[n - 1]![1] + p[1]) / 2).toFixed(1)}`}Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${mid[0]!.toFixed(1)} ${mid[1]!.toFixed(1)}`;
  }
  return `${d}Z`;
}

function LogEnds({ width, height, rows, seed }: { width: number; height: number; rows: number; seed: number }) {
  const r = rng(seed);
  const logs: React.ReactNode[] = [];
  const rowH = height / rows;
  for (let row = 0; row < rows; row++) {
    const y = height - rowH / 2 - row * rowH;
    const offset = row % 2 ? rowH / 2 : 0;
    for (let x = offset; x < width + rowH; x += rowH) {
      const rad = rowH * (0.48 + r() * 0.1);
      const cx = x + (r() - 0.5) * rowH * 0.16;
      const cy = y + (r() - 0.5) * rowH * 0.12;
      const heartX = cx + (r() - 0.5) * rad * 0.5;
      const heartY = cy + (r() - 0.5) * rad * 0.5;
      logs.push(
        <g key={`${row}-${x}`}>
          <path d={splitEnd(cx, cy, rad, r, 0.1)} fill={WOOD[Math.floor(r() * WOOD.length)]} stroke="#4a2e1b" strokeWidth="1.2" />
          <path d={splitEnd(heartX, heartY, rad * 0.56, r, 0.08)} fill="none" stroke="#8a5f33" strokeWidth="0.6" />
          <circle cx={heartX.toFixed(1)} cy={heartY.toFixed(1)} r={(rad * 0.1).toFixed(1)} fill="#6d4726" />
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
          <LogEnds width={FACE_W} height={FACE_H} rows={ROWS} seed={17} />
        </g>
      </defs>
    </svg>
  );
}

export function cordDrawingWidth(depthLogs: number) {
  return FACE_W + DEPTH_X * depthLogs + 4;
}

export function cordDrawingHeight(depthLogs: number) {
  return FACE_H + DEPTH_Y * depthLogs + TOP_PAD + 3;
}

/** The stack itself: front face at the bottom left, the depth running up and to the right. */
export function CordGroup({ depthLogs }: { depthLogs: number }) {
  const dx = DEPTH_X * depthLogs;
  const dy = DEPTH_Y * depthLogs;
  const top = dy + TOP_PAD;
  const rowH = FACE_H / ROWS;
  const sideLines = Array.from({ length: ROWS - 1 }, (_, i) => {
    const y = top + rowH * (i + 1);
    return `M${FACE_W} ${y}L${FACE_W + dx} ${y - dy}`;
  }).join("");
  const back = top - dy;
  // The bark of the top row, seen from a little above: one ridge per log running back,
  // and a seam where each length of logs meets the next.
  const ridges = Array.from({ length: Math.ceil(FACE_W / rowH) }, (_, i) => {
    const x = rowH * (i + 0.5);
    return `M${x} ${top}L${x + dx} ${back}`;
  }).join("");
  const seams = Array.from({ length: depthLogs - 1 }, (_, k) => {
    const x = DEPTH_X * (k + 1);
    const y = top - DEPTH_Y * (k + 1);
    return `M${x} ${y}H${FACE_W + x}`;
  }).join("");

  return (
    <>
      {/* the long sides of the logs along the right */}
      <path d={`M${FACE_W} ${top}L${FACE_W + dx} ${top - dy}V${top - dy + FACE_H}L${FACE_W} ${top + FACE_H}Z`} fill="#5a3a24" stroke="#2b1a10" strokeWidth="1.2" />
      <path d={sideLines} stroke="#2b1a10" strokeWidth="1" opacity="0.7" />
      {/* the top of the stack */}
      <path d={`M0 ${top}L${dx} ${back}H${FACE_W + dx}L${FACE_W} ${top}Z`} fill="#7a5233" stroke="#2b1a10" strokeWidth="1.2" strokeLinejoin="round" />
      <path d={ridges} stroke="#a9794a" strokeWidth="1.1" opacity="0.8" />
      {seams && <path d={seams} stroke="#2b1a10" strokeWidth="0.9" opacity="0.6" />}
      <use href="#kgw-face" transform={`translate(0 ${top})`} />
    </>
  );
}

export function CordStack({ depthLogs, label, className }: { depthLogs: number; label: string; className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${cordDrawingWidth(depthLogs)} ${cordDrawingHeight(depthLogs)}`} role="img" aria-label={label}>
      <CordGroup depthLogs={depthLogs} />
    </svg>
  );
}

/** A full-width band of log ends, like walking past the end of a long woodpile. */
export function CordBand({ className }: { className?: string }) {
  const W = 1920;
  const H = 118;
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">
      <rect width={W} height={H} fill="#2a180e" />
      <LogEnds width={W} height={H} rows={3} seed={41} />
    </svg>
  );
}
