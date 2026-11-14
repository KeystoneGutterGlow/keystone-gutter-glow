"use client";

import { useId, useState } from "react";
import { BookLink } from "@/components/BookLink";
import { lookupArea, serviceRadius } from "@/content/area";
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
        {result?.status === "outside" && (
          <>Sorry, that&rsquo;s outside our area. We only work within {serviceRadius.miles} miles of Jamison.</>
        )}
        {result?.status === "outOfState" && (
          <>We only work in Pennsylvania, so we can&rsquo;t come to {result.state === "NJ" ? "New Jersey" : "addresses outside the state"}.</>
        )}
        {result?.status === "unknown" && <>We couldn&rsquo;t match that to a town. Try your five-digit ZIP.</>}
        {result?.status === "invalid" && <>Try a five-digit ZIP or a town name.</>}
      </p>
    </form>
  );
}
