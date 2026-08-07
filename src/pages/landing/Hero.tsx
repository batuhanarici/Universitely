import { useEffect, useRef } from "react";
import MagneticButton from "./MagneticButton";

export default function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (cardRef.current) {
        const rotY = -14 + Math.min(y * 0.03, 14);
        const rotX = 6 - Math.min(y * 0.015, 10);
        const ty = Math.min(y * 0.25, 120);
        cardRef.current.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) translateY(${ty}px)`;
      }
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="lp-section lp-hero">
      <div className="lp-hero-copy">
        <div className="lp-eyebrow">Universitely</div>
        <h1>
          Denemeni <em>anla</em>,<br />
          zayıfını gör,<br />
          hedefine ulaş.
        </h1>
        <p className="lp-lede">
          TYT/AYT hazırlığında her sorunun arkasındaki veriyi gösteren, konu bazlı zayıflık tespiti yapan takip
          sistemi.
        </p>
        <div className="lp-cta-row">
          <MagneticButton onClick={onGetStarted}>Ücretsiz dene</MagneticButton>
          <a href="#nasil-calisir" className="lp-btn-ghost">
            Nasıl çalışır ↓
          </a>
        </div>
      </div>

      <div className="lp-hero-visual">
        <div className="lp-mockup-card" ref={cardRef}>
          <div className="lp-m-sidebar">
            <div className="lp-m-dot lp-active" />
            <div className="lp-m-dot" />
            <div className="lp-m-dot" />
            <div className="lp-m-dot" />
          </div>
          <div className="lp-m-main">
            <div className="lp-m-row-title">Konu performansı</div>
            <div className="lp-m-topic">
              <span className="lp-m-topic-label">Matematik</span>
              <div className="lp-m-bar-track">
                <div className="lp-m-bar-fill" style={{ width: "78%", background: "var(--lp-teal)" }} />
              </div>
            </div>
            <div className="lp-m-topic">
              <span className="lp-m-topic-label">Fizik</span>
              <div className="lp-m-bar-track">
                <div className="lp-m-bar-fill" style={{ width: "41%", background: "var(--lp-brick)" }} />
              </div>
              <span className="lp-m-badge">Ağırlık ver</span>
            </div>
            <div className="lp-m-topic">
              <span className="lp-m-topic-label">Kimya</span>
              <div className="lp-m-bar-track">
                <div className="lp-m-bar-fill" style={{ width: "63%", background: "var(--lp-gold-dim)" }} />
              </div>
            </div>
            <div className="lp-m-row-title" style={{ marginTop: 6 }}>
              Son deneme
            </div>
            <div className="lp-m-chart">
              <div style={{ height: "40%", background: "var(--lp-teal)" }} />
              <div style={{ height: "70%", background: "var(--lp-brick)" }} />
              <div style={{ height: "55%", background: "var(--lp-gold)" }} />
              <div style={{ height: "85%", background: "var(--lp-teal)" }} />
              <div style={{ height: "30%", background: "var(--lp-brick)" }} />
              <div style={{ height: "65%", background: "var(--lp-gold)" }} />
            </div>
          </div>
          <div className="lp-float-tag">%23 net artışı ↑</div>
        </div>
      </div>
    </section>
  );
}
