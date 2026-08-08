import type { CSSProperties } from "react";
import { useScrollStages } from "./useScrollStages";
import { useMediaQuery } from "./useMediaQuery";
import { useReveal } from "./useReveal";

type Role = { id: string; label: string; title: string; desc: string; mock: React.ReactNode };

const ROLLER: Role[] = [
  {
    id: "ogrenci",
    label: "Öğrenci",
    title: "Kendi zayıflığını kendin gör",
    desc: "Hangi konuya ağırlık vermen gerektiğini tahmin etme — sistem senin için işaretliyor.",
    mock: (
      <>
        <div className="lp-m-row-title">Tekrar havuzu</div>
        <div className="lp-m-list">
          <div className="lp-m-row">
            <span className="lp-m-check lp-on" />
            Fizik — Soru 14 çözüldü
          </div>
          <div className="lp-m-row">
            <span className="lp-m-check" />
            Kimya — Soru 27 bekliyor
          </div>
          <div className="lp-m-row">
            <span className="lp-m-check" />
            Matematik — Soru 9 bekliyor
          </div>
        </div>
        <div className="lp-m-topic" style={{ marginTop: 18 }}>
          <span className="lp-m-topic-label">Matematik</span>
          <div className="lp-m-bar-track">
            <div className="lp-m-bar-fill" style={{ width: "41%", background: "var(--lp-brick)" }} />
          </div>
          <span className="lp-m-badge">Ağırlık ver</span>
        </div>
      </>
    ),
  },
  {
    id: "veli",
    label: "Veli",
    title: "Sormadan takip et",
    desc: "Haftalık özet ve konu bazlı ilerleme — telefon açıp sormaya gerek kalmadan.",
    mock: (
      <>
        <div className="lp-m-row-title">Haftalık özet</div>
        <div className="lp-m-chart">
          <div style={{ height: "45%", background: "var(--lp-teal)" }} />
          <div style={{ height: "70%", background: "var(--lp-gold)" }} />
          <div style={{ height: "30%", background: "var(--lp-brick)" }} />
          <div style={{ height: "85%", background: "var(--lp-teal)" }} />
          <div style={{ height: "55%", background: "var(--lp-gold)" }} />
          <div style={{ height: "65%", background: "var(--lp-teal)" }} />
        </div>
        <div className="lp-m-note">Net trendi ↑ — son 3 denemede +12 net</div>
      </>
    ),
  },
  {
    id: "koc",
    label: "Koç",
    title: "Sınıfın geneli tek ekranda",
    desc: "Hangi öğrenci hangi konuda geride, kim risk altında — toplu görünümle anında fark et.",
    mock: (
      <>
        <div className="lp-m-row-title">Sınıf durumu</div>
        <div className="lp-m-list">
          <div className="lp-m-row lp-m-satir">
            <span>Ahmet Y.</span>
            <span style={{ color: "var(--lp-teal)", fontWeight: 700 }}>%82</span>
          </div>
          <div className="lp-m-row lp-m-satir">
            <span>Elif K.</span>
            <span style={{ color: "var(--lp-brick)", fontWeight: 700 }}>%47</span>
          </div>
          <div className="lp-m-row lp-m-satir">
            <span>Mert D.</span>
            <span style={{ color: "var(--lp-gold-dim)", fontWeight: 700 }}>%65</span>
          </div>
        </div>
      </>
    ),
  },
];

function RolesDesktop() {
  const { ref, progress, active } = useScrollStages<HTMLDivElement>(ROLLER.length);
  const rol = ROLLER[active];

  function atla(i: number) {
    const outer = ref.current;
    if (!outer) return;
    const total = outer.offsetHeight - window.innerHeight;
    const top = outer.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((i + 0.5) * total) / ROLLER.length, behavior: "smooth" });
  }

  return (
    <div className="lp-scroll-outer" ref={ref} id="roller">
      <div className="lp-scroll-sticky">
        <div className="lp-roles-grid">
          <div className="lp-roles-copy">
            <div className="lp-eyebrow">Kimin için</div>
            <h2>Herkes kendi ekranını görür.</h2>
            <div className="lp-role-no">
              {String(active + 1).padStart(2, "0")} / {String(ROLLER.length).padStart(2, "0")}
            </div>
            <h3 className="lp-role-title" key={`${rol.id}-t`}>
              {rol.title}
            </h3>
            <p className="lp-lede lp-role-desc" key={`${rol.id}-d`}>
              {rol.desc}
            </p>
            <div className="lp-roles-tabs">
              {ROLLER.map((r, i) => (
                <button
                  key={r.id}
                  className={`lp-role-tab${i === active ? " lp-active" : ""}`}
                  onClick={() => atla(i)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lp-roles-visual" style={{ "--rol-p": progress } as CSSProperties}>
            <div className="lp-role-mock" key={rol.id}>
              {rol.mock}
            </div>
          </div>
        </div>

        <div className="lp-h-progress">
          <div className="lp-h-progress-bar" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function RolesMobile() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="lp-section" ref={ref} id="roller">
      <div className="lp-eyebrow lp-reveal">Kimin için</div>
      <h2 className="lp-reveal">Herkes kendi ekranını görür.</h2>
      <div className="lp-roles-stack">
        {ROLLER.map((r) => (
          <div className="lp-roles-stack-card lp-reveal" key={r.id}>
            <div className="lp-m-row-title">{r.label}</div>
            <h3 className="lp-role-title">{r.title}</h3>
            <p className="lp-fcard-desc">{r.desc}</p>
            <div className="lp-role-mock">{r.mock}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RolesSection() {
  const isDesktop = useMediaQuery("(min-width: 821px) and (pointer: fine)");
  return isDesktop ? <RolesDesktop /> : <RolesMobile />;
}
