import { useEffect, useRef } from "react";

/** Bir container ref'i içindeki .lp-reveal / .lp-reveal-left / .lp-reveal-right
 * elemanlarını (ve ref'in kendisi de reveal class'lıysa onu da), görünüme
 * girince .lp-in class'ı ekleyerek belirtir. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const hedefler = [
      root,
      ...root.querySelectorAll<HTMLElement>(".lp-reveal, .lp-reveal-left, .lp-reveal-right"),
    ].filter((el) =>
      el.classList.contains("lp-reveal") ||
      el.classList.contains("lp-reveal-left") ||
      el.classList.contains("lp-reveal-right")
    );
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.target.classList.add("lp-in"));
      },
      { threshold: 0.15 }
    );
    hedefler.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return ref;
}
