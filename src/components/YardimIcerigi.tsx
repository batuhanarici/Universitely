import { Card, Btn } from "./ui";
import { Icon } from "./Icon";
import type { RehberGrup } from "../lib/rehberTipleri";

export default function YardimIcerigi({ gruplar, onTuruBaslat }: { gruplar: RehberGrup[]; onTuruBaslat?: () => void }) {
  return (
    <>
      {onTuruBaslat && (
        <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "rgba(228,187,96,0.08)", borderColor: "rgba(228,187,96,0.3)" }}>
          <div>
            <h3 className="section-title" style={{ fontSize: 15, marginBottom: 2 }}>Tanıtım turunu tekrar izle</h3>
            <p style={{ fontSize: 12.5, color: "rgba(15,27,45,0.55)" }}>İlk girişte gördüğün spot ışıklı turu istediğin zaman tekrar başlatabilirsin.</p>
          </div>
          <Btn variant="gold" size="sm" onClick={onTuruBaslat}>
            <Icon name="ai" size={14} /> Turu Başlat
          </Btn>
        </Card>
      )}
      {gruplar.map((grup) => (
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
    </>
  );
}
