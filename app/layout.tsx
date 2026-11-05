import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Zilla_Slab } from "next/font/google";
import { site } from "@/content/site";
import { allowIndexing, publicUrl } from "@/lib/env";
import "./globals.css";

const display = Zilla_Slab({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Atkinson Hyperlegible was drawn for low-vision readers: phone numbers, ZIPs and times
// can't be misread. (The newer "Next" cut has no fallback metrics yet, so it would shift layout.)
const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title: {
    default: "Gutter Cleaning in Bucks County, PA | Keystone Gutter Glow",
    template: "%s | Keystone Gutter Glow",
  },
  applicationName: site.name,
  formatDetection: { telephone: false },
  robots: allowIndexing ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0d2a4e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior tells Next to turn off the CSS smooth scrolling during page changes.
    <html lang="en-US" className={`${display.variable} ${body.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
