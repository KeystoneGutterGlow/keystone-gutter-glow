"use client";

import { useEffect, useRef, useState } from "react";
import { chapters, machine } from "@/content/machine";
import styles from "./Machine.module.css";
import { MachineScene } from "./MachineScene";

// "Why choose Keystone Gutter Glow": a scroll-driven tour of Jimmy's vacuum. The chapters are
// ordinary text. Beside them (above them on phones) a sticky drawing follows one leaf from the
// gutter into the tank: as each chapter reaches the middle of the screen, the camera glides to its
// part of the machine and the leaf moves on. Labels are HTML laid over the drawing, so they stay a
// readable size whatever the zoom. With reduced motion the camera cuts between chapters instead of
// gliding, and nothing loops.

type Box = { cx: number; cy: number; w: number; h: number };

/** What the camera must show in each chapter, in drawing units (50 = 1 ft). Same order as chapters. */
const CAMERA: Box[] = [
  { cx: 370, cy: 860, w: 860, h: 1280 }, // the whole setup
  { cx: 361, cy: 289, w: 112, h: 96 }, // nozzle in the gutter
  { cx: 395, cy: 1215, w: 270, h: 560 }, // the bottom of the pole, clamps, Kevlar
  { cx: 575, cy: 1318, w: 420, h: 250 }, // pole foot, hose, cart
  { cx: 700, cy: 1336, w: 150, h: 92 }, // the motor head
  { cx: 703, cy: 1392, w: 140, h: 196 }, // the tank, cut away
  { cx: 708, cy: 1400, w: 200, h: 210 }, // the cart
];

/** Where the leaf is in each chapter: [segment, fraction along it] (see leafSegments). */
const LEAF_AT: [number, number][] = [
  [0, 0],
  [0, 1],
  [2, 0.73],
  [3, 0.5],
  [3, 1],
  [4, 0.62],
  [4, 1],
];

type Label = { x: number; y: number; text: string; side: "left" | "right"; dy?: number };

const LABELS: Label[][] = [
  [
    { x: 392, y: 720, text: `Carbon pole, up to ${machine.poleFeet} ft`, side: "right" },
    { x: 349, y: 300, text: "Nozzle in the gutter", side: "right" },
    { x: 520, y: 1477, text: `${machine.hoseFeet} ft hose`, side: "right", dy: -16 },
    { x: 700, y: 1335, text: "The vacuum", side: "right" },
  ],
  [
    { x: 383, y: 263, text: `${machine.bendDegrees}° silicone bend`, side: "right" },
    { x: 355, y: 288, text: "Aluminum nozzle", side: "right" },
    { x: 340, y: 311, text: "Wet, packed layer", side: "left" },
  ],
  [
    { x: 392, y: 1062, text: "Quick-release clamp", side: "left" },
    { x: 392, y: 1160, text: `${machine.sectionFeet} ft carbon section`, side: "left" },
    { x: 392, y: 1380, text: "Kevlar handle section", side: "left" },
  ],
  [
    { x: 392, y: 1468, text: "Pole meets hose", side: "left", dy: -18 },
    { x: 560, y: 1476, text: `${machine.hoseInches} in hose`, side: "right", dy: -16 },
  ],
  [
    { x: 681, y: 1328, text: `Three ${machine.wattsPerMotor.toLocaleString("en-US")} W motors`, side: "left" },
    { x: 718, y: 1307, text: "A switch per motor", side: "right" },
    { x: 736, y: 1336, text: "Air out", side: "right", dy: 8 },
  ],
  [
    { x: 648, y: 1372, text: "Side inlet", side: "left" },
    { x: 717, y: 1374, text: "Cloth filter", side: "right" },
    { x: 704, y: 1404, text: "Float shut-off", side: "right" },
    { x: 688, y: 1438, text: "Out of your gutter", side: "left" },
  ],
  [
    { x: 736, y: 1459, text: "All-terrain wheel", side: "right" },
    { x: 671, y: 1473, text: "Locking caster", side: "left" },
    { x: 739, y: 1404, text: "Drain hose", side: "right" },
  ],
];

const N = chapters.length;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Holds each chapter's view, then moves in the middle of the scroll between two chapters */
const ease = (f: number) => {
  const t = clamp01((f - 0.28) / 0.44);
  return t * t * (3 - 2 * t);
};

export function MachineTour() {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    const list = listRef.current;
    if (!stage || !svg || !list) return;

    const items = Array.from(list.children) as HTMLElement[];
    const route = svg.querySelector<SVGPathElement>("[data-leaf-path]");
    const leaf = svg.querySelector<SVGGElement>("[data-leaf]");
    const flow = svg.querySelector<SVGPathElement>("[data-flow]");
    const tankCut = svg.querySelector<SVGGElement>("[data-tank-cut]");
    const headCut = svg.querySelector<SVGGElement>("[data-head-cut]");
    if (!route || !leaf || !flow || !tankCut || !headCut) return;

    const segLengths = Array.from(svg.querySelectorAll<SVGPathElement>("[data-seg]")).map((p) => p.getTotalLength());
    const starts = segLengths.map((_, i) => segLengths.slice(0, i).reduce((a, b) => a + b, 0));
    const total = route.getTotalLength();
    const leafLen = LEAF_AT.map(([seg, f]) => Math.min(total, starts[seg]! + segLengths[seg]! * f));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = -1;

    const frame = () => {
      raf = 0;
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      if (!W || !H) return;
      const sr = stage.getBoundingClientRect();
      if (sr.bottom < -200 || sr.top > window.innerHeight + 200) return;

      // Which chapter is being read. Side by side: the one whose middle is at the middle of the
      // screen. Stacked on phones: the one whose title has just come out from under the drawing,
      // so the whole chapter is readable while its view is showing.
      const stacked = window.innerWidth < 900;
      const dock = window.innerWidth < 1100 ? 70 : 0;
      const line = stacked ? sr.bottom + (window.innerHeight - dock - sr.bottom) * 0.12 : window.innerHeight * 0.5;
      const mids = items.map((el) => {
        const r = el.getBoundingClientRect();
        return stacked ? r.top + 20 : r.top + Math.min(r.height, window.innerHeight * 0.6) / 2;
      });
      let c = 0;
      if (line >= mids[N - 1]!) c = N - 1;
      else if (line > mids[0]!) {
        let i = 0;
        while (i < N - 2 && mids[i + 1]! <= line) i++;
        c = i + clamp01((line - mids[i]!) / (mids[i + 1]! - mids[i]!));
      }

      const i0 = Math.floor(c);
      const i1 = Math.min(i0 + 1, N - 1);
      const e = reduce.matches ? Math.round(c - i0) : ease(c - i0);
      const a = CAMERA[i0]!;
      const b = CAMERA[i1]!;

      // Camera: centre moves in a straight line, zoom moves evenly in log space
      const cx = a.cx + (b.cx - a.cx) * e;
      const cy = a.cy + (b.cy - a.cy) * e;
      const bw = Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * e);
      const bh = Math.exp(Math.log(a.h) + (Math.log(b.h) - Math.log(a.h)) * e);
      // Fit that box to the stage's shape, so the whole box always shows
      const aspect = W / H;
      const vh = bw / bh > aspect ? bw / aspect : bh;
      const vw = vh * aspect;
      const vx = cx - vw / 2;
      const vy = cy - vh / 2;
      svg.setAttribute("viewBox", `${vx.toFixed(2)} ${vy.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`);
      const px = H / vh;

      // The leaf, kept about 18px long at any zoom, pointing the way it's travelling
      const L = leafLen[i0]! + (leafLen[i1]! - leafLen[i0]!) * e;
      const p = route.getPointAtLength(L);
      const q = route.getPointAtLength(Math.min(total, L + 1.5));
      const angle = L >= total - 0.5 ? -20 : (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
      leaf.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${angle.toFixed(1)}) scale(${(18 / 15 / px).toFixed(4)})`);
      // Once the tank is closed again it's out of sight
      leaf.style.opacity = String(clamp01((5.7 - c) * 2.5));

      // Debris in the line: small bits a steady size on screen at any zoom
      const gap = 13 / px;
      flow.style.strokeWidth = (3.2 / px).toFixed(3);
      flow.style.strokeDasharray = `0.01 ${gap.toFixed(3)}`;
      flow.style.setProperty("--period", (gap + 0.01).toFixed(3));

      // Cutaways: the motor head opens for chapter 4, the tank for chapter 5
      headCut.style.opacity = String(clamp01(1 - Math.abs(c - 4) * 1.6));
      tankCut.style.opacity = String(clamp01(1 - Math.abs(c - 5) * 1.6));
      // Debris only moves through the line once the tour has started at the nozzle
      if (c > 0.5) svg.dataset.running = "";
      else delete svg.dataset.running;

      // Labels: placed over the drawing in screen pixels
      LABELS.forEach((set, ci) =>
        set.forEach((l, li) => {
          const el = labelRefs.current[ci * 8 + li];
          if (!el) return;
          const x = (l.x - vx) * px;
          const y = (l.y - vy) * px + (l.dy ?? 0);
          el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
          // Use the preferred side if it fits, else the roomier one, and slide the text back inside
          // the drawing if it still doesn't fit
          const w = (el.lastElementChild as HTMLElement).offsetWidth + 18;
          const room = { left: x - 6, right: W - x - 6 };
          const side = room[l.side] >= w ? l.side : room.left > room.right ? "left" : "right";
          el.dataset.side = side;
          const over = w - room[side];
          el.style.setProperty("--nudge", over > 0 ? `${side === "right" ? -over : over}px` : "0px");
        }),
      );

      if (barRef.current) barRef.current.style.transform = `scaleX(${(c / (N - 1)).toFixed(3)})`;
      const now = Math.round(c);
      if (now !== last) {
        last = now;
        setActive(now);
      }
    };

    const request = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    request();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    reduce.addEventListener("change", request);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      reduce.removeEventListener("change", request);
    };
  }, []);

  return (
    <div className={styles.tour}>
      <div className={styles.stage} ref={stageRef} aria-hidden="true">
        <svg ref={svgRef} className={styles.scene} viewBox="-60 220 860 1280" preserveAspectRatio="xMidYMid meet" focusable="false">
          <MachineScene />
        </svg>
        <div className={styles.labels}>
          {LABELS.map((set, ci) =>
            set.map((l, li) => (
              <span
                key={`${ci}-${li}`}
                ref={(el) => {
                  labelRefs.current[ci * 8 + li] = el;
                }}
                className={styles.label}
                data-side={l.side}
                data-on={ci === active || undefined}
              >
                <span className={styles.dot} />
                <span className={styles.labelText}>{l.text}</span>
              </span>
            )),
          )}
        </div>
        <p className={styles.counter}>
          <span>{active === 0 ? "The setup" : `${active} of ${N - 1}`}</span>
          <span className={styles.bar}>
            <span ref={barRef} />
          </span>
        </p>
      </div>

      <ol className={styles.chapters} ref={listRef}>
        {chapters.map((ch, i) => (
          <li key={ch.id} className={styles.chapter} data-on={i === active || undefined}>
            <div className={styles.chapterInner}>
              {i > 0 && <p className={styles.num}>{i}</p>}
              <h3 className={styles.title}>{ch.title}</h3>
              <p className={styles.body}>{ch.body}</p>
              <dl className={styles.figs}>
                {ch.figures.map((f) => (
                  <div key={f.label} className={styles.fig}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              {ch.byHand && (
                <p className={styles.byHand}>
                  <strong>With a ladder and scoop:</strong> {ch.byHand}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
