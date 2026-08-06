import { Card, Badge } from "../../components/ui";
import { useVeliVeri } from "./VeliVeri";
import { useVeliDerived } from "./veliDerived";

function gunEtiketi(tarih: string): string {
  return new Date(tarih + "T00:00:00").toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });
}

export default function Takvim() {
  const { yukleniyor, veri } = useVeliVeri();
  const d = useVeliDerived();

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  const gunler = d.son14Gun.slice(7);

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Takvim</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Haftalık plan ve görüşme tarihleri</p>
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Haftalık Plan</h3>
        {veri.calismalar.length === 0 && veri.gorevler.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Henüz çalışma/görev kaydı yok.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {gunler.map((g) => {
              const gunGorevler = veri.gorevler.filter((x) => x.tarih === g.tarih);
              return (
                <div key={g.tarih} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid rgba(15,27,45,0.06)", alignItems: "flex-start" }}>
                  <div style={{ minWidth: 90 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#0F1B2D" }}>{gunEtiketi(g.tarih)}</p>
                    <p style={{ fontSize: 11, color: "rgba(15,27,45,0.45)" }}>{g.sure} dk · {g.soru} soru</p>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {gunGorevler.length === 0 ? (
                      <span style={{ fontSize: 12, color: "rgba(15,27,45,0.35)", fontStyle: "italic" }}>Görev yok</span>
                    ) : (
                      gunGorevler.map((t) => (
                        <Badge key={t.id} variant={t.tamamlandi ? "teal" : "gray"}>
                          {t.tamamlandi ? "✓ " : "○ "}{t.baslik.length > 30 ? t.baslik.slice(0, 30) + "…" : t.baslik}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Görüşme Tarihleri</h3>
        {d.gelecekGorusmeler.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Planlanmış görüşme yok.</p>
        ) : (
          d.gelecekGorusmeler.map((m) => (
            <div key={m.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(15,27,45,0.06)", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{m.baslik}</p>
                <p style={{ fontSize: 11, color: "rgba(15,27,45,0.5)" }}>
                  {new Date(m.tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <Badge variant="gray">{m.katilimci === "veli" ? "veli görüşmesi" : "öğrenci görüşmesi"}</Badge>
              <Badge variant="gold">{m.durum === "planlandi" ? "Planlandı" : m.durum}</Badge>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
