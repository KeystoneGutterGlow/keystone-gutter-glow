import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main id="main" className="status-page">
      <h1>That page doesn&rsquo;t exist.</h1>
      <p>
        <Link href="/" className="textlink">
          Go to the home page
        </Link>
        , or call or text <a href={site.phone.href}>{site.phone.display}</a>.
      </p>
    </main>
  );
}
