import { useEffect, useRef, useState } from "react";

/**
 * Sabitlenen (pinned) bölümler için scroll ilerlemesini takip eder.
 *
 * `ref` verilen dış kapsayıcı (`height: N*100vh`) içindeki sticky alan
 * ekranı doldurduğu süre boyunca `progress` 0→1 akar. `active`, `count`
 * sahnelik akışın o anki indeksini verir (yalnızca sahne değişince
 * yeniden render tetiklenir).
 *
 * Dokunmatik cihazlarda (pointer: coarse) animasyon devre dışı kalır;
 * bölümler mobilde zaten ayrı, doğal bir düzene düşer.
 */
export function useScrollStages<T extends HTMLElement>(count: number) {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total));
      setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [count]);

  const active = Math.min(count - 1, Math.max(0, Math.floor(progress * count)));
  return { ref, progress, active };
}
