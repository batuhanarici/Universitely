import { useEffect, useState } from "react";
import type { Ders, Konu } from "../../types/database";
import { dersleriGetir, dersEkle, konulariGetir, konuEkle } from "../../lib/queries";

export default function DersKonuYonetimi() {
  const [dersler, setDersler] = useState<Ders[]>([]);
  const [seciliDersId, setSeciliDersId] = useState<string>("");
  const [konular, setKonular] = useState<Konu[]>([]);
  const [yeniDersAdi, setYeniDersAdi] = useState("");
  const [yeniKonuAdi, setYeniKonuAdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    dersleriGetir()
      .then((d) => {
        setDersler(d);
        if (d.length > 0) setSeciliDersId(d[0].id);
      })
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    if (!seciliDersId) { setKonular([]); return; }
    konulariGetir(seciliDersId).then(setKonular);
  }, [seciliDersId]);

  async function handleDersEkle() {
    if (!yeniDersAdi.trim()) return;
    const yeni = await dersEkle(yeniDersAdi.trim());
    setDersler((d) => [...d, yeni].sort((a, b) => a.ad.localeCompare(b.ad)));
    setYeniDersAdi("");
    setSeciliDersId(yeni.id);
  }

  async function handleKonuEkle() {
    if (!yeniKonuAdi.trim() || !seciliDersId) return;
    const yeni = await konuEkle(seciliDersId, yeniKonuAdi.trim());
    setKonular((k) => [...k, yeni].sort((a, b) => a.ad.localeCompare(b.ad)));
    setYeniKonuAdi("");
  }

  if (yukleniyor) return <p>Yükleniyor…</p>;

  return (
    <div>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Ders / Konu Yönetimi</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <h2 className="card-title">Dersler</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            value={yeniDersAdi}
            onChange={(e) => setYeniDersAdi(e.target.value)}
            placeholder="örn. Matematik"
            className="input"
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && handleDersEkle()}
          />
          <button onClick={handleDersEkle} className="btn btn-primary">Ekle</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {dersler.map((d) => (
            <button
              key={d.id}
              onClick={() => setSeciliDersId(d.id)}
              className={`chip${d.id === seciliDersId ? " active" : ""}`}
            >
              {d.ad}
            </button>
          ))}
        </div>
      </div>

      {seciliDersId && (
        <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
          <h2 className="card-title">Konular — {dersler.find((d) => d.id === seciliDersId)?.ad}</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input
              value={yeniKonuAdi}
              onChange={(e) => setYeniKonuAdi(e.target.value)}
              placeholder="örn. Türev"
              className="input"
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === "Enter" && handleKonuEkle()}
            />
            <button onClick={handleKonuEkle} className="btn btn-primary">Ekle</button>
          </div>
          <div>
            {konular.map((k, i) => (
              <div key={k.id} className="stagger-item" style={{ padding: "8px 0", borderBottom: "1px solid #f2f2f2", fontSize: 13.5, animationDelay: `${0.15 + i * 0.04}s` }}>
                {k.ad}
              </div>
            ))}
            {konular.length === 0 && <p style={{ color: "var(--muted)" }}>Henüz konu eklenmedi.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
