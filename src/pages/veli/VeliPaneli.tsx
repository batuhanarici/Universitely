import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { veliSonuclari, velininKocu, type VeliSonucSatiri } from "../../lib/veliQueries";
import { mesajlariGetir, mesajGonder, mesajOkunduIsaretle } from "../../lib/mesajQueries";
import type { Mesaj } from "../../types/database";
import AnimatedNumber from "../../components/AnimatedNumber";
import UYArrow from "../../components/UYArrow";

type Sekme = "genel" | "mesaj";

export default function VeliPaneli() {
  const { session } = useAuth();
  const [sekme, setSekme] = useState<Sekme>("genel");
  const [sonuclar, setSonuclar] = useState<VeliSonucSatiri[]>([]);
  const [kocId, setKocId] = useState<string | null>(null);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const altRef = useRef<HTMLDivElement>(null);
  const ben = session?.user.id;

  useEffect(() => {
    Promise.all([veliSonuclari(), velininKocu(), mesajlariGetir()])
      .then(([s, k, m]) => {
        setSonuclar(s);
        setKocId(k);
        setMesajlar(m);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    const bekleyen = mesajlar.filter((m) => m.alici_id === ben && !m.okundu);
    for (const m of bekleyen) mesajOkunduIsaretle(m.id).catch(() => {});
    if (altRef.current) altRef.current.scrollTop = altRef.current.scrollHeight;
  }, [mesajlar, ben]);

  const istatistik = useMemo(() => {
    const denemeMap = new Map<string, { ad: string; tarih: string; dogru: number; yanlis: number }>();
    const dersMap = new Map<string, { dogru: number; toplam: number }>();
    for (const s of sonuclar) {
      if (!denemeMap.has(s.deneme_id)) denemeMap.set(s.deneme_id, { ad: s.deneme_adi, tarih: s.tarih, dogru: 0, yanlis: 0 });
      const o = denemeMap.get(s.deneme_id)!;
      if (s.durum === "dogru") o.dogru++;
      else if (s.durum === "yanlis") o.yanlis++;
      if (!dersMap.has(s.ders_adi)) dersMap.set(s.ders_adi, { dogru: 0, toplam: 0 });
      const d = dersMap.get(s.ders_adi)!;
      d.toplam++;
      if (s.durum === "dogru") d.dogru++;
    }
    const denemeler = Array.from(denemeMap.values())
      .map((o) => ({ ...o, net: Math.round((o.dogru - o.yanlis / 4) * 10) / 10 }))
      .sort((a, b) => b.tarih.localeCompare(a.tarih));
    const ort = denemeler.length === 0 ? null : denemeler.reduce((a, d) => a + d.net, 0) / denemeler.length;
    const dersler = Array.from(dersMap.entries())
      .map(([ad, d]) => ({ ad, yuzde: d.toplam === 0 ? 0 : Math.round((d.dogru / d.toplam) * 100) }))
      .sort((a, b) => a.yuzde - b.yuzde);
    return { denemeler, ort, dersler };
  }, [sonuclar]);

  async function handleGonder() {
    if (!kocId || !girdi.trim()) return;
    setGonderiliyor(true);
    try {
      const yeni = await mesajGonder(kocId, girdi.trim());
      setMesajlar((m) => [...m, yeni]);
      setGirdi("");
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="mark"><UYArrow size={20} color="#E4BB60" /></span>
          <span className="sidebar-logo-text">Universitely</span>
        </div>
        <nav className="sidebar-nav">
          <p className="sidebar-grup">Veli</p>
          <button onClick={() => setSekme("genel")} className={`sidebar-item${sekme === "genel" ? " active" : ""}`}>
            <span>📊</span><span>Genel Durum</span>
          </button>
          <button onClick={() => setSekme("mesaj")} className={`sidebar-item${sekme === "mesaj" ? " active" : ""}`}>
            <span>✉️</span><span>Koç'a Mesaj</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button onClick={() => supabase.auth.signOut()}>Çıkış Yap</button>
        </div>
      </aside>
      <main className="main-area">
        {sekme === "genel" && (
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Çocuğumun Durumu</h1>

            {sonuclar.length === 0 ? (
              <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
                <p style={{ color: "var(--muted)", fontSize: 13 }}>
                  Henüz sonuç verisi yok ya da hesabın çocuğuna bağlanmamış. Bağlantı kodu ile kayıt olduysan koçundan kontrol etmesini iste.
                </p>
              </div>
            ) : (
              <>
                <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, animationDelay: "0.05s" }}>
                  <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)" }}>
                      {istatistik.ort !== null ? <AnimatedNumber value={Math.round(istatistik.ort * 10) / 10} decimals={1} /> : "—"}
                    </p>
                    <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>ortalama net</p>
                  </div>
                  <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)" }}><AnimatedNumber value={istatistik.denemeler.length} /></p>
                    <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>deneme</p>
                  </div>
                </div>

                <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
                  <h2 className="card-title">Son Denemeler</h2>
                  {istatistik.denemeler.map((d, i) => (
                    <div key={i} className="stagger-item" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.04}s` }}>
                      <div>
                        <p style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{d.ad}</p>
                        <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{d.tarih} · {d.dogru}D {d.yanlis}Y</p>
                      </div>
                      <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{d.net} net</span>
                    </div>
                  ))}
                </div>

                <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
                  <h2 className="card-title">Ders Bazlı Başarı</h2>
                  {istatistik.dersler.map((d, i) => (
                    <div key={d.ad} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.04}s` }}>
                      <span style={{ width: 110, fontSize: 13, color: "var(--ink)" }}>{d.ad}</span>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${d.yuzde}%`, background: d.yuzde < 55 ? "var(--yanlis)" : d.yuzde >= 80 ? "var(--dogru)" : "var(--gold-dim)" }} />
                      </div>
                      <span className="mono" style={{ width: 42, textAlign: "right", fontSize: 12.5, color: "var(--muted)" }}>{d.yuzde}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {sekme === "mesaj" && (
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Koç'a Mesaj</h1>
            <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
              <div ref={altRef} style={{ height: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "4px 2px" }}>
                {mesajlar.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz mesaj yok.</p>}
                {mesajlar.map((m) => {
                  const benimki = m.gonderici_id === ben;
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: benimki ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "78%", padding: "8px 12px", borderRadius: 12,
                        background: benimki ? "var(--ink)" : "var(--paper-dim)",
                        color: benimki ? "var(--gold-glow)" : "var(--ink-text)",
                        fontSize: 13.5, lineHeight: 1.5,
                      }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: benimki ? "rgba(255,255,255,0.5)" : "var(--muted)", marginBottom: 3 }}>
                          {benimki ? "Sen" : "Koç"}
                        </p>
                        <p>{m.icerik}</p>
                        <p style={{ fontSize: 10, color: benimki ? "rgba(255,255,255,0.4)" : "var(--muted)", marginTop: 4 }}>
                          {new Date(m.tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input className="input" style={{ flex: 1 }} value={girdi} onChange={(e) => setGirdi(e.target.value)} placeholder="Koçuna mesajını yaz…" onKeyDown={(e) => e.key === "Enter" && handleGonder()} />
                <button onClick={handleGonder} disabled={gonderiliyor || !girdi.trim() || !kocId} className="btn btn-primary">Gönder</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
