import { useEffect, useMemo, useState } from "react";
import { dersleriGetir } from "../../lib/kocAraclariQueries";
import {
  okulDersProgramiEkle,
  okulDersProgramiSil,
  okulDersPrograminiGetir,
} from "../../lib/programQueries";
import { gorevleriGetir, gorevTamamla } from "../../lib/gorevQueries";
import { tekrarPlanlariniGetir, tekrarPlanYapildi } from "../../lib/tekrarPlanQueries";
import type { Gorusme, Gorev, OkulDersProgrami, TekrarPlan } from "../../types/database";
import { Card, Checkbox, Select, Input, Btn, Label, FormGroup } from "../../components/ui";

const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const fullDayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

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

function fmtDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function saatEtiketi(tarih: string) {
  return new Date(tarih).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function saatAraligi(baslangic: string, bitis: string) {
  return `${baslangic.slice(0, 5)}–${bitis.slice(0, 5)}`;
}

export default function Takvim() {
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [planlar, setPlanlar] = useState<TekrarPlan[]>([]);
  const [dersler, setDersler] = useState<Gorusme[]>([]);
  const [okulDersleri, setOkulDersleri] = useState<OkulDersProgrami[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [programKaydediliyor, setProgramKaydediliyor] = useState(false);
  const [programHatasi, setProgramHatasi] = useState("");

  const [yeniGun, setYeniGun] = useState("1");
  const [yeniBaslangic, setYeniBaslangic] = useState("08:30");
  const [yeniBitis, setYeniBitis] = useState("09:10");
  const [yeniDersAdi, setYeniDersAdi] = useState("");

  useEffect(() => {
    Promise.all([
      gorevleriGetir(),
      tekrarPlanlariniGetir(),
      dersleriGetir(),
      okulDersPrograminiGetir(),
    ])
      .then(([g, p, d, okul]) => {
        setGorevler(g);
        setPlanlar(p);
        setDersler(d);
        setOkulDersleri(okul);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const bugun = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getWeekDays(bugun), [bugun]);

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

  async function okulDersiEkle(e: React.FormEvent) {
    e.preventDefault();
    setProgramHatasi("");
    if (!yeniDersAdi.trim() || !yeniBaslangic || !yeniBitis) return;
    setProgramKaydediliyor(true);
    try {
      const yeni = await okulDersProgramiEkle({
        gun: Number(yeniGun),
        baslangic: yeniBaslangic,
        bitis: yeniBitis,
        ders_adi: yeniDersAdi.trim(),
      });
      setOkulDersleri((mevcut) => [...mevcut, yeni].sort((a, b) => a.gun - b.gun || a.baslangic.localeCompare(b.baslangic)));
      setYeniDersAdi("");
    } catch {
      setProgramHatasi("Ders eklenemedi. Başlangıç ve bitiş saatini kontrol et.");
    } finally {
      setProgramKaydediliyor(false);
    }
  }

  async function okulDersiSil(ders: OkulDersProgrami) {
    setProgramHatasi("");
    setOkulDersleri((mevcut) => mevcut.filter((x) => x.id !== ders.id));
    try {
      await okulDersProgramiSil(ders.id);
    } catch {
      setOkulDersleri((mevcut) => [...mevcut, ders].sort((a, b) => a.gun - b.gun || a.baslangic.localeCompare(b.baslangic)));
      setProgramHatasi("Ders silinemedi. Lütfen tekrar dene.");
    }
  }

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Takvim</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Koçluk dersleri, okul programı, haftalık görevler ve tekrar planı</p>
      </div>

      <Card style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(150px, 1fr))", gap: 0, minWidth: 1050 }}>
          {weekDays.map((day, i) => {
            const dateStr = fmtDate(day);
            const dayTasks = gorevler.filter((g) => g.tarih === dateStr);
            const dayReps = planlar.filter((p) => p.plan_tarihi === dateStr);
            const dayLessons = dersler.filter((d) => fmtDate(new Date(d.tarih)) === dateStr);
            const daySchoolLessons = okulDersleri.filter((d) => d.gun === i + 1);
            const bos = dayTasks.length === 0 && dayReps.length === 0 && dayLessons.length === 0 && daySchoolLessons.length === 0;
            return (
              <div key={dateStr} style={{
                borderRight: i < 6 ? "1px solid rgba(15,27,45,0.07)" : "none",
                padding: "12px 10px",
                background: isToday(day) ? "rgba(228,187,96,0.06)" : "transparent",
                minHeight: 230,
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
                {bos ? (
                  <span style={{ fontSize: 12, color: "rgba(15,27,45,0.3)" }}>—</span>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {dayLessons.map((ders) => (
                      <div key={ders.id} style={{ padding: "7px 7px 7px 8px", borderLeft: "3px solid #2A9D8F", borderRadius: "0 6px 6px 0", background: ders.durum === "iptal" ? "rgba(196,80,58,0.07)" : "rgba(42,157,143,0.08)", opacity: ders.durum === "iptal" ? 0.65 : 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: "#2A9D8F", marginBottom: 2 }}>{saatEtiketi(ders.tarih)}</div>
                        <div style={{ fontSize: 11, lineHeight: 1.35, color: "#0F1B2D", textDecoration: ders.durum === "iptal" ? "line-through" : "none" }}>{ders.baslik}</div>
                        {ders.durum === "iptal" && <div style={{ fontSize: 9, color: "#C4503A", marginTop: 2 }}>İptal edildi</div>}
                      </div>
                    ))}
                    {daySchoolLessons.map((ders) => (
                      <div key={ders.id} style={{ padding: "6px 7px", borderLeft: "3px solid #16283F", borderRadius: "0 6px 6px 0", background: "rgba(22,40,63,0.06)" }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(22,40,63,0.6)", marginBottom: 2 }}>{saatAraligi(ders.baslangic, ders.bitis)}</div>
                        <div style={{ fontSize: 11, lineHeight: 1.35, color: "#16283F" }}>{ders.ders_adi}</div>
                      </div>
                    ))}
                    {dayTasks.map((g) => (
                      <label key={g.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
                        <Checkbox checked={g.tamamlandi} onChange={() => toggleGorev(g)} />
                        <span style={{ fontSize: 11, lineHeight: 1.4, textDecoration: g.tamamlandi ? "line-through" : "none", color: g.tamamlandi ? "rgba(15,27,45,0.35)" : g.tip === "koc" ? "#A07C20" : "#0F1B2D" }}>{g.baslik}</span>
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

      <Card>
        <div style={{ marginBottom: 14 }}>
          <h2 className="section-title" style={{ fontSize: 17, marginBottom: 4 }}>Okul Ders Programım</h2>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Buraya eklediğin dersler her hafta takviminde tekrar görünür.</p>
        </div>
        <form onSubmit={okulDersiEkle} style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1.7fr auto", gap: 10, alignItems: "end" }}>
          <FormGroup>
            <Label>Gün</Label>
            <Select value={yeniGun} onChange={(e) => setYeniGun(e.target.value)}>
              {fullDayNames.map((gun, index) => <option key={gun} value={String(index + 1)}>{gun}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Başlangıç</Label>
            <Input type="time" value={yeniBaslangic} onChange={(e) => setYeniBaslangic(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Bitiş</Label>
            <Input type="time" value={yeniBitis} onChange={(e) => setYeniBitis(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Ders adı</Label>
            <Input placeholder="Örn. Matematik" value={yeniDersAdi} onChange={(e) => setYeniDersAdi(e.target.value)} required />
          </FormGroup>
          <Btn variant="primary" type="submit" disabled={programKaydediliyor}>{programKaydediliyor ? "…" : "Ekle"}</Btn>
        </form>
        {programHatasi && <p style={{ color: "#C4503A", fontSize: 12, marginTop: 10 }}>{programHatasi}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", gap: 8, overflowX: "auto", marginTop: 18, paddingBottom: 2 }}>
          {fullDayNames.map((gun, index) => {
            const dersler = okulDersleri.filter((d) => d.gun === index + 1);
            return (
              <div key={gun} style={{ minWidth: 120, minHeight: 88, padding: 8, borderRadius: 8, background: "rgba(22,40,63,0.035)", border: "1px solid rgba(22,40,63,0.08)" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(22,40,63,0.55)", marginBottom: 7 }}>{gun.slice(0, 3)}</div>
                {dersler.length === 0 ? <span style={{ fontSize: 11, color: "rgba(15,27,45,0.25)" }}>—</span> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dersler.map((ders) => (
                      <div key={ders.id} style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: "rgba(22,40,63,0.65)" }}>{saatAraligi(ders.baslangic, ders.bitis)}</div>
                          <div style={{ fontSize: 11, color: "#16283F", lineHeight: 1.3 }}>{ders.ders_adi}</div>
                        </div>
                        <button type="button" onClick={() => okulDersiSil(ders)} aria-label={`${ders.ders_adi} dersini sil`} style={{ border: 0, background: "none", color: "#C4503A", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <p style={{ fontSize: 12, color: "rgba(15,27,45,0.4)" }}>
        Koçluk dersleri <strong style={{ color: "#2A9D8F" }}>teal</strong>, okul dersleri <strong style={{ color: "#16283F" }}>lacivert</strong>, koç görevleri <strong style={{ color: "#A07C20" }}>altın</strong>, tekrar planları <strong style={{ color: "#C4503A" }}>kırmızı</strong> olarak gösterilir.
      </p>
    </div>
  );
}
