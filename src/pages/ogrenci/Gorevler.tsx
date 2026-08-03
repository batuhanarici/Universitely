import { useEffect, useMemo, useState } from "react";
import { gorevleriGetir, gorevEkle, gorevTamamla, gorevSil } from "../../lib/gorevQueries";
import type { Gorev, GorevTipi } from "../../types/database";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function tarihEtiketi(tarih: string): string {
  const d = new Date(tarih + "T00:00:00");
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const fark = Math.round((d.getTime() - bugun.getTime()) / 86400000);
  if (fark === 0) return "Bugün";
  if (fark === 1) return "Yarın";
  if (fark === -1) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function Gorevler() {
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [baslik, setBaslik] = useState("");
  const [tarih, setTarih] = useState(bugunIso());
  const [tip, setTip] = useState<GorevTipi>("gunluk");

  useEffect(() => {
    gorevleriGetir().then(setGorevler).finally(() => setYukleniyor(false));
  }, []);

  async function handleEkle() {
    if (!baslik.trim()) return;
    const yeni = await gorevEkle({ baslik: baslik.trim(), tarih, tip });
    setGorevler((g) => [yeni, ...g]);
    setBaslik("");
  }

  async function toggleGorev(g: Gorev) {
    const yeniDurum = !g.tamamlandi;
    setGorevler((gs) => gs.map((x) => (x.id === g.id ? { ...x, tamamlandi: yeniDurum } : x)));
    await gorevTamamla(g.id, yeniDurum);
  }

  async function handleSil(id: string) {
    setGorevler((gs) => gs.filter((x) => x.id !== id));
    await gorevSil(id);
  }

  const gunlukGorevler = useMemo(() => gorevler.filter((g) => g.tip === "gunluk"), [gorevler]);
  const haftalikGorevler = useMemo(() => gorevler.filter((g) => g.tip === "haftalik"), [gorevler]);

  const bugunGunluk = gunlukGorevler.filter((g) => g.tarih === bugunIso());
  const tamamlananYuzde = bugunGunluk.length === 0 ? 0 : Math.round((bugunGunluk.filter((g) => g.tamamlandi).length / bugunGunluk.length) * 100);

  function GorevSatiri({ g }: { g: Gorev }) {
    return (
      <div className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2" }}>
        <input type="checkbox" checked={g.tamamlandi} onChange={() => toggleGorev(g)} style={{ accentColor: "var(--gold-dim)", width: 16, height: 16 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", textDecoration: g.tamamlandi ? "line-through" : "none", opacity: g.tamamlandi ? 0.45 : 1 }}>
            {g.baslik}
          </p>
          <p style={{ fontSize: 11.5, color: "var(--muted)" }}>{tarihEtiketi(g.tarih)}</p>
        </div>
        <button onClick={() => handleSil(g.id)} style={{ border: "none", background: "none", color: "var(--yanlis)", fontSize: 12 }}>Sil</button>
      </div>
    );
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Görevler</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <h2 className="card-title">Yeni Görev</h2>
        <input className="input" style={{ width: "100%" }} value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Görev başlığı" onKeyDown={(e) => e.key === "Enter" && handleEkle()} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input className="input" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ flex: 1 }} />
          <select className="input" value={tip} onChange={(e) => setTip(e.target.value as GorevTipi)} style={{ flex: 1 }}>
            <option value="gunluk">Günlük</option>
            <option value="haftalik">Haftalık hedef</option>
          </select>
          <button onClick={handleEkle} disabled={!baslik.trim()} className="btn btn-primary">Ekle</button>
        </div>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Bugün ({bugunGunluk.length})</h2>
          {bugunGunluk.length > 0 && <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{tamamlananYuzde}% tamamlandı</span>}
        </div>
        {bugunGunluk.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bugün için görev yok.</p>}
        {bugunGunluk.map((g) => <GorevSatiri key={g.id} g={g} />)}
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
        <h2 className="card-title">Tüm Günlük Görevler</h2>
        {gunlukGorevler.filter((g) => g.tarih !== bugunIso()).length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Başka günlük görev yok.</p>}
        {gunlukGorevler.filter((g) => g.tarih !== bugunIso()).map((g) => <GorevSatiri key={g.id} g={g} />)}
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.2s" }}>
        <h2 className="card-title">Haftalık Hedefler</h2>
        {haftalikGorevler.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Haftalık hedef yok.</p>}
        {haftalikGorevler.map((g) => <GorevSatiri key={g.id} g={g} />)}
      </div>
    </div>
  );
}
