const QUOTES = [
  {
    text: "Artık hangi konuda geride olduğumu tahmin etmiyorum, direkt görüyorum.",
    name: "Elif K.",
    role: "Öğrenci · 12. sınıf",
    initials: "EK",
    bg: "#DCEFE9",
    color: "var(--lp-teal)",
  },
  {
    text: "Her hafta telefon açmadan çocuğumun durumunu görebiliyorum.",
    name: "Merve D.",
    role: "Veli",
    initials: "MD",
    bg: "#FBEAE4",
    color: "var(--lp-brick)",
  },
  {
    text: "Sınıfın genelini tek ekranda görmek, toplantılara hazırlığı çok kısalttı.",
    name: "Ahmet Y.",
    role: "Koç",
    initials: "AY",
    bg: "var(--lp-cream-dim)",
    color: "var(--lp-gold-dim)",
  },
];

export default function Testimonials() {
  // Kesintisiz kaymak için liste iki kez tekrarlanıyor
  const items = [...QUOTES, ...QUOTES];

  return (
    <section className="lp-section lp-reveal">
      <div className="lp-eyebrow">Onlar ne diyor</div>
      <h2>Placeholder yorumlar — onay sonrası gerçekleriyle değişecek.</h2>
      <div className="lp-marquee-wrap">
        <div className="lp-marquee-track">
          {items.map((q, i) => (
            <div className="lp-quote-card" key={`${q.name}-${i}`}>
              <p>&ldquo;{q.text}&rdquo;</p>
              <div className="lp-quote-who">
                <div className="lp-quote-avatar" style={{ background: q.bg, color: q.color }}>
                  {q.initials}
                </div>
                <div>
                  <div className="lp-quote-name">{q.name}</div>
                  <div className="lp-quote-role">{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
