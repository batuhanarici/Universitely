import type { ReactNode } from "react";
import { useScrollStages } from "./useScrollStages";
import { useMediaQuery } from "./useMediaQuery";
import { useReveal } from "./useReveal";

type Adim = { ad: string; baslik: string; desc: string; mock: ReactNode };

const ADIMLAR: Adim[] = [
  {
    ad: "Gir",
    baslik: "Sonucu D/Y/B rozetleriyle gir",
    desc: "Doğru, yanlış, boş — kağıt üzerindeki işaretleme alışkanlığının birebir aynısı. Saniyeler sürer.",
    mock: (
      <div className="lp-mini-mock">
        <div className="lp-mini-dyb">
          <span className="lp-dyb lp-dyb-d">D</span>
          <span className="lp-dyb lp-dyb-y">Y</span>
          <span className="lp-dyb lp-dyb-b">B</span>
        </div>
        <span className="lp-mini-note">Soru 14 — doğru</span>
      </div>
    ),
  },
  {
    ad: "Gör",
    baslik: "Zayıf konu otomatik işaretlenir",
    desc: "Konu bazlı yüzdelikler; %55 altı kalan konular 'ağırlık ver' etiketiyle öne çıkar. Tahmine gerek yok.",
    mock: (
      <div className="lp-mini-mock">
        <div className="lp-m-topic">
          <span className="lp-m-topic-label">Matematik</span>
          <div className="lp-m-bar-track">
            <div className="lp-m-bar-fill" style={{ width: "41%", background: "var(--lp-brick)" }} />
          </div>
          <span className="lp-m-badge">Ağırlık ver</span>
        </div>
        <div className="lp-m-topic">
          <span className="lp-m-topic-label">Türkçe</span>
          <div className="lp-m-bar-track">
            <div className="lp-m-bar-fill" style={{ width: "78%", background: "var(--lp-teal)" }} />
          </div>
        </div>
      </div>
    ),
  },
  {
    ad: "Bitir",
    baslik: "Yanlışların ve boşların tekrar havuzunda",
    desc: "Çözülünce havuzdan düşer, bekleyenler listelenir. Sınav gününe kadar havuz erir.",
    mock: (
      <div className="lp-mini-mock lp-pool-mock">
        <div className="lp-pool-row">
          <span className="lp-pool-dot lp-done" />
          Fizik — Soru 14 çözüldü
        </div>
        <div className="lp-pool-row">
          <span className="lp-pool-dot" />
          Kimya — Soru 27 bekliyor
        </div>
        <div className="lp-pool-row">
          <span className="lp-pool-dot" />
          Matematik — Soru 9 bekliyor
        </div>
      </div>
    ),
  },
];

function StepsDesktop() {
  const { ref, progress, active } = useScrollStages<HTMLDivElement>(ADIMLAR.length);

  return (
    <div className="lp-scroll-outer" ref={ref} id="nasil-calisir">
      <div className="lp-scroll-sticky">
        <div className="lp-steps-grid">
          <div className="lp-steps-copy">
            <div className="lp-eyebrow">Nasıl çalışır</div>
            <h2>Üç adımda zayıf konunu bul.</h2>
            <div className="lp-steps-list">
              {ADIMLAR.map((a, i) => (
                <div className={`lp-step-item${i === active ? " lp-step-on" : ""}`} key={a.ad}>
                  <span className="lp-step-no">{String(i + 1).padStart(2, "0")}</span>
                  <div className="lp-step-body">
                    <span className="lp-step-name">{a.ad}</span>
                    {i === active && <p className="lp-step-desc">{a.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-steps-visual">
            <div className="lp-step-stage">
              {ADIMLAR.map((a, i) => {
                const dist = progress * ADIMLAR.length - i;
                const transform = `translateY(${(0.5 - dist) * 150}px) scale(${Math.max(0.9, 1 - Math.abs(dist - 0.5) * 0.18)})`;
                const opacity = Math.max(0, 1 - Math.abs(dist - 0.5) * 1.5);
                return (
                  <div
                    className="lp-fcard"
                    key={a.ad}
                    style={{ transform, opacity, zIndex: Math.round(10 - Math.abs(dist - 0.5) * 20) }}
                  >
                    <div className="lp-tag">
                      {String(i + 1).padStart(2, "0")} · {a.ad}
                    </div>
                    <h3>{a.baslik}</h3>
                    {a.mock}
                  </div>
                );
              })}
            </div>
            <div className="lp-steps-progress">
              <span className="lp-steps-progress-no">{String(active + 1).padStart(2, "0")}</span>
              <div className="lp-h-progress">
                <div className="lp-h-progress-bar" style={{ width: `${progress * 100}%` }} />
              </div>
              <span className="lp-steps-progress-no">{String(ADIMLAR.length).padStart(2, "0")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepsMobile() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="lp-section" ref={ref} id="nasil-calisir">
      <div className="lp-eyebrow lp-reveal">Nasıl çalışır</div>
      <h2 className="lp-reveal">Üç adımda zayıf konunu bul.</h2>
      <div className="lp-steps-mobile">
        {ADIMLAR.map((a, i) => (
          <div className="lp-fcard lp-reveal" key={a.ad}>
            <div className="lp-tag">
              {String(i + 1).padStart(2, "0")} · {a.ad}
            </div>
            <h3>{a.baslik}</h3>
            <p className="lp-fcard-desc">{a.desc}</p>
            {a.mock}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function StepsSection() {
  const isDesktop = useMediaQuery("(min-width: 821px) and (pointer: fine)");
  return isDesktop ? <StepsDesktop /> : <StepsMobile />;
}
