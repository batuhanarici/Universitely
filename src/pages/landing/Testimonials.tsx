import { useReveal } from "./useReveal";

type Yorum = { text: string; name: string; role: string; initials: string; bg: string; color: string };

const YORUMLAR: Yorum[] = [
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

function Kart({ y, i }: { y: Yorum; i: number }) {
  return (
    <div className="lp-quote-card" style={{ transform: `rotate(${i % 2 ? 1.2 : -1.2}deg)` }}>
      <span className="lp-quote-mark" aria-hidden="true">
        &ldquo;
      </span>
      <p>{y.text}</p>
      <div className="lp-quote-who">
        <div className="lp-quote-avatar" style={{ background: y.bg, color: y.color }}>
          {y.initials}
        </div>
        <div>
          <div className="lp-quote-name">{y.name}</div>
          <div className="lp-quote-role">{y.role}</div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const ref = useReveal<HTMLElement>();
  // Tek satırın kesintisiz akması için liste iki kez tekrarlanıyor.
  const items = [...YORUMLAR, ...YORUMLAR];

  return (
    <section className="lp-section" ref={ref}>
      <div className="lp-eyebrow lp-reveal">Onlar ne diyor</div>
      <h2 className="lp-reveal">Deneyenler ne diyor.</h2>
      <div className="lp-marquee-wrap lp-reveal">
        <div className="lp-marquee-track">
          {items.map((y, i) => (
            <Kart key={`a-${y.name}-${i}`} y={y} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
