import { useEffect, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { kocNotlariniGetir, kocNotEkle, kocNotSil } from "../../lib/kocAraclariQueries";
import type { KocNot } from "../../types/database";

const ONEM_ETIKET: Record<string, string> = { dusuk: "düşük", normal: "normal", yuksek: "yüksek" };

export default function KocNotlar() {
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [ogrenciId, setOgrenciId] = useState("");
  const [notlar, setNotlar] = useState<KocNot[]>([]);
  const [metin, setMetin] = useState("");
  const [onem, setOnem] = useState("normal");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    kocOgrencileri()
      .then((o) => {
        setOgrenciler(o);
        if (o.length > 0) setOgrenciId(o[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    if (!ogrenciId) {
      setNotlar([]);
      return;
    }
    kocNotlariniGetir(ogrenciId).then(setNotlar).catch(() => {});
  }, [ogrenciId]);

  async function handleEkle() {
    if (!ogrenciId || !metin.trim()) return;
    setKaydediliyor(true);
    try {
      const yeni = await kocNotEkle(ogrenciId, metin.trim(), onem);
      setNotlar((n) => [yeni, ...n]);
      setMetin("");
      setOnem("normal");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function handleSil(id: string) {
    setNotlar((n) => n.filter((x) => x.id !== id));
    await kocNotSil(id);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Koç Notları</h1>

      {ogrenciler.length === 0 ? (
        <div className="card stagger-item">
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz öğrencin yok.</p>
        </div>
      ) : (
        <>
          <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
            <h2 className="card-title">Öğrenci</h2>
            <select className="input" style={{ width: "100%" }} value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)}>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </select>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
            <h2 className="card-title">Not Ekle</h2>
            <textarea
              className="input"
              style={{ width: "100%", minHeight: 70, resize: "vertical" }}
              value={metin}
              onChange={(e) => setMetin(e.target.value)}
              placeholder="Bu öğrenci hakkında notun…"
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <select className="input" style={{ width: 140 }} value={onem} onChange={(e) => setOnem(e.target.value)}>
                {Object.entries(ONEM_ETIKET).map(([d, et]) => (
                  <option key={d} value={d}>{et}</option>
                ))}
              </select>
              <button onClick={handleEkle} disabled={kaydediliyor || !metin.trim()} className="btn btn-primary" style={{ flex: 1 }}>
                {kaydediliyor ? "Kaydediliyor…" : "Notu Kaydet"}
              </button>
            </div>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
            <h2 className="card-title">Notlar</h2>
            {notlar.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bu öğrenci için henüz not yok.</p>}
            {notlar.map((n, i) => (
              <div key={n.id} className="stagger-item" style={{ padding: "11px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.03}s` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span
                        className="chip"
                        style={{
                          fontSize: 10.5,
                          background: n.onem === "yuksek" ? "var(--yanlis)" : n.onem === "normal" ? "var(--gold-dim)" : "var(--paper-dim)",
                          color: n.onem === "yuksek" ? "#fff" : "var(--ink)",
                        }}
                      >
                        {ONEM_ETIKET[n.onem] ?? n.onem}
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                        {new Date(n.created_at).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{n.not_metni}</p>
                  </div>
                  <button onClick={() => handleSil(n.id)} style={{ border: "none", background: "none", color: "var(--yanlis)", fontSize: 12 }}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
