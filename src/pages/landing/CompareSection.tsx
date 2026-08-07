import { useReveal } from "./useReveal";

export default function CompareSection() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="lp-section" ref={ref}>
      <div className="lp-eyebrow lp-reveal">Fark</div>
      <h2 className="lp-reveal">Kağıt-kalemden dashboard'a.</h2>

      <div className="lp-compare-grid">
        <div className="lp-compare-card lp-compare-old lp-reveal-left">
          <span className="lp-compare-label">Eskisi</span>
          <div className="lp-item">Deftere elle not al</div>
          <div className="lp-item">Excel'de sürekli formül düzelt</div>
          <div className="lp-item">Hangi konu zayıf, tahmin et</div>
          <div className="lp-item">Veliye hâlâ telefonla anlat</div>
        </div>

        <div className="lp-compare-arrow">→</div>

        <div className="lp-compare-card lp-compare-new lp-reveal-right">
          <span className="lp-compare-label">Universitely</span>
          <div className="lp-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="#E4BB60" strokeWidth={2.5}>
              <path d="M5 13l4 4L19 7" />
            </svg>
            Sonuç D/Y/B ile saniyeler içinde girilir
          </div>
          <div className="lp-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="#E4BB60" strokeWidth={2.5}>
              <path d="M5 13l4 4L19 7" />
            </svg>
            Zayıf konu otomatik işaretlenir
          </div>
          <div className="lp-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="#E4BB60" strokeWidth={2.5}>
              <path d="M5 13l4 4L19 7" />
            </svg>
            Veli panelden canlı izler
          </div>
        </div>
      </div>
    </section>
  );
}
