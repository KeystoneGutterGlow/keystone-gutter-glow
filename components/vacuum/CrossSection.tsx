import styles from "./Vacuum.module.css";

// A K-style gutter cut in section, hung on the fascia under the roof edge.
// Drawn twice on navy: once after a hand scoop, once during the vacuum pass.

const LINE = "#c9d6e2";
const GUTTER =
  "M66 66V220H196L204 212V172C204 160 212 154 216 148C221 141 226 134 226 122V80L226 72L214 70L212 80";

function Shell() {
  return (
    <g>
      {/* fascia board */}
      <rect x="40" y="50" width="24" height="196" fill="#1d3e66" stroke={LINE} strokeWidth="1.5" />
      {/* roof deck resting on the fascia, shingles on top, drip edge tucked into the gutter */}
      <path d="M-10 5.7L92 51.6V62.6L-10 16.7Z" fill="#2c4a70" stroke={LINE} strokeWidth="1.5" />
      <path d="M-10 -2.5L96 45.2L92 51.6L-10 5.7Z" fill="#4a545e" stroke={LINE} strokeWidth="1.2" />
      <path d="M8 6.2l6 2.7M30 16l6 2.7M52 26l6 2.7M74 35.8l6 2.7" stroke="#2c343c" strokeWidth="2" />
      <path d="M92 51.6L97 55V84" fill="none" stroke={LINE} strokeWidth="2" />
      {/* hidden hanger: screwed through the back, clipped under the lip */}
      <rect x="44" y="79" width="24" height="6" fill="#8fa3b6" />
      <path d="M66 82H220" stroke="#8fa3b6" strokeWidth="3" />
      {/* the gutter itself */}
      <path d={GUTTER} fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

function Bed({ clumps }: { clumps?: boolean }) {
  return (
    <g>
      <rect x="150" y="291" width="220" height="12" fill="#4a3626" />
      <path d="M150 291H370" stroke={LINE} strokeWidth="2" />
      <path
        d="M160 296h6M178 299h5M196 295h7M214 298h5M236 296h6M258 299h5M280 295h7M302 298h5M326 296h6M348 299h5"
        stroke="#7a5a3c"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g fill="#2f6b4f">
        <path d="M188 291v-22h2v22z" />
        <path d="M189 275c-9-1-14-7-14-14 9 2 14 7 14 14zM189 279c8-4 14-4 18-12-10 0-16 4-18 12z" />
        <path d="M330 291v-16h2v16z" />
        <path d="M331 280c-7-1-10-5-10-10 6 1 10 5 10 10zM331 283c6-3 10-3 13-9-7 0-11 3-13 9z" />
      </g>
      {clumps && (
        <g fill="#6b4a2e" stroke="#a8937a" strokeWidth="1">
          <path d="M248 291c4-12 26-13 32 0z" />
          <path d="M290 291c3-7 15-8 19 0z" />
          <path d="M226 291c2-5 10-5 12 0z" />
        </g>
      )}
    </g>
  );
}

export function ScoopSection() {
  return (
    <svg viewBox="-10 -16 380 330" className={styles.section} role="img" aria-labelledby="scoop-t scoop-d">
      <title id="scoop-t">Gutter cross-section after hand scooping</title>
      <desc id="scoop-d">
        A wet layer of grit and needles is still packed into the bottom of the gutter, and clumps that fell off the scoop
        are lying in the flower bed below.
      </desc>
      <Shell />
      {/* the wet layer left behind */}
      <path
        d="M68 218V192C82 186 96 196 112 190S140 184 156 192 186 188 202 196V210L196 218Z"
        fill="#6b4a2e"
        stroke="#a8937a"
        strokeWidth="1.2"
      />
      <g stroke="#c8a77e" strokeWidth="1.3" strokeLinecap="round">
        <path d="M80 204l14-6M108 208l12-8M136 202l16 3M164 207l10-9M184 204l8 4" />
      </g>
      <g fill="#d9c4a3">
        <circle cx="90" cy="212" r="1.8" />
        <circle cx="126" cy="213" r="1.8" />
        <circle cx="150" cy="199" r="1.8" />
        <circle cx="176" cy="213" r="1.8" />
        <circle cx="100" cy="197" r="1.8" />
      </g>

      {/* the scoop, mid-lift, a clump sliding off over the front */}
      <g transform="rotate(-16 236 56)">
        <path d="M160 50H246C252 50 256 56 256 62V66H160Z" fill="#c9d6e2" stroke="#fff" strokeWidth="1.5" />
        <rect x="256" y="55" width="70" height="8" rx="2" fill="#8fa3b6" />
        <path d="M168 50C176 34 202 30 222 40S248 48 246 50Z" fill="#6b4a2e" stroke="#a8937a" strokeWidth="1.2" />
      </g>
      <path d="M240 82C254 122 262 190 266 280" fill="none" stroke="#a8937a" strokeWidth="1.3" strokeDasharray="3 5" />
      <path d="M248 112c6-6 14-4 16 2s-6 10-12 8-6-6-4-10z" fill="#6b4a2e" stroke="#a8937a" strokeWidth="1" />
      <path d="M257 190c5-3 11 0 11 5s-6 7-10 5-4-7-1-10z" fill="#6b4a2e" stroke="#a8937a" strokeWidth="1" />

      <Bed clumps />

      <g className={styles.callout}>
        <path d="M120 194V256H66" />
        <text x="0" y="274">
          <tspan x="0" dy="0">The wet layer a scoop</tspan>
          <tspan x="0" dy="17">skims over</tspan>
        </text>
        <path d="M300 284V256" />
        <text x="300" y="248" textAnchor="middle">
          Over the side
        </text>
      </g>
    </svg>
  );
}

const HOSE = "M380 -14C334 -2 270 10 222 40C184 64 158 96 152 136V194";

export function VacuumSection() {
  return (
    <svg viewBox="-10 -16 380 330" className={styles.section} role="img" aria-labelledby="vac-t vac-d">
      <title id="vac-t">Gutter cross-section during vacuum cleaning</title>
      <desc id="vac-d">
        The vacuum nozzle reaches down to the bottom of the trough and pulls the last bits of debris up the hose. The
        gutter is clean and nothing is falling into the flower bed below.
      </desc>
      <Shell />

      {/* hose and nozzle, coming over the lip from the pole */}
      <path d={HOSE} fill="none" stroke="#0b1016" strokeWidth="15" />
      <path d={HOSE} fill="none" stroke="#2b3541" strokeWidth="15" strokeDasharray="1.4 5" />
      <path d={HOSE} fill="none" stroke="#5b6672" strokeWidth="1.4" transform="translate(-4 0)" />
      <path d="M141 194H163L168 205H136Z" fill="#0b1016" stroke="#8fa3b6" strokeWidth="1.2" />

      {/* last bits getting pulled up */}
      <g className={styles.suction}>
        <circle className={styles.p1} cx="112" cy="214" r="2.6" />
        <circle className={styles.p2} cx="186" cy="215" r="2.2" />
        <circle className={styles.p3} cx="128" cy="210" r="2" />
        <path className={styles.p4} d="M176 210l9-3" />
        <path className={styles.p5} d="M98 212l8 2" />
      </g>
      <g fill="none" stroke="#3bb0ee" strokeWidth="1.6" strokeLinecap="round">
        <path d="M110 208c12-2 20-4 28-9" />
        <path d="M192 208c-8-2-15-4-22-9" />
      </g>

      {/* flow arrow along the hose */}
      <g className={styles.flow}>
        <path d="M244 64C270 44 298 32 334 22" />
        <path d="M323 14L336 21L326 31" />
      </g>

      <Bed />

      <g className={styles.callout}>
        <text x="258" y="70">
          <tspan x="258" dy="0">Up the hose to</tspan>
          <tspan x="258" dy="17">a sealed tank</tspan>
        </text>
        <path d="M92 214V256H66" />
        <text x="0" y="274">
          <tspan x="0" dy="0">Bottom of the trough,</tspan>
          <tspan x="0" dy="17">wet layer and all</tspan>
        </text>
      </g>
    </svg>
  );
}
