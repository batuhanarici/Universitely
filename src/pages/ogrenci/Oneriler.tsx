import { useEffect, useState } from "react";
import { motorVerisiniGetir, onerileriUret, type Oneri } from "../../lib/oneriMotoru";
import { Card, Badge, Btn, EmptyState } from "../../components/ui";

const priorityVariant: Record<Oneri["oncelik"], { badge: "brick" | "gold" | "teal"; etiket: string }> = {
  yuksek: { badge: "brick", etiket: "Öncelikli" },
  orta: { badge: "gold", etiket: "Dikkat" },
  dusuk: { badge: "teal", etiket: "İyi Gidiyorsun" },
};

export default function Oneriler() {
  const [oneriler, setOneriler] = useState<Oneri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [yenilemeAnahtari, setYenilemeAnahtari] = useState(0);

  async function yukle(yenile: boolean) {
    if (yenile) setYenileniyor(true);
    try {
      const v = await motorVerisiniGetir();
      setOneriler(onerileriUret(v));
    } catch {
      setOneriler([]);
    } finally {
      setYukleniyor(false);
      setYenileniyor(false);
      if (yenile) setYenilemeAnahtari((k) => k + 1);
    }
  }

  useEffect(() => {
    yukle(false);
  }, []);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">AI Koçum</h1>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Verilerine dayalı kişisel öneriler</p>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => yukle(true)} disabled={yenileniyor}>
          {yenileniyor ? "Analiz…" : "↻ Yenile"}
        </Btn>
      </div>

      {oneriler.length === 0 ? (
        <Card>
          <EmptyState icon="🤖" title="Henüz öneri yok" desc="Daha fazla deneme ve çalışma verisi ekledikçe öneriler oluşur." />
        </Card>
      ) : (
        <div key={yenilemeAnahtari} className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {oneriler.map((on, i) => (
            <Card key={`${yenilemeAnahtari}-${i}`} className="tape-accent" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{on.ikon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                  <Badge variant="gray">{on.kategori}</Badge>
                  <Badge variant={priorityVariant[on.oncelik].badge}>{priorityVariant[on.oncelik].etiket}</Badge>
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "#0F1B2D", marginBottom: 6 }}>{on.baslik}</h3>
                <p style={{ fontSize: 13, color: "rgba(15,27,45,0.65)", lineHeight: 1.6 }}>{on.detay}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
