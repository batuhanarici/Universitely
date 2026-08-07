import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return value;
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(true);
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const students = useCountUp(500, active);
  const netIncrease = useCountUp(23, active);
  const satisfaction = useCountUp(89, active);

  return (
    <section className="lp-section" ref={sectionRef}>
      <div className="lp-eyebrow">Sonuçlar</div>
      <h2>Rakamlar konuşuyor.</h2>
      <div className="lp-stat-row">
        <div>
          <div className="lp-stat-num">{students}+</div>
          <div className="lp-stat-label">aktif öğrenci</div>
        </div>
        <div>
          <div className="lp-stat-num">%{netIncrease}</div>
          <div className="lp-stat-label">ortalama net artışı</div>
        </div>
        <div>
          <div className="lp-stat-num">%{satisfaction}</div>
          <div className="lp-stat-label">memnuniyet oranı</div>
        </div>
      </div>
    </section>
  );
}
