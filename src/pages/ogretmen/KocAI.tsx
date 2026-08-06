import { useEffect, useMemo, useState } from "react";
import { kocAnalizVerisiniGetir } from "../../lib/kocAiQueries";
import { kocRiskleriniHesapla, type OgrenciRiski, type RiskFaktoru } from "../../lib/aiMotoru";
import AnimatedNumber from "../../components/AnimatedNumber";

const SEVIYE: Record<string, { metin: string; renk: string; bar: string }> = {
  yuksek: { metin: "yüksek", renk: "var(--yanlis)", bar: "var(--yanlis)" },
  orta: { metin: "orta", renk: "var(--gold-dim)", bar: "var(--gold-dim)" },
  dusuk: { metin: "düşük", renk: "var(--dogru)", bar: "var(--dogru)" },
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

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>AI Risk Analizi</h1>

      <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, animationDelay: "0.05s" }}>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--yanlis)" }}><AnimatedNumber value={dagilim.yuksek} /></p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>yüksek riskli</p>
        </div>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--gold-dim)" }}><AnimatedNumber value={dagilim.orta} /></p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>orta riskli</p>
        </div>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--dogru)" }}><AnimatedNumber value={dagilim.dusuk} /></p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>düşük riskli</p>
        </div>
      </div>

      {riskler.length === 0 ? (
        <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz öğrencin yok ya da veri girilmemiş.</p>
        </div>
      ) : (
        <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
          <h2 className="card-title">Bileşik Öncelik Sıralaması</h2>
          {riskler.map((r, i) => {
            const sv = SEVIYE[r.seviye];
            const acikMi = acik === r.ogrenci_id;
            return (
              <div key={r.ogrenci_id} className="stagger-item" style={{ padding: "12px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.03}s` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="mono" style={{ width: 24, fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>{i + 1}.</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{r.ad_soyad}</p>
                      <span className="chip" style={{ fontSize: 10.5, background: sv.renk, color: "#fff" }}>{sv.metin}</span>
                      {r.ortalamaNet !== null && <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{r.ortalamaNet} net ort.</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5 }}>
                      <div className="progress-track" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${Math.max(r.riskSkoru, 2)}%`, background: sv.bar }} />
                      </div>
                      <span className="mono" style={{ width: 40, textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{r.riskSkoru}</span>
                    </div>
                  </div>
                  <button onClick={() => onOgrenciSec(r.ogrenci_id)} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)", padding: "6px 12px", fontSize: 12 }}>Detay</button>
                  <button onClick={() => setAcik(acikMi ? null : r.ogrenci_id)} style={{ border: "none", background: "none", color: "var(--muted)", fontSize: 12 }}>
                    {acikMi ? "Kapat" : "Analiz"}
                  </button>
                </div>

                {acikMi && (
                  <div style={{ marginTop: 10, paddingLeft: 34 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {r.faktorler.map((f: RiskFaktoru) => (
                        <div key={f.id} style={{ background: "var(--paper-dim)", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{f.ad}</p>
                            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: f.puan >= 50 ? "var(--yanlis)" : f.puan >= 25 ? "var(--gold-dim)" : "var(--muted)" }}>
                              {f.puan}
                            </span>
                          </div>
                          <div className="progress-track" style={{ marginTop: 5 }}>
                            <div className="progress-fill" style={{ width: `${Math.max(f.puan, 2)}%`, background: f.puan >= 50 ? "var(--yanlis)" : f.puan >= 25 ? "var(--gold-dim)" : "var(--dogru)" }} />
                          </div>
                          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 5, lineHeight: 1.4 }}>{f.detay}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>AI Önerileri</p>
                      {r.oneriler.map((on, j) => (
                        <p key={j} style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5, display: "flex", gap: 6, marginBottom: 3 }}>
                          <span style={{ color: "var(--gold-dim)" }}>›</span>
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
      )}
    </div>
  );
}
