import { useEffect, useMemo, useState } from "react";
import { gorevleriGetir, gorevTamamla } from "../../lib/gorevQueries";
import { tekrarPlanlariniGetir, tekrarPlanYapildi } from "../../lib/tekrarPlanQueries";
import type { Gorev } from "../../types/database";
import type { TekrarPlan } from "../../types/database";

function haftaGunleri(): { iso: string; etiket: string; gununMu: boolean }[] {
  const gunAdlari = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const gun = bugun.getDay();
  const liste: { iso: string; etiket: string; gununMu: boolean }[] = [];
  for (let i = gun; i >= 0; i--) {
    const d = new Date(bugun);
    d.setDate(bugun.getDate() - i);
    liste.push({ iso: d.toISOString().slice(0, 10), etiket: gunAdlari[d.getDay()], gununMu: d.getTime() === bugun.getTime() });
  }
  for (let i = 1; i <= 6 - gun; i++) {
    const d = new Date(bugun);
    d.setDate(bugun.getDate() + i);
    liste.push({ iso: d.toISOString().slice(0, 10), etiket: gunAdlari[d.getDay()], gununMu: false });
  }
  return liste;
}

export default function Takvim() {
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [planlar, setPlanlar] = useState<TekrarPlan[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([gorevleriGetir(), tekrarPlanlariniGetir()])
      .then(([g, p]) => {
        setGorevler(g);
        setPlanlar(p);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const gunler = useMemo(() => haftaGunleri(), []);

  async function toggleGorev(g: Gorev) {
    const yeni = !g.tamamlandi;
    setGorevler((gs) => gs.map((x) => (x.id === g.id ? { ...x, tamamlandi: yeni } : x)));
    await gorevTamamla(g.id, yeni);
  }

  async function togglePlan(p: TekrarPlan) {
    const yeni = !p.yapildi;
    setPlanlar((ps) => ps.map((x) => (x.id === p.id ? { ...x, yapildi: yeni } : x)));
    await tekrarPlanYapildi(p.id, yeni);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Bu Hafta</h1>

      <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, animationDelay: "0.05s" }}>
        {gunler.map((g) => {
          const gunGorevleri = gorevler.filter((x) => x.tarih === g.iso);
          const gunPlanlari = planlar.filter((x) => x.plan_tarihi === g.iso);
          return (
            <div
              key={g.iso}
              style={{
                border: g.gununMu ? "1.5px solid var(--gold-dim)" : "1px solid #EDF0F4",
                borderRadius: "var(--radius-sm)",
                background: g.gununMu ? "#FFFBEF" : "white",
                padding: 10, minHeight: 150,
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: g.gununMu ? "var(--gold-dim)" : "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
                {g.etiket}
              </p>
              {gunGorevleri.length === 0 && gunPlanlari.length === 0 && <p style={{ fontSize: 11, color: "var(--muted)", opacity: 0.5 }}>—</p>}
              {gunGorevleri.map((x) => (
                <div key={x.id} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 5 }}>
                  <input type="checkbox" checked={x.tamamlandi} onChange={() => toggleGorev(x)} style={{ accentColor: "var(--gold-dim)", width: 13, height: 13 }} />
                  <span style={{ fontSize: 11.5, color: "var(--ink)", textDecoration: x.tamamlandi ? "line-through" : "none", opacity: x.tamamlandi ? 0.5 : 1 }}>
                    {x.baslik}{x.tip === "koc" ? " ✚" : ""}
                  </span>
                </div>
              ))}
              {gunPlanlari.map((p) => (
                <div key={p.id} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 5 }}>
                  <input type="checkbox" checked={p.yapildi} onChange={() => togglePlan(p)} style={{ accentColor: "var(--yanlis)", width: 13, height: 13 }} />
                  <span style={{ fontSize: 11.5, color: "var(--yanlis)", textDecoration: p.yapildi ? "line-through" : "none", opacity: p.yapildi ? 0.5 : 1 }}>
                    Tekrar: {p.aciklama}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <p className="stagger-item" style={{ marginTop: 12, fontSize: 12, color: "var(--muted)", animationDelay: "0.1s" }}>
        ✚ Koç'un atadığı görev · Kırmızı kutular tekrar planıdır.
      </p>
    </div>
  );
}