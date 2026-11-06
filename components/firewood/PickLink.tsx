"use client";

import type { ProductId } from "@/content/firewood";

export const PICK_EVENT = "kgw:pick";

/** A plain anchor to the order form (works with JS off) that also preselects a size. */
export function PickLink({ productId, className, children }: { productId?: ProductId; className?: string; children: React.ReactNode }) {
  return (
    <a
      href="#order"
      className={className}
      onClick={() => {
        if (productId) window.dispatchEvent(new CustomEvent<ProductId>(PICK_EVENT, { detail: productId }));
      }}
    >
      {children}
    </a>
  );
}
