import { KeystoneMark } from "@/components/Keystone";

// Elevation of one side of a house: roof edge, a gutter run, the downspout, the ground.
// Keystone callouts match the numbered list beside it.

export function HouseCorner() {
  return (
    <svg
      viewBox="0 0 640 470"
      role="img"
      aria-labelledby="hc-title"
      style={{ width: "100%", height: "auto" }}
    >
      <title id="hc-title">
        Drawing of a house wall with its gutter and downspout, marked with the four parts of a cleaning: gutter runs,
        downspouts, photos, and the optional rinse.
      </title>
      <defs>
        <pattern id="hc-shingle" width="72" height="20" patternUnits="userSpaceOnUse">
          <rect width="36" height="20" fill="#4a545e" />
          <rect x="36" width="36" height="20" fill="#525c67" />
          <rect y="16" width="72" height="4" fill="#2c343c" />
          <rect x="35" y="7" width="2" height="13" fill="#262d34" />
          <rect x="71" y="7" width="2" height="13" fill="#262d34" />
        </pattern>
        <pattern id="hc-siding" width="10" height="16" patternUnits="userSpaceOnUse">
          <rect width="10" height="16" fill="#f7f8f9" />
          <path d="M0 15.5H10" stroke="#d9dfe3" strokeWidth="1" />
          <path d="M0 14H10" stroke="#eceff1" strokeWidth="1" />
        </pattern>
        <pattern id="hc-ground" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0V9" stroke="#0d2a4e" strokeOpacity="0.2" strokeWidth="1" />
        </pattern>
        <linearGradient id="hc-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.18" stopColor="#f6f8f9" />
          <stop offset="0.3" stopColor="#c9d1d8" />
          <stop offset="0.42" stopColor="#eef1f3" />
          <stop offset="0.85" stopColor="#e6eaed" />
          <stop offset="1" stopColor="#bcc5cd" />
        </linearGradient>
        <linearGradient id="hc-pipe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dfe4e8" />
          <stop offset="0.35" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c3ccd3" />
        </linearGradient>
      </defs>

      {/* wall */}
      <rect x="0" y="128" width="560" height="302" fill="url(#hc-siding)" />
      <path d="M560 128V430" stroke="#0d2a4e" strokeWidth="1.5" />

      {/* window */}
      <g>
        <rect x="150" y="196" width="118" height="138" fill="#dbe7ef" stroke="#0d2a4e" strokeWidth="1.5" />
        <path d="M209 196V334M150 265H268" stroke="#0d2a4e" strokeWidth="1.5" />
        <rect x="142" y="334" width="134" height="8" fill="#fff" stroke="#0d2a4e" strokeWidth="1.5" />
        <path d="M160 206l30 30M222 206l18 18" stroke="#fff" strokeWidth="3" strokeOpacity="0.7" />
      </g>

      {/* roof */}
      <rect x="0" y="40" width="580" height="66" fill="url(#hc-shingle)" />
      <rect x="0" y="100" width="584" height="7" fill="#dfe4e8" stroke="#2c343c" strokeWidth="1" />

      {/* gutter run */}
      <rect x="0" y="106" width="572" height="30" fill="url(#hc-face)" stroke="#0d2a4e" strokeWidth="1.5" />
      <path d="M572 106c6 0 8 4 8 15s-2 15-8 15" fill="#d4dbe0" stroke="#0d2a4e" strokeWidth="1.5" />
      {[48, 168, 288, 408, 528].map((x) => (
        <circle key={x} cx={x} cy="110" r="1.6" fill="#8c99a5" />
      ))}

      {/* rinse: water in the clean trough (add-on, dashed) */}
      <path d="M16 110.5H150" stroke="#3bb0ee" strokeWidth="3" strokeDasharray="7 5" strokeLinecap="round" />
      <path d="M150 110.5h14" stroke="#3bb0ee" strokeWidth="3" strokeLinecap="round" markerEnd="url(#hc-arrow)" />
      <defs>
        <marker id="hc-arrow" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0L8 4L0 8z" fill="#3bb0ee" />
        </marker>
      </defs>

      {/* downspout: outlet, offset elbows, straight run, kick-out */}
      <g stroke="#0d2a4e" strokeWidth="1.5" fill="url(#hc-pipe)">
        <rect x="494" y="136" width="22" height="16" />
        <path d="M494 152l14 26h22l-14-26z" />
        <rect x="508" y="178" width="22" height="214" />
        <path d="M508 392v8c0 14 10 22 24 22h28v-22h-24c-4 0-6-2-6-8v0z" />
        <rect x="514" y="214" width="34" height="7" fill="#0d2a4e" />
        <rect x="514" y="318" width="34" height="7" fill="#0d2a4e" />
      </g>
      {/* water running clear out of the kick-out */}
      <path d="M562 412c10 2 18 8 22 16" stroke="#3bb0ee" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* splash block + ground */}
      <path d="M548 424h60l10 6h-74z" fill="#cdd4da" stroke="#0d2a4e" strokeWidth="1.5" />
      <rect x="0" y="430" width="640" height="40" fill="url(#hc-ground)" />
      <path d="M0 430H640" stroke="#0d2a4e" strokeWidth="2" />

      {/* camera, for the photos */}
      <g transform="translate(332 54)">
        <rect x="0" y="6" width="34" height="22" rx="2" fill="#fff" stroke="#0d2a4e" strokeWidth="1.5" />
        <rect x="8" y="2" width="12" height="5" fill="#0d2a4e" />
        <circle cx="17" cy="17" r="6.5" fill="#dbe7ef" stroke="#0d2a4e" strokeWidth="1.5" />
        <path d="M17 28v18" stroke="#0d2a4e" strokeWidth="1" strokeDasharray="2 3" />
      </g>

      {/* callouts */}
      <path d="M232 42v58" stroke="#0d2a4e" strokeWidth="1" />
      <path d="M182 100h100" stroke="#0d2a4e" strokeWidth="1" />
      <path d="M182 96v8M282 96v8" stroke="#0d2a4e" strokeWidth="1" />
      <KeystoneMark x={232} y={26} n={1} scale={1.45} />

      <path d="M560 268h34" stroke="#0d2a4e" strokeWidth="1" />
      <KeystoneMark x={610} y={268} n={2} scale={1.45} />

      <KeystoneMark x={398} y={42} n={3} scale={1.45} />
      <path d="M384 48h-16" stroke="#0d2a4e" strokeWidth="1" />

      <path d="M74 104V44" stroke="#0d2a4e" strokeWidth="1" strokeDasharray="2 3" />
      <KeystoneMark x={74} y={26} n={4} scale={1.45} dashed />
    </svg>
  );
}
