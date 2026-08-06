import { useEffect, useMemo, useState } from "react";
import { gorevleriGetir, gorevTamamla } from "../../lib/gorevQueries";
import { tekrarPlanlariniGetir, tekrarPlanYapildi } from "../../lib/tekrarPlanQueries";
import type { Gorev, TekrarPlan } from "../../types/database";
import { Card, Checkbox } from "../../components/ui";

const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getWeekDays(baseDate: Date) {
  const days = [];
  const start = new Date(baseDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
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

  const bugun = new Date();
  const weekDays = useMemo(() => getWeekDays(bugun), []);

  function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }
  function isToday(d: Date) { return fmtDate(d) === fmtDate(bugun); }

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

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Takvim</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Haftalık görevler ve tekrar planı</p>
      </div>

      <Card style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", gap: 0, minWidth: 700 }}>
          {weekDays.map((day, i) => {
            const dateStr = fmtDate(day);
            const dayTasks = gorevler.filter((g) => g.tarih === dateStr);
            const dayReps = planlar.filter((p) => p.plan_tarihi === dateStr);
            return (
              <div key={i} style={{
                borderRight: i < 6 ? "1px solid rgba(15,27,45,0.07)" : "none",
                padding: "12px 10px",
                background: isToday(day) ? "rgba(228,187,96,0.06)" : "transparent",
                minHeight: 160,
              }}>
                <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)" }}>{dayNames[i]}</span>
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: isToday(day) ? "#0F1B2D" : "transparent",
                    color: isToday(day) ? "#F4EFE4" : "#0F1B2D",
                    fontSize: 13, fontWeight: 700,
                  }}>{day.getDate()}</span>
                </div>
                {dayTasks.length === 0 && dayReps.length === 0 ? (
                  <span style={{ fontSize: 12, color: "rgba(15,27,45,0.3)" }}>—</span>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dayTasks.map((g) => (
                      <label key={g.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
                        <Checkbox checked={g.tamamlandi} onChange={() => toggleGorev(g)} />
                        <span style={{ fontSize: 11, lineHeight: 1.4, textDecoration: g.tamamlandi ? "line-through" : "none", color: g.tamamlandi ? "rgba(15,27,45,0.35)" : g.tip === "koc" ? "#A07C20" : "#0F1B2D" }}>
                          {g.baslik}
                        </span>
                      </label>
                    ))}
                    {dayReps.map((p) => (
                      <label key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
                        <Checkbox checked={p.yapildi} onChange={() => togglePlan(p)} />
                        <span style={{ fontSize: 11, lineHeight: 1.4, color: "#C4503A", textDecoration: p.yapildi ? "line-through" : "none" }}>Tekrar: {p.aciklama}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <p style={{ fontSize: 12, color: "rgba(15,27,45,0.4)" }}>
        Koç atamaları <strong style={{ color: "#E4BB60" }}>altın</strong> renkte, tekrar planları <strong style={{ color: "#C4503A" }}>kırmızı</strong> olarak gösterilir.
      </p>
    </div>
  );
}
