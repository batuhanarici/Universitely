import { Card } from "../../components/ui";
import { kocRehberGruplari } from "../../lib/kocRehberIcerik";

export default function YardimSayfasi() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Yardım</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>
          Koç panelindeki bölümlerin ne işe yaradığına dair kısa bir rehber
        </p>
      </div>

      {kocRehberGruplari.map((grup) => (
        <Card key={grup.baslik}>
          <h3 className="section-title" style={{ marginBottom: 4, fontSize: 16 }}>{grup.baslik}</h3>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.55)", marginBottom: 14 }}>{grup.ozet}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {grup.sayfalar.map((s) => (
              <div key={s.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-gold)", marginTop: 6, flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 13, color: "rgba(15,27,45,0.55)" }}> — {s.aciklama}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
