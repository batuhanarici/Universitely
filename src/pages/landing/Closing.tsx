import MagneticButton from "./MagneticButton";
import { useReveal } from "./useReveal";

const NOTLAR = ["Kredi kartı yok", "Davet koduyla başla", "Veri senin"];

export default function Closing({ onGetStarted }: { onGetStarted: () => void }) {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="lp-section lp-closing" ref={ref}>
      <div className="lp-eyebrow lp-reveal">Başla</div>
      <h2 className="lp-reveal">İlk denemeni bu hafta analiz et.</h2>
      <p className="lp-lede lp-reveal">
        Öğrenci ya da veli hesabıyla ücretsiz kaydol. Koçundan alacağın davet koduyla iki dakikada hazır.
      </p>
      <div className="lp-cta-row lp-reveal">
        <MagneticButton onClick={onGetStarted}>Ücretsiz dene</MagneticButton>
      </div>
      <div className="lp-closing-notes lp-reveal">
        {NOTLAR.map((n, i) => (
          <span key={n}>
            {i > 0 && <i aria-hidden="true" />}
            {n}
          </span>
        ))}
      </div>
    </section>
  );
}
