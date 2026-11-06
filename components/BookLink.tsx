"use client";

import type { AnchorHTMLAttributes } from "react";
import type { PlanFrequencyId } from "@/content/plans";
import type { PackageId } from "@/content/pricing";
import { BOOK_ID } from "@/content/nav";

export interface BookIntent {
  packageId?: PackageId;
  date?: string;
  slotId?: string;
  /** A recurring plan to preselect in the booking form */
  plan?: PlanFrequencyId;
}

export const BOOK_EVENT = "kgg:book";

/**
 * A plain anchor to #book (so it works with JS off and smooth-scrolls via CSS) that also
 * tells the booking widget what to preselect.
 */
export function BookLink({
  packageId,
  date,
  slotId,
  plan,
  onClick,
  children,
  ...rest
}: BookIntent & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={`#${BOOK_ID}`}
      onClick={(e) => {
        onClick?.(e);
        const detail: BookIntent = { packageId, date, slotId, plan };
        window.dispatchEvent(new CustomEvent<BookIntent>(BOOK_EVENT, { detail }));
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
