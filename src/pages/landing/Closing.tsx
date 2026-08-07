import MagneticButton from "./MagneticButton";

export default function Closing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="lp-section lp-reveal lp-closing">
      <div className="lp-eyebrow">Başla</div>
      <h2>Bugün kaydol, ilk denemeni bu hafta analiz et.</h2>
      <p className="lp-lede">Kredi kartı yok, kurulum yok. İki dakikada hazır.</p>
      <div className="lp-cta-row">
        <MagneticButton onClick={onGetStarted}>Ücretsiz dene</MagneticButton>
      </div>
    </section>
  );
}
