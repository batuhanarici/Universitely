import { useEffect, useState } from "react";
import { kocOgrencileri, davetKoduUret, ogrenciAktifYap, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";

export default function OgrenciYonetimi({ onOgrenciSec }: { onOgrenciSec: (id: string) => void }) {
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [ad, setAd] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [uretilenKod, setUretilenKod] = useState("");
  const [kopyalandi, setKopyalandi] = useState(false);
  const [hata, setHata] = useState("");
  const [isleniyor, setIsleniyor] = useState(false);

  async function verileriYenile() {
    try {
      const o = await kocOgrencileri();
      setOgrenciler(o);
    } catch (e: any) {
      setHata(e.message ?? "Bir hata oluştu.");
    }
  }

  useEffect(() => {
    verileriYenile().finally(() => setYukleniyor(false));
  }, []);

  async function handleDavetUret() {
    if (!ad.trim()) return;
    setHata("");
    setKopyalandi(false);
    setIsleniyor(true);
    try {
      const kod = await davetKoduUret(ad.trim());
      setUretilenKod(kod);
      setAd("");
    } catch (e: any) {
      setHata(e.message ?? "Kod üretilemedi.");
    } finally {
      setIsleniyor(false);
    }
  }

  async function handleAktifDegistir(o: KocOgrencisi) {
    try {
      const sonuc = await ogrenciAktifYap(o.id, !o.aktif);
      if (sonuc) await verileriYenile();
    } catch (e: any) {
      setHata(e.message ?? "Güncellenemedi.");
    }
  }

  async function kopyala(kod: string) {
    try {
      await navigator.clipboard.writeText(kod);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 1500);
    } catch {}
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Öğrenciler</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <h2 className="card-title">Yeni Öğrenci Davet Kodu</h2>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}>
          Öğrencinin adını yaz, bir davet kodu üret. Öğrenci "Öğrenci Kaydı" yaparken bu kodu girer ve sana otomatik bağlanır.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input" style={{ flex: 1 }} value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Öğrencinin adı soyadı" onKeyDown={(e) => e.key === "Enter" && handleDavetUret()} />
          <button onClick={handleDavetUret} disabled={!ad.trim() || isleniyor} className="btn btn-primary">Kod Üret</button>
        </div>
        {uretilenKod && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "rgba(228,187,96,0.12)", border: "1px solid var(--gold-dim)" }}>
            <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 4 }}>DAVET KODU</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: "var(--ink)" }}>{uretilenKod}</span>
              <button onClick={() => kopyala(uretilenKod)} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)", padding: "6px 12px", fontSize: 12 }}>
                {kopyalandi ? "Kopyalandı ✓" : "Kopyala"}
              </button>
            </div>
          </div>
        )}
        {hata && <p style={{ marginTop: 10, color: "var(--yanlis)", fontSize: 13 }}>{hata}</p>}
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
        <h2 className="card-title">Öğrenci Listesi</h2>
        {ogrenciler.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz bağlı öğrenci yok.</p>}
        {ogrenciler.map((o, i) => (
          <div key={o.id} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.04}s` }}>
            <span
              style={{
                width: 9, height: 9, borderRadius: 99, flexShrink: 0, cursor: "pointer",
                background: o.aktif ? "var(--dogru)" : "#cfcfcf",
              }}
              title="Aktif/pasif değiştir"
              onClick={() => handleAktifDegistir(o)}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{o.ad_soyad}</p>
              <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                {o.aktif ? "Aktif" : "Pasif"}
                {o.davet_kodu ? ` · veli bağlantı kodu: ${o.davet_kodu}` : ""}
              </p>
            </div>
            <button onClick={() => onOgrenciSec(o.id)} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)", padding: "6px 12px", fontSize: 12 }}>Detay</button>
          </div>
        ))}
      </div>
    </div>
  );
}
