import { useEffect, useMemo, useState } from "react";
import { kocAnalizVerisiniGetir } from "../../lib/kocAiQueries";
import { kocRiskleriniHesapla, type OgrenciRiski, type RiskFaktoru } from "../../lib/aiMotoru";
import { Card, KPICard, Badge, ProgressBar } from "../../components/ui";
import { Icon } from "../../components/Icon";

const SEVIYE: Record<string, { metin: string; renk: string; bar: string; badge: "brick" | "gold" | "teal" }> = {
  yuksek: { metin: "yüksek", renk: "#C4503A", bar: "#C4503A", badge: "brick" },
  orta: { metin: "orta", renk: "#A07C20", bar: "#E4BB60", badge: "gold" },
  dusuk: { metin: "düşük", renk: "#1E7A6E", bar: "#2A9D8F", badge: "teal" },
};

export default function KocAI({ onOgrenciSec }: { onOgrenciSec: (id: string) => void }) {
  const [riskler, setRiskler] = useState<OgrenciRiski[]>([]);
  const [acik, setAcik] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    kocAnalizVerisiniGetir()
      .then((v) => setRiskler(kocRiskleriniHesapla(v)))
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const dagilim = useMemo(() => {
    const yuksek = riskler.filter((r) => r.seviye === "yuksek").length;
    const orta = riskler.filter((r) => r.seviye === "orta").length;
    const dusuk = riskler.filter((r) => r.seviye === "dusuk").length;
    return { yuksek, orta, dusuk };
  }, [riskler]);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">AI Risk Analizi</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>5 risk faktörüne dayalı bileşik risk skoru</p>
      </div>

      <div className="grid-3">
        <KPICard label="Yüksek Riskli" value={dagilim.yuksek} color="#C4503A" />
        <KPICard label="Orta Riskli" value={dagilim.orta} color="#A07C20" />
        <KPICard label="Düşük Riskli" value={dagilim.dusuk} color="#1E7A6E" />
      </div>

      {riskler.length === 0 ? (
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz öğrencin yok ya da veri girilmemiş.</p>
        </Card>
      ) : (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Bileşik Öncelik Sıralaması</h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {riskler.map((r, i) => {
              const sv = SEVIYE[r.seviye];
              const acikMi = acik === r.ogrenci_id;
              return (
                <div key={r.ogrenci_id} style={{ padding: "12px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="tabular" style={{ width: 24, fontSize: 13, fontWeight: 700, color: "rgba(15,27,45,0.45)" }}>{i + 1}.</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>{r.ad_soyad}</p>
                        <Badge variant={sv.badge}>{sv.metin}</Badge>
                        {r.ortalamaNet !== null && <span style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)" }}>{r.ortalamaNet} net ort.</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5 }}>
                        <div style={{ flex: 1 }}><ProgressBar pct={r.riskSkoru} color={sv.bar} /></div>
                        <span className="tabular" style={{ width: 40, textAlign: "right", fontSize: 13, fontWeight: 700 }}>{r.riskSkoru}</span>
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => onOgrenciSec(r.ogrenci_id)}><Icon name="user" size={12} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setAcik(acikMi ? null : r.ogrenci_id)}>
                      {acikMi ? "Kapat" : "Analiz"}
                    </button>
                  </div>

                  {acikMi && (
                    <div style={{ marginTop: 10, paddingLeft: 34 }}>
                      <div className="grid-2">
                        {r.faktorler.map((f: RiskFaktoru) => (
                          <div key={f.id} style={{ background: "#F0EBE0", borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <p style={{ fontSize: 12, fontWeight: 600 }}>{f.ad}</p>
                              <span className="tabular" style={{ fontSize: 12, fontWeight: 700, color: f.puan >= 50 ? "#C4503A" : f.puan >= 25 ? "#A07C20" : "rgba(15,27,45,0.5)" }}>
                                {f.puan}
                              </span>
                            </div>
                            <div style={{ marginTop: 5 }}><ProgressBar pct={Math.max(f.puan, 2)} color={f.puan >= 50 ? "#C4503A" : f.puan >= 25 ? "#E4BB60" : "#2A9D8F"} /></div>
                            <p style={{ fontSize: 11, color: "rgba(15,27,45,0.55)", marginTop: 5, lineHeight: 1.4 }}>{f.detay}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.45)", marginBottom: 4 }}>AI Önerileri</p>
                        {r.oneriler.map((on, j) => (
                          <p key={j} style={{ fontSize: 12.5, lineHeight: 1.5, display: "flex", gap: 6, marginBottom: 3 }}>
                            <span style={{ color: "#A07C20" }}>›</span>
                            {on}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
