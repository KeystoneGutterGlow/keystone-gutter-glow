// The Pennsylvania keystone from the logo, used as the one repeated brand glyph:
// numbered callouts on drawings and town pins on the map.

export const KEYSTONE_PATH = "M4 0H20V4.2H24L19.2 28H4.8L0 4.2H4Z";

interface Props {
  n?: number | string;
  size?: number;
  fill?: string;
  ink?: string;
  className?: string;
  dashed?: boolean;
}

export function Keystone({ n, size = 26, fill = "var(--navy)", ink = "#fff", className, dashed }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={(size * 28) / 24}
      viewBox="-1 -1 26 30"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={KEYSTONE_PATH}
        fill={dashed ? "none" : fill}
        stroke={dashed ? fill : "none"}
        strokeWidth={dashed ? 1.6 : 0}
        strokeDasharray={dashed ? "3 2" : undefined}
      />
      {n !== undefined && (
        <text
          x="12"
          y="18.6"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontWeight="700"
          fontSize="14"
          fill={dashed ? fill : ink}
        >
          {n}
        </text>
      )}
    </svg>
  );
}

/** Keystone as an SVG fragment, for placing inside a larger drawing. */
export function KeystoneMark({
  x,
  y,
  n,
  scale = 1,
  fill = "var(--navy)",
  ink = "#fff",
  dashed,
}: {
  x: number;
  y: number;
  n?: number | string;
  scale?: number;
  fill?: string;
  ink?: string;
  dashed?: boolean;
}) {
  return (
    <g transform={`translate(${x - 12 * scale} ${y - 14 * scale}) scale(${scale})`}>
      <path
        d={KEYSTONE_PATH}
        fill={dashed ? "#fff" : fill}
        stroke={dashed ? fill : "none"}
        strokeWidth={dashed ? 1.5 / scale : 0}
        strokeDasharray={dashed ? "3 2" : undefined}
      />
      {n !== undefined && (
        <text
          x="12"
          y="18.6"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontWeight="700"
          fontSize="14"
          fill={dashed ? fill : ink}
        >
          {n}
        </text>
      )}
    </g>
  );
}
