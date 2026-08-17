import { Card, KPICard, ProgressBar, AnimatedNumber, Badge } from "../../components/ui";
import { useVeliVeri } from "./VeliVeri";
import { useVeliDerived } from "./veliDerived";
import { VeliHaftalikOzet } from "../../components/VeliHaftalikOzet";

function bugunEtiketi(): string {
  return new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function GenelDurum() {
  const { yukleniyor, sonuclar, veri } = useVeliVeri();
  const d = useVeliDerived();

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  const bosVeri = sonuclar.length === 0 && veri.calismalar.length === 0;
  const gorusmeHaritasi = new Map(veri.gorusmeler.map((gorusme) => [gorusme.id, gorusme]));

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Genel Durum</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Çocuğunuzun çalışma özeti · {bugunEtiketi()}</p>
      </div>

      {bosVeri ? (
        <Card>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.55)", lineHeight: 1.6 }}>
            Henüz veri yok ya da hesabın çocuğuna bağlanmamış. Bağlantı kodu ile kayıt olduysan koçundan kontrol etmesini iste.
          </p>
        </Card>
      ) : (
        <>
          <VeliHaftalikOzet veri={veri} />

          <div className="grid-2">
            {d.ort !== null ? (
              <KPICard label="Ortalama Net" value={Math.round(d.ort * 10) / 10} decimals={1} color="#E4BB60" />
            ) : (
              <div className="card tape-accent" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 4 }}>Ortalama Net</p>
                <p className="metric-value" style={{ fontSize: 36, fontWeight: 700, color: "#E4BB60", lineHeight: 1 }}>—</p>
                <p style={{ fontSize: 12, color: "rgba(15,27,45,0.5)", marginTop: 4 }}>henüz deneme yok</p>
              </div>
            )}
            <KPICard label="Toplam Deneme" value={d.denemeler.length} />
          </div>

          <div className="grid-2">
            <Card>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 8 }}>Bugünkü Çalışma</p>
              <span className="metric-value" style={{ fontSize: 40, fontWeight: 700, color: "#2A9D8F", lineHeight: 1 }}>
                <AnimatedNumber value={d.ozet.bugunSure} /> <span style={{ fontSize: 16, fontWeight: 500, color: "rgba(15,27,45,0.5)" }}>dk</span>
              </span>
            </Card>
            <Card>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 8 }}>Bugün Çözülen Soru</p>
              <span className="metric-value" style={{ fontSize: 40, fontWeight: 700, color: "#2A9D8F", lineHeight: 1 }}>
                <AnimatedNumber value={d.ozet.bugunSoru} />
              </span>
            </Card>
          </div>

          <Card className="tape-accent">
            <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Haftalık Özet</h3>
            <div className="grid-4" style={{ gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Çalışma</p>
                <p className="metric-value" style={{ fontSize: 22, fontWeight: 700 }}>
                  {Math.round((d.ozet.haftaSure / 60) * 10) / 10} <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(15,27,45,0.45)" }}>saat</span>
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Soru</p>
                <p className="metric-value" style={{ fontSize: 22, fontWeight: 700 }}>{d.ozet.haftaSoru}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Görev</p>
                <p className="metric-value" style={{ fontSize: 22, fontWeight: 700, color: d.ozet.haftaGorevKalan > 0 ? "#A07C20" : "#2A9D8F" }}>%{d.ozet.haftaGorevYuzde}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Deneme</p>
                <p className="metric-value" style={{ fontSize: 22, fontWeight: 700 }}>{d.ozet.haftaDeneme}</p>
              </div>
            </div>
          </Card>

          {(veri.seansNotlari.length > 0 || veri.takipMaddeleri.length > 0) && (
            <Card>
              <div style={{ marginBottom: 12 }}>
                <h3 className="section-title" style={{ marginBottom: 3, fontSize: 16 }}>Koçluk güncellemeleri</h3>
                <p style={{ fontSize: 12, color: "rgba(15,27,45,0.5)" }}>Koçunuzun paylaşmayı seçtiği seans özeti ve takip adımları.</p>
              </div>
              {veri.seansNotlari.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: veri.takipMaddeleri.length > 0 ? 14 : 0 }}>
                  {[...veri.seansNotlari].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 3).map((not) => (
                    <div key={not.id} style={{ padding: "9px 10px", borderRadius: 8, background: "rgba(42,157,143,0.06)", borderLeft: "3px solid #2A9D8F" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                        <strong style={{ fontSize: 12 }}>{gorusmeHaritasi.get(not.gorusme_id)?.baslik ?? "Koçluk seansı"}</strong>
                        <span style={{ fontSize: 11, color: "rgba(15,27,45,0.45)" }}>{new Date(not.updated_at).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <p style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(15,27,45,0.7)", whiteSpace: "pre-wrap" }}>{not.ozet}</p>
                    </div>
                  ))}
                </div>
              )}
              {veri.takipMaddeleri.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 7 }}>Takip adımları</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[...veri.takipMaddeleri].sort((a, b) => a.son_tarih.localeCompare(b.son_tarih)).slice(0, 5).map((takip) => (
                      <div key={takip.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(15,27,45,0.07)" }}>
                        <span style={{ flex: 1, fontSize: 12, textDecoration: takip.durum === "tamamlandi" ? "line-through" : "none", color: takip.durum === "tamamlandi" ? "rgba(15,27,45,0.38)" : "#16283F" }}>{takip.baslik}</span>
                        <Badge variant={takip.durum === "tamamlandi" ? "teal" : "gold"}>{takip.durum === "tamamlandi" ? "Tamamlandı" : "Açık"}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Konu İlerlemesi</h3>
              <span style={{ fontSize: 13, color: "rgba(15,27,45,0.5)" }}>{d.konuIlerleme.biten}/{d.konuIlerleme.toplam} konu</span>
            </div>
            <ProgressBar pct={d.konuIlerleme.yuzde} color={d.konuIlerleme.yuzde < 40 ? "#C4503A" : d.konuIlerleme.yuzde >= 75 ? "#2A9D8F" : "#E4BB60"} />
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 12, fontSize: 16 }}>Son Denemeler</h3>
            {d.denemeler.length === 0 ? (
              <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Henüz deneme sonucu yüklenmemiş.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Deneme</th><th>Tarih</th><th>D/Y</th><th>Net</th></tr>
                </thead>
                <tbody>
                  {[...d.denemeler].reverse().map((e) => (
                    <tr key={e.deneme_id ?? e.tarih}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{e.ad}</td>
                      <td style={{ fontSize: 12, color: "rgba(15,27,45,0.5)" }}>{e.tarih}</td>
                      <td className="tabular" style={{ fontSize: 12 }}>{e.dogru}/{e.yanlis}</td>
                      <td><span className="metric-value" style={{ fontSize: 18, fontWeight: 700 }}>{e.net}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 12, fontSize: 16 }}>Ders Bazlı Başarı</h3>
            {d.dersler.length === 0 ? (
              <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Henüz ders bazlı veri yok.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {d.dersler.map((s) => (
                  <div key={s.ad}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{s.ad}</span>
                      <span className="tabular" style={{ fontSize: 13, fontWeight: 600, color: s.yuzde < 55 ? "#C4503A" : "#2A9D8F" }}>{s.yuzde}%</span>
                    </div>
                    <ProgressBar pct={s.yuzde} color={s.yuzde < 55 ? "#C4503A" : "#2A9D8F"} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
