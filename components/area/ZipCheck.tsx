"use client";

import { useId, useState } from "react";
import { BookLink } from "@/components/BookLink";
import { lookupArea } from "@/content/area";
import { site } from "@/content/site";
import styles from "./Area.module.css";

export function ZipCheck() {
  const id = useId();
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ReturnType<typeof lookupArea> | null>(null);

  return (
    <form
      className={styles.check}
      onSubmit={(e) => {
        e.preventDefault();
        setResult(lookupArea(value));
      }}
    >
      <label htmlFor={id}>Do we come to you?</label>
      <div className={styles.checkRow}>
        <input
          id={id}
          name="area"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setResult(null);
          }}
          placeholder="ZIP or town"
          autoComplete="postal-code"
          enterKeyHint="search"
        />
        <button type="submit" className="btn">
          Check
        </button>
      </div>
      <p className={styles.checkResult} role="status">
        {result?.status === "yes" && (
          <>
            <strong>Yes, {result.town} is inside our area.</strong>{" "}
            <BookLink className="textlink">Pick a day</BookLink>
          </>
        )}
        {result?.status === "ask" && (
          <>
            That&rsquo;s outside our usual area, but ask anyway. Call or text{" "}
            <a href={site.phone.href} className="textlink">
              {site.phone.display}
            </a>
            .
          </>
        )}
        {result?.status === "unknown" && <>We couldn&rsquo;t match that to a town. Try your five-digit ZIP.</>}
        {result?.status === "invalid" && <>Try a five-digit ZIP or a town name.</>}
      </p>
    </form>
  );
}
