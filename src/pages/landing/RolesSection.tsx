import { useState } from "react";
import { useReveal } from "./useReveal";

type RoleId = "ogrenci" | "veli" | "koc";

const ROLES: { id: RoleId; label: string; title: string; desc: string; mock: React.ReactNode }[] = [
  {
    id: "ogrenci",
    label: "Öğrenci",
    title: "Kendi zayıflığını kendin gör",
    desc: "Hangi konuya ağırlık vermen gerektiğini tahmin etmene gerek yok — sistem senin için işaretliyor.",
    mock: (
      <div className="lp-role-mock">
        <div className="lp-m-row-title">Tekrar havuzu</div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--lp-teal)" }} />
            Fizik — Soru 14 çözüldü
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, border: "1.5px solid rgba(22,40,63,0.25)" }} />
            Kimya — Soru 27 bekliyor
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, border: "1.5px solid rgba(22,40,63,0.25)" }} />
            Matematik — Soru 9 bekliyor
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "veli",
    label: "Veli",
    title: "Sormadan takip et",
    desc: "Haftalık özet ve konu bazlı ilerleme — telefon açıp sormaya gerek kalmadan.",
    mock: (
      <div className="lp-role-mock">
        <div className="lp-m-row-title">Haftalık özet</div>
        <div className="lp-m-chart" style={{ height: 120, marginTop: 14 }}>
          <div style={{ height: "45%", background: "var(--lp-teal)" }} />
          <div style={{ height: "70%", background: "var(--lp-gold)" }} />
          <div style={{ height: "30%", background: "var(--lp-brick)" }} />
          <div style={{ height: "85%", background: "var(--lp-teal)" }} />
          <div style={{ height: "55%", background: "var(--lp-gold)" }} />
          <div style={{ height: "65%", background: "var(--lp-teal)" }} />
        </div>
      </div>
    ),
  },
  {
    id: "koc",
    label: "Koç",
    title: "Sınıfın geneli tek ekranda",
    desc: "Hangi öğrenci hangi konuda geride, kim risk altında — toplu görünümle anında fark et.",
    mock: (
      <div className="lp-role-mock">
        <div className="lp-m-row-title">Sınıf durumu</div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
            <span>Ahmet Y.</span>
            <span style={{ color: "var(--lp-teal)", fontWeight: 700 }}>%82</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
            <span>Elif K.</span>
            <span style={{ color: "var(--lp-brick)", fontWeight: 700 }}>%47</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
            <span>Mert D.</span>
            <span style={{ color: "var(--lp-gold-dim)", fontWeight: 700 }}>%65</span>
          </div>
        </div>
      </div>
    ),
  },
];

export default function RolesSection() {
  const [active, setActive] = useState<RoleId>("ogrenci");
  const ref = useReveal<HTMLDivElement>();
  const role = ROLES.find((r) => r.id === active)!;

  return (
    <section className="lp-section lp-reveal" ref={ref}>
      <div className="lp-eyebrow">Kimin için</div>
      <h2>Her rol, kendi ekranını görür.</h2>

      <div className="lp-role-tabs">
        {ROLES.map((r) => (
          <button
            key={r.id}
            className={`lp-role-tab${r.id === active ? " lp-active" : ""}`}
            onClick={() => setActive(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="lp-role-panel" key={role.id}>
        <div>
          <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, marginBottom: 10 }}>{role.title}</h3>
          <p className="lp-lede" style={{ maxWidth: 360 }}>
            {role.desc}
          </p>
        </div>
        {role.mock}
      </div>
    </section>
  );
}
