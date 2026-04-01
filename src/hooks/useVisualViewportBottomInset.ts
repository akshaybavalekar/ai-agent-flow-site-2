'use client';

import { useEffect } from "react";

/**
 * Tracks the visual viewport bottom inset (browser chrome height) and sets
 * --vv-bottom-inset on the document root so CSS can react to the keyboard.
 */
export function useVisualViewportBottomInset() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const update = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const bottomInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--vv-bottom-inset", `${bottomInset}px`);
    };

    update();
    window.visualViewport.addEventListener("resize", update);
    window.visualViewport.addEventListener("scroll", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);
}
