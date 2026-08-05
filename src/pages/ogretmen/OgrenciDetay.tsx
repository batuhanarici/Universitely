import { useEffect, useState } from "react";
import { ogrenciDetayiGetir, type OgrenciDetay } from "../../lib/ogrenciYonetimQueries";
import ProgressBar from "../../components/ProgressBar";
import AnimatedNumber from "../../components/AnimatedNumber";

export default function OgrenciDetay({ ogrenciId, onGeri }: { ogrenciId: string; onGeri: () => void }) {
  const [detay, setDetay] = useState<OgrenciDetay | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    ogrenciDetayiGetir(ogrenciId)
      .then(setDetay)
      .catch(() => setDetay(null))
      .finally(() => setYukleniyor(false));
  }, [ogrenciId]);

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;
  if (!detay) return <p className="mono" style={{ color: "var(--muted)" }}>Öğrenci bulunamadı.</p>;

  const bekleyenGorev = detay.gorevler.filter((g) => !g.tamamlandi).length;
  const cozulmemisYanlis = detay.yanlislar.filter((y) => !y.cozuldu).length;
  const toplamCalismaDk = detay.calismalar.reduce((a, c) => a + c.sure_dk, 0);
  const sonNet = detay.netler[0]?.net ?? null;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div className="stagger-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 24, color: "var(--ink)" }}>{detay.ad_soyad}</h1>
        <button onClick={onGeri} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)" }}>← Geri</button>
      </div>

      <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, animationDelay: "0.05s" }}>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{sonNet !== null ? <AnimatedNumber value={sonNet} decimals={1} /> : "—"}</p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>son net</p>
        </div>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--gold-dim)" }}>{Math.round(toplamCalismaDk / 60)}s</p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>toplam çalışma</p>
        </div>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: bekleyenGorev > 0 ? "var(--gold-dim)" : "var(--ink)" }}>{bekleyenGorev}</p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>bekleyen görev</p>
        </div>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: cozulmemisYanlis > 0 ? "var(--yanlis)" : "var(--ink)" }}>{cozulmemisYanlis}</p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>çözülmemiş yanlış</p>
        </div>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
        <h2 className="card-title">Deneme Netleri</h2>
        {detay.netler.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz deneme sonucu yok.</p>}
        {detay.netler.slice(0, 8).map((n, i) => (
          <div key={i} className="stagger-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.03}s` }}>
            <div>
              <p style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{n.deneme_adi}</p>
              <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{n.tarih} · {n.dogru}D {n.yanlis}Y</p>
            </div>
            <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{n.net}</span>
          </div>
        ))}
      </div>

      <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16, animationDelay: "0.15s" }}>
        <div className="card" style={{ marginTop: 0 }}>
          <h2 className="card-title" style={{ marginBottom: 6 }}>Görevler</h2>
          {detay.gorevler.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Görev yok.</p>}
          {detay.gorevler.slice(0, 6).map((g) => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f2f2f2" }}>
              <input type="checkbox" checked={g.tamamlandi} readOnly style={{ accentColor: "var(--gold-dim)" }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12.5, color: "var(--ink)", textDecoration: g.tamamlandi ? "line-through" : "none", opacity: g.tamamlandi ? 0.5 : 1 }}>{g.baslik}</p>
                <p className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                  {g.tarih}
                  {g.tamamlandi && (
                    <span style={{ color: g.kontrol_edildi ? "var(--dogru)" : "var(--gold-dim)" }}>
                      {" "}· {g.kontrol_edildi ? "onaylandı" : "onay bekliyor"}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 0 }}>
          <h2 className="card-title" style={{ marginBottom: 6 }}>Kaynaklar</h2>
          {detay.kitaplar.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Kaynak yok.</p>}
          {detay.kitaplar.slice(0, 5).map((k, ki) => {
            const yuzde = k.toplam === 0 ? 0 : Math.round((k.ilerleme / k.toplam) * 100);
            return (
              <div key={k.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 12.5, color: "var(--ink)" }}>{k.ad}</p>
                  <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{k.ilerleme}/{k.toplam}</span>
                </div>
                <ProgressBar oran={yuzde} color="var(--gold-dim)" delay={ki * 40} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16, animationDelay: "0.2s" }}>
        <div className="card" style={{ marginTop: 0 }}>
          <h2 className="card-title" style={{ marginBottom: 6 }}>Yanlış Arşivi</h2>
          {detay.yanlislar.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Yanlış yok.</p>}
          {detay.yanlislar.slice(0, 5).map((y) => (
            <div key={y.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f2f2f2" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: y.cozuldu ? "var(--dogru)" : "var(--yanlis)", flexShrink: 0 }} />
              <p style={{ flex: 1, fontSize: 12.5, color: "var(--ink)" }}>{y.aciklama || y.kaynak_adi || "Yanlış"}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 0 }}>
          <h2 className="card-title" style={{ marginBottom: 6 }}>Son Çalışmalar</h2>
          {detay.calismalar.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Çalışma kaydı yok.</p>}
          {detay.calismalar.slice(0, 5).map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f2f2f2" }}>
              <p style={{ fontSize: 12.5, color: "var(--ink)" }}>{c.not ?? (c.konu_id ? "Konu çalışması" : "Genel çalışma")}</p>
              <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.sure_dk}dk · {c.tarih}</span>
            </div>
          ))}
        </div>
      </div>

      {detay.profil && (detay.profil.hedef_net != null || detay.profil.hedef_universite) && (
        <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.25s", borderLeft: "4px solid var(--gold)" }}>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}>HEDEF</p>
          {detay.profil.hedef_universite && <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{detay.profil.hedef_universite}</p>}
          {detay.profil.hedef_bolum && <p style={{ fontSize: 12.5, color: "var(--muted)" }}>{detay.profil.hedef_bolum}</p>}
          {detay.profil.hedef_net != null && <span className="chip mono" style={{ marginTop: 6 }}>Hedef {detay.profil.hedef_net} net</span>}
        </div>
      )}
    </div>
  );
}
