import { useScrollStages } from "./useScrollStages";
import { useMediaQuery } from "./useMediaQuery";
import { useReveal } from "./useReveal";

const CIFTLER: { eskisi: string; yenisi: string }[] = [
  { eskisi: "Deftere elle not al", yenisi: "Sonuçlar D/Y/B ile saniyeler içinde girilir" },
  { eskisi: "Excel'de sürekli formül düzelt", yenisi: "Konu bazlı analiz kendiliğinden hesaplanır" },
  { eskisi: "Hangi konu zayıf, tahmin et", yenisi: "%55 altı konular otomatik işaretlenir" },
  { eskisi: "Veliye hâlâ telefonla anlat", yenisi: "Veli panelden canlı izler" },
];

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CompareDesktop() {
  const { ref, progress, active } = useScrollStages<HTMLDivElement>(CIFTLER.length);
  const tamam = (i: number) => progress * CIFTLER.length >= i + 0.5;

  return (
    <div className="lp-scroll-outer" ref={ref} id="fark">
      <div className="lp-scroll-sticky lp-cmp-sticky">
        <div className="lp-eyebrow">Fark</div>
        <h2>Kağıt-kalem alışkanlığı, tek ekranda.</h2>

        <div className="lp-cmp-card">
          <span className="lp-cmp-card-label">Eskisi → Universitely</span>
          {CIFTLER.map((c, i) => (
            <div className="lp-cmp-row" key={c.eskisi}>
              <div className={`lp-cmp-old${tamam(i) ? " lp-struck" : ""}${i === active ? " lp-cmp-cur" : ""}`}>
                {c.eskisi}
              </div>
              <div className={`lp-cmp-new${tamam(i) ? " lp-new-on" : ""}`}>
                <span className="lp-cmp-check">
                  <Check />
                </span>
                <span>{c.yenisi}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lp-h-progress">
          <div className="lp-h-progress-bar" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function CompareMobile() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="lp-section" ref={ref} id="fark">
      <div className="lp-eyebrow lp-reveal">Fark</div>
      <h2 className="lp-reveal">Kağıt-kalem alışkanlığı, tek ekranda.</h2>
      <div className="lp-cmp-card lp-reveal">
        <span className="lp-cmp-card-label">Eskisi → Universitely</span>
        {CIFTLER.map((c) => (
          <div className="lp-cmp-row" key={c.eskisi}>
            <div className="lp-cmp-old lp-struck">{c.eskisi}</div>
            <div className="lp-cmp-new lp-new-on">
              <span className="lp-cmp-check">
                <Check />
              </span>
              <span>{c.yenisi}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CompareSection() {
  const isDesktop = useMediaQuery("(min-width: 821px) and (pointer: fine)");
  return isDesktop ? <CompareDesktop /> : <CompareMobile />;
}
