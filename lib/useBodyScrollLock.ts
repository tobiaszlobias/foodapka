import { useEffect } from "react";

/** Zamkne scroll na <body>, dokud je modal/dialog otevřený — zabraňuje dvojitému
 * scrollbaru (jeden na pozadí stránky, druhý na modalu) i "prosáknutí" touch
 * scrollu na mobilu (iOS Safari ignoruje samotné overflow:hidden na body).
 * Volat vždy, ne podmíněně. */
export function useBodyScrollLock() {
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;

    const previousOverflow = body.style.overflow;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);
}
