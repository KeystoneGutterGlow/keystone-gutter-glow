import styles from "./Hero.module.css";

// Bottom of the hero, Addendum A1's vacuum visual: the pole comes down from the gutter to a worker
// on the ground who steadies it, and a hose runs from its foot across the lawn to the vacuum on its
// cart. Unbranded, and drawn in the same flat, outlined style as the gutter above it.
//
// Three pieces so each can be placed against the pole (which sits at --nozzle) at any width:
//   .hose      the run along the ground, stretched between the pole and the cart
//   .operator  the worker and the pole's foot; x = 0 in its drawing is the middle of the pole
//   .unit      the vacuum and the last bend of hose up into its inlet
// Phones mirror all three, because the pole moves to the right-hand margin there.

const OUTLINE = "#0d2a4e";
const SKIN = "#d9a27c";
const SKIN_DARK = "#b98563";
const HOODIE = "#235a91";
const HOODIE_DARK = "#173f69";
const PANTS = "#2f3a46";
const PANTS_DARK = "#232c36";
const BOOT = "#6b4529";
const CAP = "#3bb0ee";

/** A limb as a thick rounded stroke with an outline: the outline is drawn first, a little wider. */
function Limb({ d, width, fill }: { d: string; width: number; fill: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={OUTLINE} strokeWidth={width + 3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={fill} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/** Head facing left, drawn upright around 0,0, then tipped back to look up the pole. */
function Head() {
  return (
    <g transform="translate(51 30) rotate(32)">
      {/* hair showing under the back of the cap */}
      <path d="M6 -6C13 -6 15 2 12 9C9 9 6 6 5 2Z" fill="#4a3424" stroke={OUTLINE} strokeWidth="1.2" />
      <circle r="12.5" fill={SKIN} stroke={OUTLINE} strokeWidth="1.5" />
      {/* nose and chin, so the face reads as a profile */}
      <path d="M-12 -3.5L-15.6 0.6L-12.2 2.2" fill={SKIN} stroke={OUTLINE} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M-10.5 6.5C-9 9.5 -6 11.5 -2.5 12.2" fill="none" stroke={OUTLINE} strokeWidth="1.1" opacity="0.5" />
      <ellipse cx="3" cy="1.5" rx="2.6" ry="3.6" fill={SKIN_DARK} stroke={OUTLINE} strokeWidth="1" />
      <circle cx="-6.5" cy="-1.5" r="1.25" fill={OUTLINE} />
      {/* cap: crown, a seam, and the brim pointing up the pole */}
      <path d="M-13 -1.5C-13.5 -17 13.5 -17.5 13.8 -1.5Z" fill={CAP} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M-1 -14.5C-3 -9 -3 -5 -2 -1.5" fill="none" stroke={OUTLINE} strokeWidth="1" opacity="0.6" />
      <path d="M-11.5 -3.2L-25 -2.4C-27 -2.2 -27 1.2 -25 1.2L-11 0.6Z" fill="#1d6fa3" stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  );
}

/**
 * The worker, and the foot of the pole where the hose joins it. Drawn around the middle of the
 * pole at x = 0, standing on the ground at y = 224. Shared with the vacuum tour further down.
 */
export function OperatorFigure() {
  return (
    <>
      {/* the pole's foot: a rubber cuff where the hose joins it (the hose itself is .hose, behind) */}
      <rect x="-7" y="204" width="14" height="19" rx="2.5" fill="#2b333c" stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M-7 209H7M-7 214H7" stroke="#4f5a66" strokeWidth="1" />

      {/* far arm, behind the body, reaching up to the higher grip */}
      <Limb d="M58 61L25 58L1 36" width={11} fill={HOODIE_DARK} />

      {/* back leg, then front leg */}
      <Limb d="M60 116L62 164L66 206" width={15} fill={PANTS_DARK} />
      <path d="M58 202H75V215L78 224H48C45.5 224 45 217 50 216L58 214Z" fill={BOOT} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M47 221H78" stroke="#3b2618" strokeWidth="2.6" />
      <Limb d="M50 116L42 164L36 206" width={15} fill={PANTS} />
      <path d="M28 202H45V215L48 224H18C15.5 224 15 217 20 216L28 214Z" fill={BOOT} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M17 221H48" stroke="#3b2618" strokeWidth="2.6" />
      <path d="M38 186L36 200" stroke={PANTS_DARK} strokeWidth="1" opacity="0.6" />

      {/* neck, then the hoodie: hood at the back, kangaroo pocket, ribbed hem */}
      <path d="M50 38L56 37L59 52L52 54Z" fill={SKIN_DARK} stroke={OUTLINE} strokeWidth="1.3" strokeLinejoin="round" />
      <path
        d="M47 58C52 53 62 52 69 56C72 70 72 96 70 120H43C42 106 41 94 42 84C42 72 43 63 47 58Z"
        fill={HOODIE}
        stroke={OUTLINE}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M58 52C64 44 74 48 72 60C70 62 66 60 64 56Z" fill={HOODIE_DARK} stroke={OUTLINE} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M44 98C50 96 58 96 62 99L61 112H43" fill="none" stroke={OUTLINE} strokeWidth="1.1" opacity="0.55" />
      <path d="M43 114H70" stroke={HOODIE_DARK} strokeWidth="3" />
      <path d="M43 120H70" stroke={OUTLINE} strokeWidth="1.5" />

      <Head />

      {/* near arm, in front of the body, to the lower grip */}
      <Limb d="M54 64L31 94L1 100" width={11.5} fill={HOODIE} />
      <path d="M8 98.6L13 97.4" stroke={HOODIE_DARK} strokeWidth="3" strokeLinecap="round" />

      {/* foam grip sleeve on the pole, then the hands closed round it */}
      <rect x="-6.5" y="86" width="13" height="30" rx="2" fill="#2b333c" stroke={OUTLINE} strokeWidth="1" />
      <path d="M-6.5 92H6.5M-6.5 98H6.5M-6.5 104H6.5M-6.5 110H6.5" stroke="#46505b" strokeWidth="1" />
      <path d="M-6 31C-6 27 6 27 6.5 31V40C6.5 43 -6 43 -6 40Z" fill={SKIN} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M-6 34.5H2M-6 37.5H2" stroke={OUTLINE} strokeWidth="0.9" opacity="0.6" />
      <path d="M-6 96C-6 92 6 92 6.5 96V105C6.5 108 -6 108 -6 105Z" fill={SKIN} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M-6 99.5H2M-6 102.5H2" stroke={OUTLINE} strokeWidth="0.9" opacity="0.6" />
    </>
  );
}

function Operator() {
  return (
    <svg className={styles.operator} viewBox="-12 -2 104 228" aria-hidden="true" focusable="false">
      <OperatorFigure />
    </svg>
  );
}

/** The vacuum: stainless drum, three-motor head, trolley with a push handle. Ground is y = 186. */
function Unit() {
  return (
    <svg className={styles.unit} viewBox="0 0 200 190" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="kgg-steel" x1="0" x2="1">
          <stop offset="0" stopColor="#8b97a2" />
          <stop offset="0.22" stopColor="#dde3e8" />
          <stop offset="0.34" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#d3dae0" />
          <stop offset="0.82" stopColor="#a3aeb8" />
          <stop offset="1" stopColor="#7c8893" />
        </linearGradient>
      </defs>

      {/* the last bend of hose, up off the grass into the inlet */}
      <path d="M0 181C22 181 6 98 26 98" fill="none" stroke="#1b2129" strokeWidth="7" strokeLinecap="round" />
      <path d="M0 181C22 181 6 98 26 98" fill="none" stroke="#4f5a66" strokeWidth="1.2" strokeDasharray="2 5" />

      {/* power cord off the back of the head, looping down to the ground */}
      <path d="M136 60C152 66 144 118 152 146S172 186 198 184" fill="none" stroke="#1b2129" strokeWidth="2.2" strokeLinecap="round" />

      {/* push handle, behind the drum */}
      <path d="M138 168L155 24" stroke="#3b4652" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M150 22L166 20" stroke="#1b2129" strokeWidth="8" strokeLinecap="round" />
      <path d="M132 104H148" stroke="#3b4652" strokeWidth="3.5" strokeLinecap="round" />

      {/* drum */}
      <path d="M48 66H132V160C132 166 120 170 90 170S48 166 48 160Z" fill="url(#kgg-steel)" stroke={OUTLINE} strokeWidth="1.6" />
      <path d="M48 82H132M48 152C60 156 120 156 132 152" fill="none" stroke="#6d7983" strokeWidth="1.4" />
      {/* plain spec plate, no maker's name */}
      <rect x="72" y="106" width="36" height="20" rx="1.5" fill="#fff" stroke={OUTLINE} strokeWidth="1.1" />
      <path d="M77 112H103M77 117H95M77 121.5H99" stroke="#9aa6b0" strokeWidth="1.3" />

      {/* inlet stub and the hose cuff on it */}
      <rect x="40" y="91" width="12" height="14" fill="#59646c" stroke={OUTLINE} strokeWidth="1.2" />
      <rect x="22" y="88" width="20" height="20" rx="3" fill="#2b333c" stroke={OUTLINE} strokeWidth="1.3" />
      <path d="M28 88V108M34 88V108" stroke="#46505b" strokeWidth="1" />

      {/* motor head: three motor caps, vents, the running light */}
      <path d="M57 42Q57 29 67 29T77 42M81 42Q81 27 91 27T101 42M105 42Q105 29 115 29T125 42" fill="#3b4652" stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M44 68V56Q44 40 62 40H120Q138 40 138 56V68Z" fill="#2c343c" stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M118 50H132M118 55H132M118 60H132" stroke="#59646c" strokeWidth="2" strokeLinecap="round" />
      <rect x="51" y="48" width="12" height="9" rx="1.5" fill="#1b2129" stroke="#59646c" strokeWidth="1" />
      <circle cx="57" cy="52.5" r="2.4" fill={CAP} />
      {/* latches holding the head on the drum */}
      <rect x="45" y="64" width="7" height="14" rx="1" fill="#8b97a2" stroke={OUTLINE} strokeWidth="1.1" />
      <rect x="128" y="64" width="7" height="14" rx="1" fill="#8b97a2" stroke={OUTLINE} strokeWidth="1.1" />
      {/* exhaust air off the motors: it's running */}
      <path d="M67 22C64 17 70 14 67 8M91 19C88 14 94 11 91 5M115 22C112 17 118 14 115 8" fill="none" stroke="#9aa6b0" strokeWidth="1.4" strokeLinecap="round" />

      {/* trolley base and wheels */}
      <path d="M42 170H142" stroke="#3b4652" strokeWidth="5" strokeLinecap="round" />
      <path d="M58 172L58 178" stroke="#3b4652" strokeWidth="3" />
      <circle cx="58" cy="179" r="7" fill="#1b2129" />
      <circle cx="58" cy="179" r="2.5" fill="#cdd4da" />
      <circle cx="128" cy="168" r="17.5" fill="#1b2129" />
      <circle cx="128" cy="168" r="11" fill="none" stroke="#3b4652" strokeWidth="2" />
      <circle cx="128" cy="168" r="4.5" fill="#cdd4da" />
    </svg>
  );
}

export function Rig() {
  return (
    <div
      className={styles.rig}
      role="img"
      aria-label="Drawing of our setup: a worker on the ground holds a long vacuum pole up to the gutter, and a hose runs from the foot of the pole to a vacuum tank on a wheeled cart."
    >
      <svg className={styles.hose} viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 11C25 11 30 7.5 50 9.5S80 12 100 11" fill="none" stroke="#1b2129" strokeWidth="7" vectorEffect="non-scaling-stroke" />
        <path
          d="M0 11C25 11 30 7.5 50 9.5S80 12 100 11"
          fill="none"
          stroke="#4f5a66"
          strokeWidth="1.2"
          strokeDasharray="2 5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <Operator />
      <Unit />
      <span className={styles.ground} />
    </div>
  );
}
