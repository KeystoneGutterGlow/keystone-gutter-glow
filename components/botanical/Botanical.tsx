// Plants from around Bucks County, drawn in the same thin linework as the rest of the site:
// mountain laurel (the state flower), oak and maple (what ends up in the gutters), ivy, and eastern
// hemlock (the state tree) for the firewood pages. All decoration, so every one is hidden from screen readers.
// Colors come from --bot-line and --bot-fill, so a section can restyle them. See DESIGN.md.
//
// Leaves and blossoms are drawn once, in <BotanicalDefs /> (rendered by the root layout), and every
// plant places copies with <use>. Writing each leaf's outline out in full made the home page's HTML
// about twice the size. The colour variables still reach the copies: they inherit from the <use>.

type P = [number, number];

const f = (n: number) => n.toFixed(1);

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A smooth curve through the points, as cubic segments. Starts from the current pen position. */
function curve(pts: P[]) {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** A leaf from its right-hand outline, base to tip. Base and tip stay pointed. */
function mirrored(right: P[]) {
  const left = [...right].reverse().map(([x, y]): P => [-x, y]);
  return `M${f(right[0]![0])} ${f(right[0]![1])}${curve(right)}${curve(left)}Z`;
}

function cubicAt(c: [P, P, P, P], t: number) {
  const u = 1 - t;
  const at = (i: 0 | 1) => u * u * u * c[0][i] + 3 * u * u * t * c[1][i] + 3 * u * t * t * c[2][i] + t * t * t * c[3][i];
  const tan = (i: 0 | 1) => 3 * u * u * (c[1][i] - c[0][i]) + 6 * u * t * (c[2][i] - c[1][i]) + 3 * t * t * (c[3][i] - c[2][i]);
  return { x: at(0), y: at(1), angle: (Math.atan2(tan(1), tan(0)) * 180) / Math.PI };
}

const cubicPath = (c: [P, P, P, P]) => `M${c[0].join(" ")}C${c[1].join(" ")} ${c[2].join(" ")} ${c[3].join(" ")}`;

// All three point up from a base at 0,0.
const SHAPES = {
  laurel: { d: mirrored([[0, 0], [6, -10], [9, -24], [6, -38], [0, -50]]), rib: "M0 0V-44" },
  oak: {
    d: mirrored([[0, 0], [9, -8], [13, -15], [8, -23], [19, -34], [22, -42], [10, -50], [22, -62], [23, -70], [10, -76], [15, -88], [8, -96], [0, -100]]),
    rib: "M0 8V-90M0 -30L14 -38M0 -30L-14 -38M0 -56L15 -66M0 -56L-15 -66",
  },
  ivy: {
    d: mirrored([[0, 0], [6, 2.5], [13, 0], [17, -8], [11, -13], [9, -20], [5, -27], [0, -36]]),
    rib: "M0 0V-28M0 -5L11 -5M0 -5L-11 -5",
  },
};

/** The shared shapes, once per page. Every plant below draws copies of these. */
export function BotanicalDefs() {
  // A mountain laurel blossom at radius 10: a cup with five shallow lobes and a ring of ten dots.
  const R = 10;
  const outline: P[] = [];
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * Math.PI * 2 - Math.PI / 2;
    const rad = R * (0.9 + 0.1 * Math.cos(a * 5 + Math.PI / 2));
    outline.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  const dots = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return `M${f(Math.cos(a) * R * 0.58)} ${f(Math.sin(a) * R * 0.58)}h.01`;
  }).join("");
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        {(Object.keys(SHAPES) as Array<keyof typeof SHAPES>).map((kind) => (
          <g key={kind} id={`bot-${kind}`}>
            <path d={SHAPES[kind].d} fill="var(--bot-fill)" stroke="var(--bot-line)" strokeWidth="1.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <path d={SHAPES[kind].rib} fill="none" stroke="var(--bot-line)" strokeWidth="0.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        <g id="bot-blossom">
          <path d={`M${f(outline[0]![0])} ${f(outline[0]![1])}${curve(outline)}Z`} fill="var(--bot-bloom, #fff)" stroke="var(--bot-line)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
          <circle r={R * 0.2} fill="none" stroke="var(--bot-line)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
          <path d={dots} stroke="var(--bot-line)" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </g>
      </defs>
    </svg>
  );
}

function Leaf({ kind, x = 0, y = 0, rot = 0, s = 1 }: { kind: keyof typeof SHAPES; x?: number; y?: number; rot?: number; s?: number }) {
  return <use href={`#bot-${kind}`} transform={`translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${+s.toFixed(3)})`} />;
}

/** A mountain laurel blossom of radius r (see BotanicalDefs). */
function Blossom({ x, y, r }: { x: number; y: number; r: number }) {
  return <use href="#bot-blossom" transform={`translate(${f(x)} ${f(y)}) scale(${+(r / 10).toFixed(3)})`} />;
}

function Art({ viewBox, className, children }: { viewBox: string; className?: string; children: React.ReactNode }) {
  return (
    <svg className={className} viewBox={viewBox} fill="none" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** Mountain laurel growing in from the right: a stem of glossy leaves ending in a cluster of blossoms. */
export function LaurelSprig({ className }: { className?: string }) {
  const stem: [P, P, P, P] = [[320, 214], [262, 196], [214, 142], [132, 104]];
  const leaves = [0.12, 0.27, 0.42, 0.56, 0.7, 0.82];
  const tip = cubicAt(stem, 1);
  return (
    <Art viewBox="0 0 320 276" className={className}>
      <path d={cubicPath(stem)} stroke="var(--bot-line)" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {leaves.map((t, i) => {
        const p = cubicAt(stem, t);
        return <Leaf key={t} kind="laurel" x={p.x} y={p.y} rot={p.angle + 90 + (i % 2 ? 50 : -56)} s={1.05 + (i % 3) * 0.14} />;
      })}
      {[-150, -96, -40, 16, 70, 124].map((rot, i) => (
        <Leaf key={rot} kind="laurel" x={tip.x} y={tip.y} rot={rot} s={i % 2 ? 1.2 : 1.42} />
      ))}
      {([[-16, -12], [6, -19], [-30, 4], [-6, 8], [-22, -32], [14, 2], [-40, -18]] as P[]).map(([dx, dy], i) => (
        <Blossom key={i} x={tip.x + dx} y={tip.y + dy} r={i === 1 ? 12 : 11} />
      ))}
    </Art>
  );
}

/** A low mountain laurel planted at 0,0. Goes inside another drawing, so it's a plain group. */
export function LaurelShrub({ x = 0, y = 0, s = 1 }: { x?: number; y?: number; s?: number }) {
  // Each leaf starts on a low dome and points away from the middle. Outer leaves are drawn first.
  const tiers: Array<[reach: number, angles: number[], size: number]> = [
    [38, [-78, -48, -18, 14, 44, 76], 0.72],
    [22, [-66, -30, 6, 38, 68], 0.62],
    [7, [-40, 2, 34], 0.5],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {tiers.flatMap(([reach, angles, size], t) =>
        angles.map((deg, i) => {
          const a = (deg * Math.PI) / 180;
          return <Leaf key={`${t}-${deg}`} kind="laurel" x={Math.sin(a) * reach * 1.25} y={-Math.cos(a) * reach * 0.82 - 3} rot={deg * 1.05} s={size + (i % 2) * 0.08} />;
        }),
      )}
      {([[-30, -58], [-20, -68], [-14, -57], [17, -70], [28, -62], [20, -58]] as P[]).map(([bx, by], i) => (
        <Blossom key={i} x={bx} y={by} r={6} />
      ))}
    </g>
  );
}

/** An oak twig with three leaves and a pair of acorns. */
export function OakSprig({ className }: { className?: string }) {
  const twig: [P, P, P, P] = [[12, 196], [50, 170], [92, 128], [128, 66]];
  const acorn = (x: number, y: number, rot: number) => (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M-7 0C-7 11 -3 18 0 21C3 18 7 11 7 0Z" fill="var(--bot-fill)" stroke="var(--bot-line)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      <path d="M-9 1C-8 -7 8 -7 9 1C5 3 -5 3 -9 1Z" fill="var(--bot-bloom, #fff)" stroke="var(--bot-line)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </g>
  );
  return (
    <Art viewBox="0 0 240 210" className={className}>
      <path d={cubicPath(twig)} stroke="var(--bot-line)" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d="M72 148C84 150 96 158 102 170" stroke="var(--bot-line)" strokeWidth="1.1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <Leaf kind="oak" x={128} y={66} rot={22} s={0.62} />
      <Leaf kind="oak" x={102} y={118} rot={74} s={0.86} />
      <Leaf kind="oak" x={68} y={154} rot={-46} s={0.74} />
      {acorn(102, 174, -14)}
      {acorn(120, 164, -42)}
    </Art>
  );
}

/** A pair of maple helicopters and one oak leaf, coming down. */
export function FallingSeeds({ className }: { className?: string }) {
  const wing = "M0 0C-3 -10 -3 -24 2 -38C6 -44 12 -43 13 -36C13 -24 8 -10 3 1Z";
  const veins = "M1 -4C2 -14 5 -26 10 -36M1 -4C0 -14 1 -26 4 -36";
  const samara = (x: number, y: number, rot: number) => (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {[-1, 1].map((side) => (
        <g key={side} transform={`scale(${side} 1) rotate(34)`}>
          <path d={wing} fill="var(--bot-fill)" stroke="var(--bot-line)" strokeWidth="1.1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <path d={veins} fill="none" stroke="var(--bot-line)" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      <ellipse cx="-3.5" cy="1" rx="4" ry="3" fill="var(--bot-bloom, #fff)" stroke="var(--bot-line)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
      <ellipse cx="3.5" cy="1" rx="4" ry="3" fill="var(--bot-bloom, #fff)" stroke="var(--bot-line)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
    </g>
  );
  return (
    <Art viewBox="0 0 180 116" className={className}>
      {samara(30, 58, -18)}
      {samara(82, 98, 26)}
      <Leaf kind="oak" x={132} y={104} rot={18} s={0.62} />
    </Art>
  );
}

/** Ivy running along a line. `vertical` trails it downward instead of across. */
export function IvyRun({ className, length = 720, vertical, seed = 7 }: { className?: string; length?: number; vertical?: boolean; seed?: number }) {
  const r = rng(seed);
  const amp = 10;
  const mid = 46;
  const stem: P[] = [];
  for (let x = 0; x <= length; x += 30) stem.push([x, mid + Math.sin(x / 62) * amp + Math.sin(x / 23) * 2]);
  const leaves: React.ReactNode[] = [];
  const tendrils: string[] = [];
  let side = 1;
  for (let x = 26; x < length - 40; x += 44 + r() * 42) {
    const y = mid + Math.sin(x / 62) * amp + Math.sin(x / 23) * 2;
    // Leaves thin out and shrink toward the growing end.
    const s = (0.72 + r() * 0.44) * (1 - (x / length) * 0.42);
    leaves.push(<Leaf key={x} kind="ivy" x={x} y={y} rot={side * (58 + r() * 40)} s={s} />);
    if (r() > 0.62) {
      const d = -side;
      tendrils.push(`M${f(x + 12)} ${f(y)}c5 ${f(d * 7)} 13 ${f(d * 8)} 15 ${f(d * 2)}c1 ${f(d * -4)} -5 ${f(d * -4)} -5 0`);
    }
    side = -side;
  }
  const art = (
    <>
      <path d={`M${stem[0]![0]} ${f(stem[0]![1])}${curve(stem)}`} stroke="var(--bot-line)" strokeWidth="1.3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={tendrils.join("")} stroke="var(--bot-line)" strokeWidth="0.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {leaves}
    </>
  );
  return vertical ? (
    <Art viewBox={`0 0 92 ${length}`} className={className}>
      <g transform="translate(92 0) rotate(90)">{art}</g>
    </Art>
  ) : (
    <Art viewBox={`0 0 ${length} 92`} className={className}>
      {art}
    </Art>
  );
}

/** A bough of eastern hemlock with flat sprays of short needles and two small cones. */
export function HemlockBough({ className, seed = 3 }: { className?: string; seed?: number }) {
  const r = rng(seed);
  const main: [P, P, P, P] = [[330, 22], [250, 34], [150, 74], [28, 92]];
  let twigs = cubicPath(main);
  let needles = "";

  function spray(x: number, y: number, deg: number, len: number) {
    const a = (deg * Math.PI) / 180;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    for (let d = 2; d < len; d += 2.1) {
      const n = 5.6 * (1 - (d / len) * 0.45) * (0.8 + r() * 0.35);
      for (const side of [1, -1]) {
        const lean = a + side * 1.2;
        needles += `M${f(x + ux * d)} ${f(y + uy * d)}l${f(Math.cos(lean) * n)} ${f(Math.sin(lean) * n)}`;
      }
    }
  }

  const cones: P[] = [];
  const steps = 19;
  for (let i = 0; i < steps; i++) {
    const t = 0.05 + (i / steps) * 0.93;
    const p = cubicAt(main, t);
    const side = i % 2 ? 1 : -1;
    const len = 46 - t * 30 + r() * 10;
    const deg = p.angle + side * 52;
    const a = (deg * Math.PI) / 180;
    twigs += `M${f(p.x)} ${f(p.y)}l${f(Math.cos(a) * len)} ${f(Math.sin(a) * len)}`;
    spray(p.x, p.y, deg, len);
    if (i === 4 || i === 11) cones.push([p.x + Math.cos(a) * len * 0.72, p.y + Math.sin(a) * len * 0.72]);
  }
  const tip = cubicAt(main, 1);
  spray(tip.x, tip.y, 172, 20);
  for (let t = 0.02; t < 1; t += 0.012) {
    const p = cubicAt(main, t);
    spray(p.x, p.y, p.angle, 2.4);
  }

  return (
    <Art viewBox="0 0 330 170" className={className}>
      <path d={needles} stroke="var(--bot-needle, var(--bot-line))" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={twigs} stroke="var(--bot-line)" strokeWidth="1.3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {cones.map(([x, y], i) => (
        <g key={i} transform={`translate(${f(x)} ${f(y)})`}>
          <path d="M0 -3V2" stroke="var(--bot-line)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
          <ellipse cy="9" rx="5" ry="8" fill="var(--bot-fill)" stroke="var(--bot-line)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
          <path d="M-4.5 6Q0 9 4.5 6M-5 10Q0 13 5 10M-3.5 14Q0 16 3.5 14" stroke="var(--bot-line)" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </Art>
  );
}
