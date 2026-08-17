import { useEffect, useRef } from "react";
import MagneticButton from "./MagneticButton";

type Satir = { soru: number; secim: number | null; yanlis?: boolean };

// 6 soruluk optik parça: bir kısmı dolu (teal=birikimli doğru, brick=yanlış),
// ikisi boş — scroll ilerledikçe "kalemle" doldurulur.
const SATIRLAR: Satir[] = [
  { soru: 1, secim: 3 },
  { soru: 2, secim: 1, yanlis: true },
  { soru: 3, secim: 4 },
  { soru: 4, secim: null },
  { soru: 5, secim: 1, yanlis: true },
  { soru: 6, secim: null },
];
const SECENEKLER = ["A", "B", "C", "D", "E"];

function sinifla(satir: Satir, j: number): string {
  if (satir.secim === j) {
    return `lp-opt-circle lp-opt-on ${satir.yanlis ? "lp-opt-y" : "lp-opt-d"}`;
  }
  if (satir.secim === null && j === satir.soru % 5) return "lp-opt-circle lp-opt-fillable";
  return "lp-opt-circle";
}

export default function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function onScroll() {
      const y = window.scrollY;
      if (cardRef.current && fine && !reducedMotion) {
        const rotY = -14 + Math.min(y * 0.03, 14);
        const rotX = 6 - Math.min(y * 0.015, 10);
        const ty = Math.min(y * 0.25, 120);
        cardRef.current.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) translateY(${ty}px)`;
      }
      const fillables = document.querySelectorAll<HTMLElement>(".lp-opt-fillable");
      const limit = Math.min(fillables.length, Math.floor((y / window.innerHeight) * fillables.length * 0.6));
      fillables.forEach((el, i) => el.classList.toggle("lp-filled", i < limit));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="lp-section lp-hero">
      <div className="lp-hero-copy">
        <div className="lp-eyebrow">Deneme takip sistemi</div>
        <h1>
          Zayıf konunu <em>tahmin etme,</em>
          <br />
          gör.
        </h1>
        <p className="lp-lede">
          Deneme sonuçlarını gir; sistem konu bazlı zayıflığını işaretlesin, yanlışlarını ve boşlarını
          tekrar havuzunda toplasın. Veli ve koçun da gelişimini görsün.
        </p>
        <div className="lp-cta-row">
          <MagneticButton onClick={onGetStarted}>Ücretsiz dene</MagneticButton>
          <a href="#nasil-calisir" className="lp-btn-ghost">
            Nasıl çalışır ↓
          </a>
        </div>
        <p className="lp-hero-note">Öğrenci ve veli kaydı ücretsiz · davet koduyla başla</p>
        <div className="lp-hero-pills">
          <span className="lp-hero-pill">
            <span className="lp-pill-dot" />
            Konu bazlı zayıflık
          </span>
          <span className="lp-hero-pill">
            <span className="lp-pill-dot" />
            Tekrar havuzu
          </span>
          <span className="lp-hero-pill">
            <span className="lp-pill-dot" />
            Veli &amp; koç paneli
          </span>
        </div>
      </div>

      <div className="lp-hero-visual">
        <div className="lp-mock-card" ref={cardRef}>
          <div className="lp-optik">
            <div className="lp-optik-head">
              <span className="lp-optik-title">Deneme 12 · TYT</span>
              <span className="lp-optik-faux">Ad Soyad: ___</span>
            </div>
            {SATIRLAR.map((satir) => (
              <div className="lp-opt-row" key={satir.soru}>
                <span className="lp-opt-q">{String(satir.soru).padStart(2, "0")}</span>
                {SECENEKLER.map((s, j) => (
                  <span key={s} className={sinifla(satir, j)} />
                ))}
              </div>
            ))}
            <div className="lp-optik-legend">
              <span className="lp-leg">
                <span className="lp-leg-chip lp-leg-d" /> Doğru
              </span>
              <span className="lp-leg">
                <span className="lp-leg-chip lp-leg-y" /> Yanlış
              </span>
              <span className="lp-leg">
                <span className="lp-leg-chip lp-leg-b" /> Boş
              </span>
            </div>
          </div>
          <div className="lp-float-tag">%23 net artışı ↑</div>
        </div>

        <div className="lp-pool-note">
          <div className="lp-pool-title">Tekrar havuzu</div>
          <div className="lp-pool-line lp-line-on">Fonksiyonlar · 12 soru</div>
          <div className="lp-pool-line">Paragraf · 4 soru</div>
          <div className="lp-pool-line">Üçgenler · 1 soru</div>
        </div>
      </div>
    </section>
  );
}
