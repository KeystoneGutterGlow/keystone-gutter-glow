import { OperatorFigure } from "@/components/hero/Rig";
import styles from "./Machine.module.css";

// One drawing of Jimmy's whole setup, at true scale (50 units = 1 ft): the corner of a two-story
// house with the gutter's end cut away, the carbon pole, the worker, the hose, and the vacuum
// (a Cyclone Classic Pro: stainless tank, sky-blue three-motor head, side inlet, steel cart).
// MachineTour moves a camera over it by changing the viewBox, so nothing here moves on its own
// except the running details (fans, exhaust, the spin in the tank, debris in the line).
// Marked parts the tour drives: [data-leaf], [data-leaf-path], [data-seg], [data-flow],
// [data-head-cut], [data-tank-cut].

const NAVY = "#0d2a4e";
const CARBON = "#1b2129";
const CLAMP = "#2f7fd0";
const SKY = "#3bb0ee";
const LEAF = "M0 0C3.5-4.6 11-4.6 15 0 11 4.6 3.5 4.6 0 0Z";

/** The leaf's route, in order. The tour measures each part to place the leaf per chapter. */
export const leafSegments = [
  // sitting in the gutter, then into the nozzle's mouth
  "M348 304C347 307 346 309 345 311",
  // up the nozzle and round the silicone bend to the top of the pole
  "M345 311L364 266C372 252 392 262 392 300",
  // down the pole
  "M392 300L392 1462",
  // out of the pole's foot and along the hose to the side inlet
  "M392 1462L392 1473C470 1479 540 1477 590 1475C628 1474 626 1372 648 1372",
  // into the tank, round the spin, and down onto the pile
  "M648 1372L670 1373C676 1381 724 1383 729 1378C733 1372 676 1368 672 1379C668 1390 726 1394 728 1400C730 1408 690 1410 690 1420C690 1430 702 1436 704 1438",
];
const flowPath = leafSegments.slice(0, 4).join("");

/** Gutter leaves for the cut-away end of the gutter */
const gutterLeaves = [
  { x: 337, y: 307, r: -20, c: "#b4652f", s: 0.62 },
  { x: 341, y: 302, r: 25, c: "#6b4a2e", s: 0.55 },
  { x: 347, y: 300, r: -50, c: "#c8923a", s: 0.5 },
  { x: 336, y: 299, r: 70, c: "#8a6a2f", s: 0.5 },
];

function House() {
  return (
    <g>
      {/* gable-end wall, lap siding */}
      <rect x="-420" y="300" width="720" height="1180" fill="url(#kgt-siding)" />
      <path d="M300 300V1440" stroke={NAVY} strokeWidth="2" />
      <rect x="284" y="306" width="16" height="1134" fill="#fff" stroke={NAVY} strokeWidth="1.2" />
      {/* windows, one per floor, for scale */}
      {[560, 1090].map((y) => (
        <g key={y}>
          <rect x="52" y={y - 8} width="156" height="236" fill="#fff" stroke={NAVY} strokeWidth="2" />
          <rect x="66" y={y + 6} width="128" height="208" fill="#d7e8f3" stroke={NAVY} strokeWidth="1.5" />
          <path d={`M130 ${y + 6}V${y + 214}M66 ${y + 110}H194`} stroke="#fff" strokeWidth="5" />
          <path d={`M78 ${y + 70}L120 ${y + 22}M84 ${y + 96}L140 ${y + 34}`} stroke="#fff" strokeWidth="3" opacity="0.7" />
        </g>
      ))}
      {/* foundation */}
      <rect x="-420" y="1440" width="720" height="40" fill="#d9dde1" stroke={NAVY} strokeWidth="1.5" />
      {/* roof edge: shingles over a white rake board, down to the eave */}
      <polygon points="-420,-104 338,276 330,296 -420,-80" fill="#4a545e" stroke={NAVY} strokeWidth="1.5" />
      <polygon points="-420,-80 330,296 330,310 -420,-64" fill="#fff" stroke={NAVY} strokeWidth="1.5" />
      <path d="M300 310H330" stroke={NAVY} strokeWidth="1.5" />
      {/* fascia board the gutter hangs on */}
      <rect x="326" y="286" width="8" height="32" fill="#fff" stroke={NAVY} strokeWidth="1.2" />
    </g>
  );
}

/** The gutter's end, cut away so you can see what's in it */
function GutterEnd() {
  return (
    <g>
      {/* the inside of the run, going away from you */}
      <path d="M336.4 290V312.6H350.6L351.4 305Q349.6 301 351.6 297.5L354 288H336.4Z" fill="#e3e8ec" />
      <path d="M334 290V313Q334 316 337 316H349Q352 316 352.5 313L353.5 305Q351.5 302 353.5 299L356 290H358.5V288H354L351.6 297.5Q349.6 301 351.4 305L350.6 312.6H336.4V290Z" fill="#c5ced5" stroke={NAVY} strokeWidth="0.9" strokeLinejoin="round" />
      {/* the wet, packed layer on the floor */}
      <path d="M336.4 312.6V308.6Q340 307.4 343 308.4T350.9 308.2L350.6 312.6Z" fill="#3b2c1f" />
      {/* leaves and needles on top of it */}
      {gutterLeaves.map((l, i) => (
        <path key={i} d={LEAF} transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`} fill={l.c} stroke="#33251a" strokeWidth={0.6 / l.s} />
      ))}
      <path d="M338 305l5-3M344 306l4 2M339 301l2 4" stroke="#7a5a34" strokeWidth="0.6" strokeLinecap="round" />
      {/* hanger across the top */}
      <path d="M334 291H355" stroke="#8b97a2" strokeWidth="0.8" />
    </g>
  );
}

function PoleAndNozzle() {
  const joints = [1262, 1062, 862, 662, 462];
  return (
    <g>
      {/* carbon pole, the Kevlar handle section at the bottom */}
      <rect x="388.5" y="300" width="7" height="1162" fill={CARBON} />
      <rect x="388.5" y="1262" width="7" height="200" fill="url(#kgt-kevlar)" />
      <path d="M390 304V1458" stroke="#4f5a66" strokeWidth="0.8" />
      {/* quick-release clamps every four feet */}
      {joints.map((y) => (
        <g key={y}>
          <rect x="386.5" y={y - 6} width="11" height="11" rx="1.2" fill={CLAMP} stroke={NAVY} strokeWidth="0.8" />
          <path d={`M397.5 ${y - 4}L401.5 ${y - 1}V${y + 3}H397.5`} fill="#cdd4da" stroke={NAVY} strokeWidth="0.6" />
        </g>
      ))}
      {/* 135° silicone bend, clamped onto the pole and the nozzle */}
      <path d="M392 300C392 262 372 252 364 266" fill="none" stroke={NAVY} strokeWidth="11.5" strokeLinecap="butt" />
      <path d="M392 300C392 262 372 252 364 266" fill="none" stroke="#2d8fd6" strokeWidth="9.5" strokeLinecap="butt" />
      <path d="M389.5 296C389.5 268 375 259 368 266" fill="none" stroke="#7cc6f2" strokeWidth="1.6" />
      <rect x="386" y="293" width="12" height="4" fill="#cdd4da" stroke={NAVY} strokeWidth="0.6" />
      {/* aluminum nozzle, angled down into the trough */}
      <path d="M364 266L345 311" stroke={NAVY} strokeWidth="9.5" />
      <path d="M364 266L345 311" stroke="#d3dae0" strokeWidth="7.5" />
      <path d="M362 264.5L344 307" stroke="#f4f6f8" strokeWidth="1.6" />
      <ellipse cx="345" cy="311" rx="4" ry="1.6" transform="rotate(-23 345 311)" fill="#3b4652" />
      <rect x="360" y="263" width="8" height="4" transform="rotate(23 364 265)" fill="#cdd4da" stroke={NAVY} strokeWidth="0.6" />
    </g>
  );
}

function Hose() {
  const d = "M392 1473C470 1479 540 1477 590 1475C628 1474 626 1372 648 1372";
  return (
    <g>
      <path d={d} fill="none" stroke={CARBON} strokeWidth="9" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#4f5a66" strokeWidth="1.3" strokeDasharray="2 4" />
    </g>
  );
}

/** The vacuum, drawn in inches around the middle of its footprint, ground at 0 */
function Vacuum() {
  return (
    <g transform="translate(700 1480) scale(4.1667)">
      <ellipse cx="2" cy="0" rx="15" ry="1" fill="rgb(13 42 78 / 0.14)" />

      {/* push handle and frame, behind the tank */}
      <path d="M8.6 -6L11 -41Q11.3 -43 13.6 -43H15.6" fill="none" stroke={CARBON} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.4 -20H10" stroke={CARBON} strokeWidth="0.9" />
      {/* power cord coiled over the handle */}
      <g fill="none" stroke="#2b333c" strokeWidth="0.5">
        <ellipse cx="11.6" cy="-31" rx="1.7" ry="5" />
        <ellipse cx="11.9" cy="-30.4" rx="1.9" ry="5.4" />
        <ellipse cx="11.4" cy="-31.6" rx="1.6" ry="4.6" />
      </g>

      {/* stainless tank */}
      <path d="M-7.5 -31H7.5V-9.2Q7.5 -6.6 5.4 -6.6H-5.4Q-7.5 -6.6 -7.5 -9.2Z" fill="url(#kgt-steel)" stroke={NAVY} strokeWidth="0.35" />
      <path d="M-7.5 -24H7.5M-7.5 -13H7.5" stroke="#7d8893" strokeWidth="0.22" />

      {/* inside the tank (cut away for the spin chapter) */}
      <g data-tank-cut="" className={styles.cut} style={{ opacity: 0 }}>
        <path d="M-7.1 -30.6H7.1V-9.3Q7.1 -7 5.3 -7H-5.3Q-7.1 -7 -7.1 -9.3Z" fill="#d8dfe5" />
        <path d="M-7.1 -30.6H-5.6V-7H-5.3Q-7.1 -7 -7.1 -9.3Z M7.1 -30.6H5.6V-7H5.3Q7.1 -7 7.1 -9.3Z" fill="#b9c3cb" />
        {/* water, then the packed wet debris from your gutter */}
        <path d="M-7.1 -12.4H7.1V-10.8H-7.1Z" fill="#9cc3d6" opacity="0.8" />
        <path d="M-7.1 -11Q-4 -12.2 -1 -11.2T7.1 -11.3V-9.3Q7.1 -7 5.3 -7H-5.3Q-7.1 -7 -7.1 -9.3Z" fill="#3b2c1f" />
        {[
          [-4.6, -11.6, 30, "#b4652f"],
          [-1.2, -11.9, -25, "#c8923a"],
          [2.6, -11.4, 60, "#6b4a2e"],
          [4.8, -11.8, -10, "#8a6a2f"],
        ].map(([x, y, r, c], i) => (
          <path key={i} d={LEAF} transform={`translate(${x} ${y}) rotate(${r}) scale(0.16)`} fill={c as string} stroke="#33251a" strokeWidth="2.5" />
        ))}
        {/* the spin */}
        <g className={styles.swirl} fill="none" stroke={SKY} strokeWidth="0.3" strokeDasharray="1.6 1.1">
          <ellipse cx="0" cy="-26.2" rx="6.5" ry="1.15" />
          <ellipse cx="0" cy="-22" rx="6.3" ry="1.05" />
          <ellipse cx="0" cy="-17.8" rx="6" ry="0.95" />
        </g>
        {/* washable cloth filter, and the float that shuts off the suction when it's full */}
        <path d="M-4.2 -31V-22.2Q-4.2 -20 -2 -20H2Q4.2 -20 4.2 -22.2V-31Z" fill="#efe9dc" stroke="#8a7f6e" strokeWidth="0.22" />
        <path d="M-2.4 -30.6V-20.6M0 -30.6V-20M2.4 -30.6V-20.6" stroke="#cfc6b3" strokeWidth="0.22" />
        <rect x="-1.4" y="-19.9" width="2.8" height="2.8" fill="none" stroke={NAVY} strokeWidth="0.2" />
        <circle cx="0" cy="-18.3" r="0.95" fill="#f4f6f8" stroke={NAVY} strokeWidth="0.2" />
      </g>

      {/* drain hose up the side */}
      <path d="M7.5 -9.6C9.7 -10 9.7 -14 9.5 -18S9.1 -27 8.5 -29" fill="none" stroke={CARBON} strokeWidth="1.1" strokeLinecap="round" />
      <rect x="7.4" y="-10.6" width="1" height="2" fill="#59646c" />

      {/* side inlet: a black horn on the tank wall, the hose cuff on its end */}
      <path d="M-7.5 -28.6C-9 -28 -10.3 -27.4 -11 -27.1V-24.9C-10.3 -24.6 -9 -24 -7.5 -23.4Z" fill={CARBON} stroke={NAVY} strokeWidth="0.25" />
      <rect x="-12.7" y="-27.4" width="1.9" height="2.8" rx="0.3" fill="#2b333c" stroke={NAVY} strokeWidth="0.2" />

      {/* black collar, latches, and the sky-blue motor head */}
      <rect x="-8" y="-32.4" width="16" height="1.7" fill={CARBON} />
      <rect x="-8.5" y="-32.8" width="1" height="3.3" rx="0.2" fill="#8b97a2" stroke={NAVY} strokeWidth="0.15" />
      <rect x="7.5" y="-32.8" width="1" height="3.3" rx="0.2" fill="#8b97a2" stroke={NAVY} strokeWidth="0.15" />
      <path d="M-8 -32.4V-36.2Q-8 -40.4 -3 -40.7H3Q8 -40.4 8 -36.2V-32.4Z" fill={SKY} stroke={NAVY} strokeWidth="0.35" />
      <path d="M-6.9 -33.2V-36Q-6.9 -39.2 -3.2 -39.6" fill="none" stroke="#9bd9f8" strokeWidth="0.45" />
      {/* a switch per motor on top */}
      {[2.3, 4.1, 5.9].map((x) => (
        <rect key={x} x={x - 0.6} y="-41.6" width="1.2" height="1.1" rx="0.2" fill="#e9eef2" stroke={NAVY} strokeWidth="0.15" />
      ))}
      {/* vents, and air leaving them */}
      <path d="M6.2 -35.6H7.6M6.2 -34.6H7.6M6.2 -33.6H7.6" stroke="#1d6fa3" strokeWidth="0.3" strokeLinecap="round" />
      <g className={styles.exhaust} fill="none" stroke="#9aa6b0" strokeWidth="0.3" strokeLinecap="round">
        <path d="M8.6 -35.6q1.2 -0.5 2.4 0t2.4 0" />
        <path d="M8.6 -34.4q1.2 -0.5 2.4 0t2.4 0" />
        <path d="M8.6 -33.2q1.2 -0.5 2.4 0t2.4 0" />
      </g>

      {/* inside the head (cut away for the motors chapter): three motors, one per switch */}
      <g data-head-cut="" className={styles.cut} style={{ opacity: 0 }}>
        <path d="M-7.4 -32.8V-36.1Q-7.4 -39.9 -3 -40.1H3Q7.4 -39.9 7.4 -36.1V-32.8Z" fill="#1d6fa3" />
        {[-4.6, 0, 4.6].map((x) => (
          <g key={x} transform={`translate(${x} -36.4)`}>
            <circle r="2" fill="#2b333c" stroke="#0b3d61" strokeWidth="0.2" />
            <g className={styles.fan}>
              <path d="M0 0L0 -1.7M0 0L1.47 0.85M0 0L-1.47 0.85" stroke="#cdd4da" strokeWidth="0.45" strokeLinecap="round" />
            </g>
            <circle r="0.45" fill={SKY} />
          </g>
        ))}
      </g>

      {/* welded steel cart, locking front caster, all-terrain rear wheel */}
      <path d="M-9 -6.5H10" stroke={CARBON} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M-7 -6.5V-3.6" stroke={CARBON} strokeWidth="0.8" />
      <rect x="-6.1" y="-4.3" width="1.4" height="0.7" rx="0.2" fill="#cdd4da" stroke={NAVY} strokeWidth="0.12" />
      <circle cx="-7" cy="-1.6" r="1.6" fill={SKY} stroke={NAVY} strokeWidth="0.25" />
      <circle cx="-7" cy="-1.6" r="0.55" fill="#e9eef2" />
      <circle cx="8.6" cy="-5" r="5" fill={CARBON} />
      <circle cx="8.6" cy="-5" r="4.55" fill="none" stroke="#3b4652" strokeWidth="0.7" strokeDasharray="0.7 0.7" />
      <circle cx="8.6" cy="-5" r="2.5" fill="#59646c" />
      <circle cx="8.6" cy="-5" r="0.9" fill="#cdd4da" />
    </g>
  );
}

export function MachineScene() {
  return (
    <>
      <defs>
        <pattern id="kgt-siding" width="40" height="22" patternUnits="userSpaceOnUse" y="300">
          <rect width="40" height="22" fill="#fbfcfd" />
          <path d="M0 21.5H40" stroke="#d6dde3" strokeWidth="1.5" />
          <path d="M0 18H40" stroke="#eef1f4" strokeWidth="3" />
        </pattern>
        <pattern id="kgt-kevlar" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#1d2a3c" />
          <path d="M0 4L4 0M-1 1L1 -1M3 5L5 3" stroke="#3a4d66" strokeWidth="0.8" />
        </pattern>
        <pattern id="kgt-lawn" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <rect width="16" height="16" fill="#f4f7f5" />
          <path d="M0 0V16" stroke="rgb(13 42 78 / 0.16)" strokeWidth="2" />
        </pattern>
        <linearGradient id="kgt-steel" x1="0" x2="1">
          <stop offset="0" stopColor="#8b97a2" />
          <stop offset="0.2" stopColor="#dde3e8" />
          <stop offset="0.32" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#d3dae0" />
          <stop offset="0.8" stopColor="#a3aeb8" />
          <stop offset="1" stopColor="#7c8893" />
        </linearGradient>
        <linearGradient id="kgt-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e3eff7" />
          <stop offset="1" stopColor="#f3f7fa" />
        </linearGradient>
      </defs>

      {/* sky and lawn, wide enough for any screen shape */}
      <rect x="-1200" y="-400" width="3400" height="1880" fill="url(#kgt-sky)" />
      <rect x="-1200" y="1480" width="3400" height="400" fill="url(#kgt-lawn)" />
      <path d="M-1200 1480H2200" stroke={NAVY} strokeWidth="2.5" />

      <House />
      <GutterEnd />
      <Hose />
      <PoleAndNozzle />
      <g transform="translate(392 1175.4) scale(1.36)">
        <OperatorFigure />
      </g>
      <Vacuum />

      {/* debris on its way through the line, seen through the walls */}
      <path data-flow="" className={styles.flow} d={flowPath} fill="none" stroke="#e0b06a" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0.1 9" />

      {/* the leaf the tour follows, and its route (measured, never drawn) */}
      {leafSegments.map((d, i) => (
        <path key={i} data-seg={i} d={d} fill="none" stroke="none" />
      ))}
      <path data-leaf-path="" d={leafSegments.join("")} fill="none" stroke="none" />
      <g data-leaf="" transform="translate(348 304) scale(0.5)">
        <path d={LEAF} transform="translate(-7.5 0)" fill="#d99a3a" stroke="#33251a" strokeWidth="1" />
        <path d="M-6 0H6" stroke="#8a5a20" strokeWidth="0.6" />
      </g>
    </>
  );
}
