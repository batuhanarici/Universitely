import { useEffect, useState } from "react";
import { ogrenciDetayiGetir, type OgrenciDetay } from "../../lib/ogrenciYonetimQueries";
import { Card, KPICard, ProgressBar, Checkbox, Btn, Badge } from "../../components/ui";

export default function OgrenciDetay({ ogrenciId, onGeri }: { ogrenciId: string; onGeri: () => void }) {
  const [detay, setDetay] = useState<OgrenciDetay | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    ogrenciDetayiGetir(ogrenciId)
      .then(setDetay)
      .catch(() => setDetay(null))
      .finally(() => setYukleniyor(false));
  }, [ogrenciId]);

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;
  if (!detay) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Öğrenci bulunamadı.</p>;

  const bekleyenGorev = detay.gorevler.filter((g) => !g.tamamlandi).length;
  const cozulmemisYanlis = detay.yanlislar.filter((y) => !y.cozuldu).length;
  const toplamCalismaDk = detay.calismalar.reduce((a, c) => a + c.sure_dk, 0);
  const sonNet = detay.netler[0]?.net ?? null;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>{detay.ad_soyad}</h1>
        <Btn variant="ghost" size="sm" onClick={onGeri}>← Geri</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPICard label="Son net" value={sonNet ?? 0} decimals={1} />
        <KPICard label="Toplam çalışma" value={Math.round(toplamCalismaDk / 60)} sub="saat" color="#A07C20" />
        <KPICard label="Bekleyen görev" value={bekleyenGorev} color={bekleyenGorev > 0 ? "#A07C20" : "#0F1B2D"} />
        <KPICard label="Çözülmemiş yanlış" value={cozulmemisYanlis} color={cozulmemisYanlis > 0 ? "#C4503A" : "#0F1B2D"} />
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Deneme Netleri</h3>
        {detay.netler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz deneme sonucu yok.</p>}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {detay.netler.slice(0, 8).map((n, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 500 }}>{n.deneme_adi}</p>
                <p className="tabular" style={{ fontSize: 11, color: "rgba(15,27,45,0.5)" }}>{n.tarih} · {n.dogru}D {n.yanlis}Y</p>
              </div>
              <span className="tabular" style={{ fontSize: 16, fontWeight: 700 }}>{n.net}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <h3 className="section-title" style={{ marginBottom: 6, fontSize: 16 }}>Görevler</h3>
          {detay.gorevler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Görev yok.</p>}
          {detay.gorevler.slice(0, 6).map((g) => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <Checkbox checked={g.tamamlandi} readOnly />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12.5, textDecoration: g.tamamlandi ? "line-through" : "none", opacity: g.tamamlandi ? 0.5 : 1 }}>{g.baslik}</p>
                <p className="tabular" style={{ fontSize: 10.5, color: "rgba(15,27,45,0.5)" }}>
                  {g.tarih}
                  {g.tamamlandi && (
                    <span style={{ color: g.kontrol_edildi ? "#2A9D8F" : "#A07C20" }}>
                      {" "}· {g.kontrol_edildi ? "onaylandı" : "onay bekliyor"}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="section-title" style={{ marginBottom: 6, fontSize: 16 }}>Kaynaklar</h3>
          {detay.kitaplar.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Kaynak yok.</p>}
          {detay.kitaplar.slice(0, 5).map((k) => {
            const yuzde = k.toplam === 0 ? 0 : Math.round((k.ilerleme / k.toplam) * 100);
            return (
              <div key={k.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 12.5 }}>{k.ad}</p>
                  <span className="tabular" style={{ fontSize: 11, color: "rgba(15,27,45,0.5)" }}>{k.ilerleme}/{k.toplam}</span>
                </div>
                <ProgressBar pct={yuzde} color="#A07C20" />
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <h3 className="section-title" style={{ marginBottom: 6, fontSize: 16 }}>Yanlış Arşivi</h3>
          {detay.yanlislar.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Yanlış yok.</p>}
          {detay.yanlislar.slice(0, 5).map((y) => (
            <div key={y.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: y.cozuldu ? "#2A9D8F" : "#C4503A", flexShrink: 0 }} />
              <p style={{ flex: 1, fontSize: 12.5 }}>{y.aciklama || y.kaynak_adi || "Yanlış"}</p>
              <Badge variant={y.cozuldu ? "teal" : "brick"}>{y.cozuldu ? "çözüldü" : "çözülmedi"}</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="section-title" style={{ marginBottom: 6, fontSize: 16 }}>Son Çalışmalar</h3>
          {detay.calismalar.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Çalışma kaydı yok.</p>}
          {detay.calismalar.slice(0, 5).map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <p style={{ fontSize: 12.5 }}>{c.not ?? (c.konu_id ? "Konu çalışması" : "Genel çalışma")}</p>
              <span className="tabular" style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)" }}>{c.sure_dk}dk · {c.tarih}</span>
            </div>
          ))}
        </Card>
      </div>

      {detay.profil && (detay.profil.hedef_net != null || detay.profil.hedef_universite) && (
        <Card style={{ borderLeft: "4px solid #E4BB60" }}>
          <p className="mono" style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)", marginBottom: 6 }}>HEDEF</p>
          {detay.profil.hedef_universite && <p style={{ fontSize: 14, fontWeight: 600 }}>{detay.profil.hedef_universite}</p>}
          {detay.profil.hedef_bolum && <p style={{ fontSize: 12.5, color: "rgba(15,27,45,0.5)" }}>{detay.profil.hedef_bolum}</p>}
          {detay.profil.hedef_net != null && <Badge variant="gold" >Hedef {detay.profil.hedef_net} net</Badge>}
        </Card>
      )}
    </div>
  );
}
