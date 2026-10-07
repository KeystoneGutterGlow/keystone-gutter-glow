import type { HouseShape } from "@/content/pricing";

// Front elevations at one shared scale (all stand on y = 196), so the street of houses on
// the pricing section shows why taller costs more. The gutter line is drawn in sky blue:
// it's the only thing on the house we touch.

const S = { stroke: "var(--navy)", strokeWidth: 1.5 } as const;
const WALL = "#ffffff";
const ROOF = "#4a545e";
const GLASS = "#dbe7ef";

function Gutter({ x1, x2, y, spoutX }: { x1: number; x2: number; y: number; spoutX: number }) {
  return (
    <g className="gutterLine">
      <rect x={x1} y={y} width={x2 - x1} height="6" fill="var(--sky)" stroke="var(--navy)" strokeWidth="1.2" />
      <rect x={spoutX} y={y + 6} width="5" height={196 - y - 10} fill="#e6eaed" stroke="var(--navy)" strokeWidth="1" />
      <path d={`M${spoutX - 2} 196h9`} stroke="var(--navy)" strokeWidth="1.5" />
    </g>
  );
}

function Win({ x, y, w = 18, h = 24 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={GLASS} {...S} />
      <path d={`M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}`} stroke="var(--navy)" strokeWidth="1" />
    </g>
  );
}

function Door({ x, y, w = 16, h = 30 }: { x: number; y: number; w?: number; h?: number }) {
  return <rect x={x} y={y} width={w} height={h} fill="var(--navy)" />;
}

export function House({ shape, className }: { shape: HouseShape; className?: string }) {
  switch (shape) {
    case "ranch":
      return (
        <svg viewBox="0 0 236 200" className={className} aria-hidden="true">
          <path d="M34 86H202L232 124H4Z" fill={ROOF} {...S} />
          <rect x="16" y="124" width="204" height="72" fill={WALL} {...S} />
          <Win x={36} y={140} w={30} h={26} />
          <Win x={150} y={140} w={30} h={26} />
          <Door x={104} y={164} w={18} h={32} />
          <Gutter x1={4} x2={232} y={121} spoutX={210} />
        </svg>
      );
    case "townhome":
      return (
        <svg viewBox="0 0 196 200" className={className} aria-hidden="true">
          <path d="M22 44H174L194 72H2Z" fill={ROOF} {...S} />
          <rect x="8" y="72" width="180" height="124" fill={WALL} {...S} />
          <path d="M68 72V196M128 72V196" {...S} />
          <rect x="68" y="72" width="60" height="124" fill="#eef1f3" />
          <path d="M68 72V196M128 72V196" {...S} />
          {[8, 68, 128].map((x) => (
            <g key={x}>
              <Win x={x + 10} y={88} />
              <Win x={x + 34} y={88} w={16} />
              <Win x={x + 10} y={136} />
              <Door x={x + 36} y={166} w={14} />
            </g>
          ))}
          <Gutter x1={2} x2={194} y={69} spoutX={60} />
        </svg>
      );
    case "colonial":
      return (
        <svg viewBox="0 0 214 200" className={className} aria-hidden="true">
          <path d="M34 30H180L210 66H4Z" fill={ROOF} {...S} />
          <rect x="16" y="66" width="182" height="130" fill={WALL} {...S} />
          {[30, 70, 124, 164].map((x) => (
            <Win key={`u${x}`} x={x} y={80} w={20} h={28} />
          ))}
          {[30, 70, 124, 164].map((x) => (
            <Win key={`d${x}`} x={x} y={140} w={20} h={28} />
          ))}
          <Door x={98} y={158} w={18} h={38} />
          <path d="M92 156h30" stroke="var(--navy)" strokeWidth="3" />
          <Gutter x1={4} x2={210} y={63} spoutX={190} />
        </svg>
      );
    case "large":
      return (
        <svg viewBox="0 0 226 200" className={className} aria-hidden="true">
          <path d="M30 2H178L208 32H8Z" fill={ROOF} {...S} />
          <path d="M120 32L156 0L192 32Z" fill={ROOF} {...S} />
          <rect x="16" y="32" width="196" height="164" fill={WALL} {...S} />
          <rect x="128" y="32" width="56" height="164" fill="#eef1f3" stroke="var(--navy)" strokeWidth="1.5" />
          {[42, 92, 142].map((y) => (
            <g key={y}>
              <Win x={30} y={y} w={20} h={28} />
              <Win x={74} y={y} w={20} h={28} />
              <Win x={144} y={y} w={24} h={28} />
            </g>
          ))}
          {/* porch roof across the bottom: a second, lower gutter run */}
          <path d="M6 150H120L112 140H14Z" fill={ROOF} {...S} />
          <Door x={58} y={164} w={18} h={32} />
          <Gutter x1={8} x2={208} y={29} spoutX={200} />
          <rect x="6" y="150" width="114" height="5" fill="var(--sky)" stroke="var(--navy)" strokeWidth="1" />
        </svg>
      );
  }
}
