import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { startingPrice } from "@/content/pricing";

export const alt = "Keystone Gutter Glow: gutter cleaning by vacuum in Bucks County, PA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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

export default async function OpengraphImage() {
  const [logo, font] = await Promise.all([
    readFile(join(process.cwd(), "public/images/keystone-logo-light.png")),
    loadDisplayFont(),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const display = font ? "Zilla Slab" : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0d2a4e",
          color: "#fff",
        }}
      >
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 28,
              fontFamily: display,
              fontSize: 72,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
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
    { ...size, fonts: font ? [{ name: "Zilla Slab", data: font, weight: 700, style: "normal" }] : undefined },
  );
}
