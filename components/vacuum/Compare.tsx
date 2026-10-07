"use client";

import { useEffect, useState } from "react";
import styles from "./Vacuum.module.css";

// On wide screens both cross-sections sit side by side and this toggle is hidden by CSS.
// On phones it flips one panel in place, so the comparison happens in the same spot on
// screen instead of a scroll apart. Until hydration (or with JS off) both panels stack.

export function Compare({ vacuum, scoop }: { vacuum: React.ReactNode; scoop: React.ReactNode }) {
  const [show, setShow] = useState<"vacuum" | "scoop">("vacuum");
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => setEnhanced(true), []);

  return (
    <div className={styles.compare} data-enhanced={enhanced || undefined} data-show={show}>
      <div className={styles.toggle} role="group" aria-label="Compare cleaning methods">
        <button type="button" aria-pressed={show === "vacuum"} onClick={() => setShow("vacuum")}>
          After our vacuum
        </button>
        <button type="button" aria-pressed={show === "scoop"} onClick={() => setShow("scoop")}>
          After a hand scoop
        </button>
      </div>
      {vacuum}
      {scoop}
    </div>
  );
}
