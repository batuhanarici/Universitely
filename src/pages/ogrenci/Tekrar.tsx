import { useEffect, useMemo, useState } from "react";
import { tekrarPlanlariniGetir, tekrarPlanEkle, tekrarPlanYapildi, tekrarPlanSil } from "../../lib/tekrarPlanQueries";
import type { TekrarPlan } from "../../types/database";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Tekrar() {
  const [planlar, setPlanlar] = useState<TekrarPlan[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aciklama, setAciklama] = useState("");
  const [planTarihi, setPlanTarihi] = useState(bugunIso());

  useEffect(() => {
    tekrarPlanlariniGetir().then(setPlanlar).catch(() => {}).finally(() => setYukleniyor(false));
  }, []);

  async function handleEkle() {
    if (!aciklama.trim()) return;
    const yeni = await tekrarPlanEkle(aciklama.trim(), null, planTarihi);
    setPlanlar((p) => [...p, yeni]);
    setAciklama("");
  }

  async function toggleYapildi(p: TekrarPlan) {
    const yeni = !p.yapildi;
    setPlanlar((ps) => ps.map((x) => (x.id === p.id ? { ...x, yapildi: yeni } : x)));
    await tekrarPlanYapildi(p.id, yeni);
  }

  async function handleSil(id: string) {
    setPlanlar((ps) => ps.filter((x) => x.id !== id));
    await tekrarPlanSil(id);
  }

  const bugun = bugunIso();
  const bugunku = useMemo(() => planlar.filter((p) => p.plan_tarihi === bugun && !p.yapildi), [planlar, bugun]);
  const yapilmamis = useMemo(() => planlar.filter((p) => p.plan_tarihi !== bugun && !p.yapildi), [planlar, bugun]);
  const tamamlananlar = useMemo(() => planlar.filter((p) => p.yapildi), [planlar]);

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  function Satir({ p, i }: { p: TekrarPlan; i: number }) {
    return (
      <div className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.04}s` }}>
        <input type="checkbox" checked={p.yapildi} onChange={() => toggleYapildi(p)} style={{ accentColor: "var(--gold-dim)", width: 16, height: 16 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13.5, color: "var(--ink)", textDecoration: p.yapildi ? "line-through" : "none", opacity: p.yapildi ? 0.5 : 1 }}>{p.aciklama}</p>
          <p style={{ fontSize: 11.5, color: "var(--muted)" }}>{p.plan_tarihi}</p>
        </div>
        <button onClick={() => handleSil(p.id)} style={{ border: "none", background: "none", color: "var(--yanlis)", fontSize: 12 }}>Sil</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Tekrar Planı</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <h2 className="card-title">Yeni Tekrar Ekle</h2>
        <input className="input" style={{ width: "100%" }} value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Tekrar edilecek konu / soru" onKeyDown={(e) => e.key === "Enter" && handleEkle()} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input className="input" type="date" value={planTarihi} onChange={(e) => setPlanTarihi(e.target.value)} style={{ flex: 1 }} />
          <button onClick={handleEkle} disabled={!aciklama.trim()} className="btn btn-primary">Ekle</button>
        </div>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
        <h2 className="card-title">Bugün ({bugunku.length})</h2>
        {bugunku.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bugün için tekrar yok.</p>}
        {bugunku.map((p, i) => <Satir key={p.id} p={p} i={i} />)}
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
        <h2 className="card-title">Gelecek Tekrarlar ({yapilmamis.length})</h2>
        {yapilmamis.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Planlanmış tekrar yok.</p>}
        {yapilmamis.map((p, i) => <Satir key={p.id} p={p} i={i} />)}
      </div>

      {tamamlananlar.length > 0 && (
        <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.2s" }}>
          <h2 className="card-title">Tamamlananlar ({tamamlananlar.length})</h2>
          {tamamlananlar.map((p, i) => <Satir key={p.id} p={p} i={i} />)}
        </div>
      )}
    </div>
  );
}
