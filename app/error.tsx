"use client";

import { useEffect } from "react";
import { site } from "@/content/site";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="status-page">
      <h1>Something went wrong on our end.</h1>
      <p>
        <button type="button" className="btn" onClick={reset}>
          Try again
        </button>
      </p>
      <p>
        Or call or text <a href={site.phone.href}>{site.phone.display}</a>.
      </p>
    </main>
  );
}
