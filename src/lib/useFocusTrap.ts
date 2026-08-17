import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(",");

export function useFocusTrap<T extends HTMLElement>(ref: RefObject<T | null>, onEscape?: () => void) {
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const kapsayici: T = root;

    const oncekiOdak = document.activeElement as HTMLElement | null;
    const ilkOdak = kapsayici.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? kapsayici;
    ilkOdak.focus();

    function klavyeDinle(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onEscapeRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;

      const odaklanabilirler = Array.from(kapsayici.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (odaklanabilirler.length === 0) {
        e.preventDefault();
        kapsayici.focus();
        return;
      }

      const ilk = odaklanabilirler[0];
      const son = odaklanabilirler[odaklanabilirler.length - 1];
      if (e.shiftKey && document.activeElement === ilk) {
        e.preventDefault();
        son.focus();
      } else if (!e.shiftKey && document.activeElement === son) {
        e.preventDefault();
        ilk.focus();
      }
    }

    document.addEventListener("keydown", klavyeDinle);
    return () => {
      document.removeEventListener("keydown", klavyeDinle);
      if (oncekiOdak?.isConnected) oncekiOdak.focus();
    };
  }, [ref]);
}
