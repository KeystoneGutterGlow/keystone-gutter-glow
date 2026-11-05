import { CordGroup, cordDrawingHeight } from "./CordStacks";

// The yard around the woodpile: a hemlock treeline, bare ground with chips from splitting, a
// chopping block, and the rings of a cut log. Hemlocks keep their needles all year, so nothing here
// ties the page to a season. Nothing carries information except the hero's own label.

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

/** One hemlock: a narrow top, drooping tiers, and uneven tips. */
function hemlock(x: number, base: number, height: number, r: () => number) {
  const tiers = 7;
  const width = height * 0.3;
  const right: string[] = [];
  const left: string[] = [];
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers;
    const y = base - height + height * 0.94 * t;
    const reach = width * t * (0.82 + r() * 0.3);
    const back = reach * (0.48 + r() * 0.12);
    right.push(`L${f(x + reach)} ${f(y + 4)}L${f(x + back)} ${f(y - 2)}`);
    const leftReach = width * t * (0.82 + r() * 0.3);
    left.unshift(`L${f(x - leftReach * (0.5 + r() * 0.1))} ${f(y - 2)}L${f(x - leftReach)} ${f(y + 4)}`);
  }
  return `M${f(x)} ${f(base - height)}${right.join("")}L${f(x + 2.5)} ${f(base)}L${f(x - 2.5)} ${f(base)}${left.join("")}Z`;
}

function treeline(width: number, base: number, min: number, max: number, step: number, seed: number) {
  const r = rng(seed);
  let d = "";
  for (let x = -10; x < width + 20; x += step * (0.7 + r() * 0.6)) {
    d += hemlock(x, base, min + r() * (max - min), r);
  }
  return d;
}

/** Hemlocks along the top of the footer, so the page ends at the edge of the woods. */
export function Treeline({ className, fill = "var(--navy-deep)" }: { className?: string; fill?: string }) {
  const W = 1920;
  const H = 150;
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path d={treeline(W, H, 44, 96, 62, 23)} fill={fill} opacity="0.32" />
      <path d={treeline(W, H, 72, 144, 96, 11)} fill={fill} />
      <rect y={H - 2} width={W} height="2" fill={fill} />
    </svg>
  );
}

/** The rings of a cut log, off center, with the crack every drying round gets. */
export function TreeRings({ className }: { className?: string }) {
  const r = rng(9);
  const rings: string[] = [];
  const phaseA = r() * 6;
  const phaseB = r() * 6;
  const count = 19;
  for (let i = 1; i <= count; i++) {
    const base = 11 + i * 10.4 + (i % 4 === 0 ? 3 : 0);
    const off = (i / count) * 22;
    let d = "";
    for (let s = 0; s <= 48; s++) {
      const a = (s / 48) * Math.PI * 2;
      const wobble = 1 + 0.026 * Math.sin(a * 3 + phaseA) + 0.016 * Math.sin(a * 7 + phaseB) + 0.006 * Math.sin(a * 13 + i);
      const rad = base * wobble;
      d += `${s ? "L" : "M"}${f(250 + off + Math.cos(a) * rad)} ${f(250 - off * 0.5 + Math.sin(a) * rad)}`;
    }
    rings.push(`${d}Z`);
  }
  return (
    <svg className={className} viewBox="0 0 500 500" fill="none" aria-hidden="true" focusable="false">
      <path d={rings.join("")} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d="M252 250L268 214L262 178L281 132L276 88L292 52" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d="M252 250L228 276L232 306L212 338" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A round on end with a hatchet set in the top, at 0,0 on the ground. */
function ChoppingBlock({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-52 -2C-54 -30 -53 -58 -50 -78H50C53 -58 54 -30 52 -2C30 8 -30 8 -52 -2Z" fill="#6b4529" stroke="#2b1a14" strokeWidth="2" strokeLinejoin="round" />
      <path d="M-38 -66C-40 -46 -38 -26 -40 -6M-20 -66C-18 -48 -22 -22 -20 0M4 -66C6 -44 2 -24 6 2M26 -66C24 -48 30 -26 28 -2M42 -68C44 -48 42 -28 44 -6" stroke="#2b1a14" strokeWidth="1.2" opacity="0.55" fill="none" />
      <ellipse cy="-78" rx="50" ry="14" fill="#d6b27e" stroke="#2b1a14" strokeWidth="2" />
      <ellipse cy="-78" cx="-3" rx="36" ry="9.5" fill="none" stroke="#8a5f33" strokeWidth="0.9" />
      <ellipse cy="-78" cx="-5" rx="21" ry="5.5" fill="none" stroke="#8a5f33" strokeWidth="0.9" />
      {/* the handle first, then the head with its edge buried in the wood */}
      <path d="M-3 -108C-14 -130 -36 -152 -62 -172C-66 -176 -60 -184 -54 -180C-26 -162 -2 -138 8 -112Z" fill="#c29660" stroke="#2b1a14" strokeWidth="2" strokeLinejoin="round" />
      <path d="M-40 -158C-26 -146 -14 -132 -6 -118" stroke="#8a5f33" strokeWidth="1" fill="none" />
      <path d="M-11 -117L11 -122C13 -106 21 -92 31 -81C12 -74 -8 -73 -28 -76C-19 -88 -13 -102 -11 -117Z" fill="#59646c" stroke="#2b1a14" strokeWidth="2" strokeLinejoin="round" />
      <path d="M-18 -83C-4 -87 12 -88 24 -87" stroke="#b6c0c7" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M-30 -74C-10 -71 12 -71 33 -79" stroke="#2b1a14" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** A row of hemlocks whose height depends on where along the row they stand. */
function woods(width: number, base: number, step: number, seed: number, height: (t: number) => number) {
  const r = rng(seed);
  let d = "";
  for (let x = -10; x < width + 20; x += step * (0.7 + r() * 0.6)) {
    d += hemlock(x, base, height(x / width) * (0.72 + r() * 0.28), r);
  }
  return d;
}

/**
 * The woods behind the whole hero, edge to edge. It's anchored to the bottom right, so the
 * tallest trees fill the space above the woodpile and the low ones stay quiet behind the headline.
 */
export function HeroWoods({ className }: { className?: string }) {
  const W = 1600;
  const H = 1000;
  const ground = 940;
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">
      <path d={`M0 ${ground - 150}C300 ${ground - 230} 620 ${ground - 120} 900 ${ground - 210}S1380 ${ground - 330} ${W} ${ground - 240}V${ground}H0Z`} fill="#f1f1ea" />
      <path d={woods(W, ground, 42, 5, (t) => 170 + t * 400)} fill="#e9ece3" />
      <path d={woods(W, ground, 104, 14, (t) => 210 + t * t * 700)} fill="#dde3d6" />
      <path d={`M0 ${ground - 8}C260 ${ground - 22} 520 ${ground + 4} 800 ${ground - 4}S1320 ${ground - 14} ${W} ${ground - 4}V${H}H0Z`} fill="#eee6d8" stroke="#cdbfa8" strokeWidth="1.5" />
    </svg>
  );
}

/** Chips and bark knocked off while splitting, scattered on the ground around the block. */
function Chips({ x, y, spread, count, seed }: { x: number; y: number; spread: number; count: number; seed: number }) {
  const r = rng(seed);
  const chips: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const cx = x + (r() - 0.5) * spread;
    const cy = y + r() * 14;
    const w = 5 + r() * 9;
    const h = 1.6 + r() * 2.4;
    const rot = -30 + r() * 60;
    const bark = r() > 0.6;
    chips.push(
      <path
        key={i}
        d={`M${f(-w / 2)} 0L${f(-w / 2 + 2)} ${f(-h)}L${f(w / 2)} ${f(-h * 0.6)}L${f(w / 2 - 1)} ${f(h * 0.4)}Z`}
        transform={`translate(${f(cx)} ${f(cy)}) rotate(${rot.toFixed(0)})`}
        fill={bark ? "#6b4529" : "#d6b27e"}
        stroke="#4a2e1b"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />,
    );
  }
  return <>{chips}</>;
}

/** The woodpile and the chopping block, standing on bare ground in front of the woods. */
export function HeroScene({ className, label }: { className?: string; label: string }) {
  const W = 806;
  const H = 432;
  const ground = 392;
  const depth = 2;
  const scale = 2.36;
  const stackX = 168;
  const stackY = ground - cordDrawingHeight(depth) * scale + 4;
  const yard = `M0 ${ground + 22}C70 ${ground + 14} 120 ${ground + 20} 190 ${ground + 9}S330 ${ground + 12} 470 ${ground + 6}S700 ${ground + 11} ${W} ${ground + 4}`;
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <defs>
        <linearGradient id="kgw-yard-fade">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.12" stopColor="#fff" />
        </linearGradient>
        <mask id="kgw-yard-mask">
          <rect width={W} height={H} fill="url(#kgw-yard-fade)" />
        </mask>
      </defs>
      <g transform={`translate(${stackX} ${stackY}) scale(${scale})`}>
        <CordGroup depthLogs={depth} />
      </g>
      <ChoppingBlock x={84} y={ground + 8} />
      {/* the ground in front of the pile and the block, with the chips from splitting */}
      <g mask="url(#kgw-yard-mask)">
        <path d={`${yard}V${H}H0Z`} fill="#eee6d8" />
        <path d={yard} fill="none" stroke="#cdbfa8" strokeWidth="1.2" />
        <Chips x={92} y={ground + 14} spread={190} count={16} seed={31} />
        <Chips x={430} y={ground + 10} spread={420} count={9} seed={44} />
      </g>
    </svg>
  );
}
