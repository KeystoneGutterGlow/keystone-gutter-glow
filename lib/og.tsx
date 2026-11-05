import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { firewoodStartingPrice } from "@/content/firewood";
import { startingPrice } from "@/content/pricing";

// The 1200 x 630 cards shown when a page is shared. One per business, so a firewood link
// doesn't preview as gutter cleaning (or the other way round in firewood mode).

export const ogSize = { width: 1200, height: 630 };

/** Zilla Slab as TTF for the share card; falls back to the default face if offline at build. */
async function loadDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@700")).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

async function logo(file: string) {
  const data = await readFile(join(process.cwd(), "public/images", file));
  return `data:image/png;base64,${data.toString("base64")}`;
}

const fontsFor = (font: ArrayBuffer | null) =>
  font ? [{ name: "Zilla Slab", data: font, weight: 700 as const, style: "normal" as const }] : undefined;

export async function gutterCard() {
  const [logoSrc, font] = await Promise.all([logo("keystone-logo-light.png"), loadDisplayFont()]);
  const display = font ? "Zilla Slab" : "sans-serif";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0d2a4e", color: "#fff" }}>
        {/* roof edge + gutter across the top, like the site */}
        <div style={{ display: "flex", height: 54, background: "#4a545e" }} />
        <div
          style={{
            display: "flex",
            height: 44,
            background:
              "linear-gradient(to bottom, #0d2a4e 0px, #0d2a4e 2px, #ffffff 2px, #ffffff 8px, #c5ced5 8px, #c5ced5 12px, #eef1f3 12px, #eef1f3 36px, #b4bec7 36px, #b4bec7 42px, #0d2a4e 42px)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", padding: "52px 72px 0", flex: 1 }}>
          <img src={logoSrc} width={240} height={81} alt="" />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28, fontFamily: display, fontSize: 72, lineHeight: 1, fontWeight: 700 }}>
            <span>Gutter cleaning for</span>
            <span>Bucks County,</span>
            <span style={{ color: "#3bb0ee" }}>done by vacuum.</span>
          </div>
          <div style={{ display: "flex", marginTop: 30, fontSize: 30, color: "rgba(255,255,255,0.82)" }}>
            Jamison · Doylestown · Warwick · From ${startingPrice} · Book online
          </div>
        </div>
      </div>
    ),
    { ...ogSize, fonts: fontsFor(font) },
  );
}

const WOOD = ["#c9a26b", "#b98b54", "#d6b27e", "#a97b47", "#cfa873"];

export async function firewoodCard() {
  const [logoSrc, font] = await Promise.all([logo("keystone-logo.png"), loadDisplayFont()]);
  const display = font ? "Zilla Slab" : "sans-serif";
  // The face of a stack: two rows of log ends, the second row offset by half a log
  const row = (offset: number, seed: number) => (
    <div style={{ display: "flex", marginLeft: offset }}>
      {Array.from({ length: 21 }, (_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 58,
            height: 58,
            borderRadius: 29,
            background: WOOD[(i * 3 + seed) % WOOD.length],
            border: "2px solid #4a2e1b",
          }}
        >
          <div style={{ display: "flex", width: 30, height: 30, borderRadius: 15, border: "1.5px solid #8a5f33" }} />
        </div>
      ))}
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#faf8f4", color: "#2b1a14" }}>
        <div style={{ display: "flex", flexDirection: "column", height: 124, padding: "4px 0", background: "#3a2416", overflow: "hidden" }}>
          {row(-14, 0)}
          {row(-43, 2)}
        </div>
        <div style={{ display: "flex", height: 6, background: "#b3261e" }} />
        <div style={{ display: "flex", flexDirection: "column", padding: "48px 72px 0", flex: 1 }}>
          <img src={logoSrc} width={240} height={81} alt="" />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28, fontFamily: display, fontSize: 80, lineHeight: 1, fontWeight: 700 }}>
            <span>Firewood, delivered</span>
            <span style={{ color: "#b3261e" }}>and stacked.</span>
          </div>
          <div style={{ display: "flex", marginTop: 30, fontSize: 30, color: "#5c4f46" }}>
            Bucks County · All year · A quarter cord from ${firewoodStartingPrice}
          </div>
        </div>
      </div>
    ),
    { ...ogSize, fonts: fontsFor(font) },
  );
}
