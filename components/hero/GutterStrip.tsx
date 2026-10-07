import styles from "./Hero.module.css";

// The roof edge and gutter across the top of the page, drawn in front elevation.
// Left of the nozzle: clean. Right of it: a packed run, leaves and needles over the lip.
// All lengths are px (no viewBox) so the patterns tile cleanly at any width.

/** Small deterministic PRNG so the debris looks scattered but renders identically every time. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEAF = "M0 0C3.5-4.6 11-4.6 15 0 11 4.6 3.5 4.6 0 0Z";
const LEAF_COLORS = ["#b4652f", "#6b4a2e", "#c8923a", "#4a3826", "#8a6a2f", "#a3521f"];
/** Debris svg is 56px tall; the gutter lip sits at y = LIP inside it. */
const LIP = 32;

function debrisTile(seed: number, width: number, leaves: number, needles: number) {
  const r = rng(seed);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < needles; i++) {
    const x = 4 + r() * (width - 24);
    const len = 12 + r() * 14;
    const ang = (-150 + r() * 120) * (Math.PI / 180);
    const y = LIP + 2 - r() * 6;
    items.push(
      <path
        key={`n${i}`}
        d={`M${x.toFixed(1)} ${y.toFixed(1)}l${(Math.cos(ang) * len).toFixed(1)} ${(Math.sin(ang) * len).toFixed(1)}`}
        stroke={r() > 0.5 ? "#7a5a34" : "#5e4428"}
        strokeWidth={1.2 + r() * 0.5}
        strokeLinecap="round"
      />,
    );
  }
  for (let i = 0; i < leaves; i++) {
    const x = 6 + r() * (width - 34);
    const y = LIP - 4 - r() * 16;
    const rot = -80 + r() * 160;
    const s = 1.15 + r() * 0.7;
    items.push(
      <path
        key={`l${i}`}
        d={LEAF}
        transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${s.toFixed(2)})`}
        fill={LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)]}
        stroke="#33251a"
        strokeWidth={0.7 / s}
      />,
    );
  }
  return items;
}

function Shingles() {
  // Three courses, shortest at the top so the roof plane reads as tilting away.
  const courses = [
    { y: 0, h: 18, tab: 34, off: 0 },
    { y: 18, h: 22, tab: 40, off: 20 },
    { y: 40, h: 26, tab: 46, off: 0 },
  ];
  return (
    <>
      <defs>
        {courses.map((c, i) => (
          <pattern key={i} id={`course-${i}`} width={c.tab * 2} height={c.h} patternUnits="userSpaceOnUse" x={c.off}>
            <rect width={c.tab} height={c.h} fill="#4a545e" />
            <rect x={c.tab} width={c.tab} height={c.h} fill="#525c67" />
            <rect y={c.h - 4} width={c.tab * 2} height="4" fill="#2c343c" />
            <rect x={c.tab - 1} y={c.h * 0.35} width="2" height={c.h} fill="#262d34" />
            <rect x={c.tab * 2 - 1} y={c.h * 0.35} width="2" height={c.h} fill="#262d34" />
          </pattern>
        ))}
      </defs>
      {courses.map((c, i) => (
        <rect key={i} y={c.y} width="100%" height={c.h} fill={`url(#course-${i})`} />
      ))}
    </>
  );
}

export function GutterStrip() {
  return (
    <div className={styles.strip} aria-hidden="true">
      <svg className={styles.roof} width="100%" height="74">
        <Shingles />
        <rect y="66" width="100%" height="8" fill="#dfe4e8" />
        <path d="M0 66.5H6000M0 73.5H6000" stroke="#2c343c" strokeWidth="1" />
      </svg>

      <svg className={styles.debris} height="56">
        <defs>
          <pattern id="debris-a" width="260" height="56" patternUnits="userSpaceOnUse">
            {debrisTile(7, 260, 15, 22)}
          </pattern>
          <pattern id="debris-b" width="370" height="56" patternUnits="userSpaceOnUse">
            {debrisTile(23, 370, 12, 16)}
          </pattern>
        </defs>
        {/* the packed mat just under the lip */}
        <rect y={LIP - 4} width="100%" height="8" fill="#3b2c1f" />
        <rect width="100%" height="56" fill="url(#debris-b)" />
        <rect width="100%" height="56" fill="url(#debris-a)" />
      </svg>

      <div className={`${styles.face} gutter-face`} />

      <svg className={styles.overhang} height="40">
        <defs>
          <pattern id="overhang" width="430" height="40" patternUnits="userSpaceOnUse">
            <path d={LEAF} transform="translate(40 1) rotate(80) scale(1.5)" fill="#b4652f" stroke="#33251a" strokeWidth="0.5" />
            <path d={LEAF} transform="translate(58 3) rotate(100) scale(1.2)" fill="#6b4a2e" stroke="#33251a" strokeWidth="0.5" />
            <path d={LEAF} transform="translate(196 1) rotate(70) scale(1.35)" fill="#c8923a" stroke="#33251a" strokeWidth="0.5" />
            <path d={LEAF} transform="translate(330 0) rotate(92) scale(1.6)" fill="#6b4a2e" stroke="#33251a" strokeWidth="0.5" />
            <path d="M120 0l5 16M129 0l-3 14M262 1l6 13M276 0l-1 11" stroke="#7a5a34" strokeWidth="1.3" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect width="100%" height="40" fill="url(#overhang)" />
      </svg>

      <span className={styles.glint} />

      {/* Gooseneck: rises in front of the face, arcs over the lip, drops in behind it */}
      <svg className={styles.neck} width="96" height="140" viewBox="0 0 96 140">
        <path d="M30 140V54C30 18 82 18 82 54V66" fill="none" stroke="#1b2129" strokeWidth="9" />
        <path d="M27.5 140V54C27.5 24 56 16 70 26" fill="none" stroke="#5b6672" strokeWidth="1.6" />
        <rect x="24.5" y="92" width="11" height="8" rx="1" fill="#3bb0ee" />
      </svg>
    </div>
  );
}
