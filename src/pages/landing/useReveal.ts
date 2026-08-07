import { useEffect, useRef } from "react";

/** Bir container ref'i içindeki .lp-reveal / .lp-reveal-left / .lp-reveal-right
 * elemanlarını, görünüme girince .lp-in class'ı ekleyerek belirtir. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll(".lp-reveal, .lp-reveal-left, .lp-reveal-right");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("lp-in");
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return ref;
}
