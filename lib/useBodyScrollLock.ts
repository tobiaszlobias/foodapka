import { useEffect } from "react";

/** Zamkne scroll na <body>, dokud je modal/dialog otevřený — zabraňuje dvojitému
 * scrollbaru (jeden na pozadí stránky, druhý na modalu). Volat vždy, ne podmíněně. */
export function useBodyScrollLock() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);
}
