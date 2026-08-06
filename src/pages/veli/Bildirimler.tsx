import { Card, EmptyState } from "../../components/ui";
import { useVeliVeri } from "./VeliVeri";
import { useVeliDerived } from "./veliDerived";

export default function Bildirimler() {
  const { yukleniyor } = useVeliVeri();
  const d = useVeliDerived();

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Bildirimler</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Çocuğunuzla ilgili hatırlatmalar</p>
      </div>

      {d.hatirlatmalar.length === 0 ? (
        <Card>
          <EmptyState icon="✅" title="Her şey yolunda!" desc="Bekleyen hatırlatma yok." />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {d.hatirlatmalar.map((n, i) => (
            <div
              key={`${n.baslik}-${i}`}
              className="card anim-slide"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                borderLeft: `3px solid ${n.oncelik === "yuksek" ? "#C4503A" : "#E4BB60"}`,
                borderRadius: "0 10px 10px 0",
              }}
            >
              <div style={{ fontSize: 22, flexShrink: 0 }}>{n.ikon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0F1B2D", lineHeight: 1.5 }}>{n.baslik}</p>
                <p style={{ fontSize: 12, color: "rgba(15,27,45,0.6)", marginTop: 3 }}>{n.detay}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
