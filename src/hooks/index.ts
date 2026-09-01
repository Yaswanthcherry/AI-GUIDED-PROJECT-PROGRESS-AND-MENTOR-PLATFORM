import { useEffect, useRef } from "react";
import { PRODUCT_NAME } from "../config/brand";

/** Sets document.title with the product name as a consistent suffix. */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${PRODUCT_NAME}` : PRODUCT_NAME;
  }, [title]);
}

/** Calls `handler` when a click lands outside the referenced element. */
export function useClickOutside<T extends HTMLElement>(handler: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler]);
  return ref;
}
