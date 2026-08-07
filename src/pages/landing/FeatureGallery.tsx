import { useEffect, useRef } from "react";

const FEATURES = [
  {
    tag: "Deneme Girişi",
    title: "D / Y / B ile saniyeler içinde sonuç girişi",
    mock: (
      <div className="lp-mini-mock">
        <div className="lp-mini-dyb">
          <span style={{ background: "#DCEFE9", color: "var(--lp-teal)" }}>D</span>
          <span style={{ background: "#FBEAE4", color: "var(--lp-brick)" }}>Y</span>
          <span style={{ background: "var(--lp-cream-dim)", color: "rgba(22,40,63,0.5)" }}>B</span>
        </div>
      </div>
    ),
  },
  {
    tag: "Zayıflık Tespiti",
    title: "%55 altı konular otomatik işaretlenir",
    mock: (
      <div className="lp-mini-mock">
        <div className="lp-m-bar-track" style={{ flex: 1 }}>
          <div className="lp-m-bar-fill" style={{ width: "41%", background: "var(--lp-brick)" }} />
        </div>
        <span className="lp-m-badge">Ağırlık ver</span>
      </div>
    ),
  },
  {
    tag: "Tekrar Havuzu",
    title: "Yanlış ve boşların hepsi tek bir listede",
    mock: (
      <div className="lp-mini-mock" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--lp-teal)" }} />
          Soru 14 — çözüldü
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, border: "1.5px solid rgba(22,40,63,0.3)" }} />
          Soru 27 — bekliyor
        </div>
      </div>
    ),
  },
  {
    tag: "Veli Paneli",
    title: "Veli, çocuğunun ilerlemesini canlı görür",
    mock: (
      <div className="lp-mini-mock">
        <div className="lp-m-chart" style={{ flex: 1, height: 44 }}>
          <div style={{ height: "50%", background: "var(--lp-teal)" }} />
          <div style={{ height: "80%", background: "var(--lp-gold)" }} />
          <div style={{ height: "35%", background: "var(--lp-brick)" }} />
          <div style={{ height: "65%", background: "var(--lp-teal)" }} />
        </div>
      </div>
    ),
  },
  {
    tag: "Koç Paneli",
    title: "Sınıfın geneli tek ekranda",
    mock: (
      <div className="lp-mini-mock" style={{ flexDirection: "column", gap: 5, alignItems: "stretch", padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5 }}>
          <span>Ahmet Y.</span>
          <span style={{ color: "var(--lp-teal)" }}>%82</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5 }}>
          <span>Elif K.</span>
          <span style={{ color: "var(--lp-brick)" }}>%47</span>
        </div>
      </div>
    ),
  },
];

export default function FeatureGallery() {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    function update() {
      const outer = outerRef.current;
      const track = trackRef.current;
      const progressBar = progressRef.current;
      if (!outer || !track || !progressBar) return;

      const rect = outer.getBoundingClientRect();
      const total = outer.offsetHeight - window.innerHeight;
      const progress = total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;

      const maxTranslate = track.scrollWidth - window.innerWidth + window.innerWidth * 0.08 + 40;
      track.style.transform = `translateX(-${progress * maxTranslate}px)`;
      progressBar.style.width = `${progress * 100}%`;

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const dist = progress - (i + 0.5) / FEATURES.length;
        const tilt = Math.max(-8, Math.min(8, dist * 40));
        const scale = 1 - Math.min(0.08, Math.abs(dist) * 0.3);
        card.style.transform = `rotate(${tilt}deg) scale(${scale})`;
      });
    }
    window.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="lp-h-scroll-outer" ref={outerRef} id="nasil-calisir">
      <div className="lp-h-scroll-sticky">
        <div className="lp-h-scroll-heading">
          <div className="lp-eyebrow">Nasıl çalışır</div>
          <h2 style={{ fontSize: "clamp(22px,2.8vw,34px)", maxWidth: 400 }}>
            Her özellik, kağıt üstündeki bir alışkanlığın dijital karşılığı.
          </h2>
        </div>
        <div className="lp-h-track" ref={trackRef}>
          {FEATURES.map((f, i) => (
            <div className="lp-fcard" key={f.tag} ref={(el) => { cardRefs.current[i] = el; }}>
              <div className="lp-tag">{f.tag}</div>
              <h3>{f.title}</h3>
              {f.mock}
            </div>
          ))}
        </div>
        <div className="lp-h-progress">
          <div className="lp-h-progress-bar" ref={progressRef} />
        </div>
      </div>
    </div>
  );
}
