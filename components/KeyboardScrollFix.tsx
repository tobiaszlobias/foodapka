"use client";

import { useEffect } from "react";

/** Na mobilu (viewport klávesnice) prohlížeč často nechá input schovaný pod
 * klávesnicí nebo mimo viditelnou oblast po zaostření — appka ho proto sama
 * vycentruje na viditelnou plochu, jakmile se klávesnice stihne otevřít. */
export default function KeyboardScrollFix() {
  useEffect(() => {
    function handleFocusIn(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
      if (window.innerWidth >= 1024) return; // desktop nemá virtuální klávesnici

      // Krátké zpoždění, aby se stihla otevřít klávesnice a přepočítat viewport
      // (visualViewport resize), než appka spočítá cílovou scroll pozici.
      window.setTimeout(() => {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 300);
    }

    document.addEventListener("focusin", handleFocusIn);
    return () => document.removeEventListener("focusin", handleFocusIn);
  }, []);

  return null;
}
