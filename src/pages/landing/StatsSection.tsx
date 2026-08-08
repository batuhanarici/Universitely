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

function Underline() {
  return (
    <svg className="lp-stat-underline" viewBox="0 0 130 12" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M3 8 C 30 3, 70 11, 127 6"
        pathLength={100}
        stroke="var(--lp-gold)"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function Stat({
  hedef,
  on,
  etiket,
  active,
}: {
  hedef: number;
  on: string;
  etiket: string;
  active: boolean;
}) {
  const sayi = useCountUp(hedef, active);
  return (
    <div className="lp-stat">
      <div className="lp-stat-num">{on === "%" ? `%${sayi}` : `${sayi}+`}</div>
      <Underline />
      <div className="lp-stat-label">{etiket}</div>
    </div>
  );
}

const ISTATISKLER: { hedef: number; on: string; etiket: string }[] = [
  { hedef: 500, on: "+", etiket: "aktif öğrenci" },
  { hedef: 23, on: "%", etiket: "ortalama net artışı" },
  { hedef: 89, on: "%", etiket: "memnuniyet oranı" },
];

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

  return (
    <section className={`lp-section${active ? " lp-stat-on" : ""}`} ref={sectionRef}>
      <div className="lp-stats-grid">
        <div className="lp-stats-intro">
          <div className="lp-eyebrow">Sonuçlar</div>
          <h2>Rakamlar konuşuyor.</h2>
          <p className="lp-lede">
            Pilot dönemdeki öğrencilerden derlenen rakamlar; yayına geçince gerçek verilerle değişecek.
          </p>
        </div>
        <div className="lp-stat-row">
          {ISTATISKLER.map((s) => (
            <Stat key={s.etiket} hedef={s.hedef} on={s.on} etiket={s.etiket} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
