import { useEffect, useState } from "react";
import { ogrencileriGetir } from "../../lib/sonucQueries";
import { gorevleriGetir, gorevAta, gorevSil } from "../../lib/gorevQueries";
import type { Gorev, Ogrenci } from "../../types/database";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function OgretmenGorevAta() {
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [ogrenciId, setOgrenciId] = useState("");
  const [baslik, setBaslik] = useState("");
  const [tarih, setTarih] = useState(bugunIso());
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([ogrencileriGetir(), gorevleriGetir()])
      .then(([o, g]) => {
        setOgrenciler(o);
        setGorevler(g);
        if (o.length > 0) setOgrenciId(o[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  async function handleAta() {
    if (!ogrenciId || !baslik.trim() || !tarih) return;
    await gorevAta(ogrenciId, baslik.trim(), tarih);
    setBaslik("");
    const g = await gorevleriGetir();
    setGorevler(g);
  }

  async function handleSil(id: string) {
    setGorevler((gs) => gs.filter((x) => x.id !== id));
    await gorevSil(id);
  }

  const ogrenciHaritasi = new Map(ogrenciler.map((o) => [o.id, o.ad_soyad]));
  const kocGorevleri = gorevler.filter((g) => g.tip === "koc");

  if (yukleniyor) return <p>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Koç Görevi Ata</h1>

      {ogrenciler.length === 0 ? (
        <p style={{ color: "var(--yanlis)" }}>Henüz öğrenci yok.</p>
      ) : (
        <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
          <h2 className="card-title">Yeni Görev</h2>
          <select className="input" style={{ width: "100%" }} value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)}>
            {ogrenciler.map((o) => <option key={o.id} value={o.id}>{o.ad_soyad}</option>)}
          </select>
          <input className="input" style={{ width: "100%", marginTop: 8 }} value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Görev açıklaması" onKeyDown={(e) => e.key === "Enter" && handleAta()} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input className="input" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ flex: 1 }} />
            <button onClick={handleAta} disabled={!baslik.trim()} className="btn btn-primary">Ata</button>
          </div>
        </div>
      )}

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
        <h2 className="card-title">Atanan Koç Görevleri</h2>
        {kocGorevleri.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz görev atanmamış.</p>}
        {kocGorevleri.map((g, i) => (
          <div key={g.id} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.04}s` }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13.5, color: "var(--ink)", textDecoration: g.tamamlandi ? "line-through" : "none", opacity: g.tamamlandi ? 0.5 : 1 }}>{g.baslik}</p>
              <p style={{ fontSize: 11.5, color: "var(--muted)" }}>{ogrenciHaritasi.get(g.ogrenci_id) ?? "?"} · {g.tarih}{g.tamamlandi ? " · tamamlandı" : ""}</p>
            </div>
            <button onClick={() => handleSil(g.id)} style={{ border: "none", background: "none", color: "var(--yanlis)", fontSize: 12 }}>Sil</button>
          </div>
        ))}
      </div>
    </div>
  );
}