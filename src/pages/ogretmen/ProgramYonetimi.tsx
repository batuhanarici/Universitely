import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { haftalikProgramGetir, haftalikProgramKaydet } from "../../lib/programQueries";
import { gorevSil } from "../../lib/gorevQueries";
import type { Gorev } from "../../types/database";

const GUN_ADLARI = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTarih(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${g}`;
}

function haftaBaslangici(tarih: string): string {
  const d = new Date(tarih + "T00:00:00");
  const gun = d.getDay();
  d.setDate(d.getDate() - (gun === 0 ? 6 : gun - 1));
  return formatTarih(d);
}

function gunEkle(tarih: string, n: number): string {
  const d = new Date(tarih + "T00:00:00");
  d.setDate(d.getDate() + n);
  return formatTarih(d);
}

function tarihEtiketi(tarih: string): string {
  const d = new Date(tarih + "T00:00:00");
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const fark = Math.round((d.getTime() - bugun.getTime()) / 86400000);
  if (fark === 0) return "Bugün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function ProgramYonetimi() {
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [ogrenciId, setOgrenciId] = useState("");
  const [haftaTarih, setHaftaTarih] = useState(bugunIso());
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [yeniGorevler, setYeniGorevler] = useState<Record<number, string>>({});
  const [yukleniyor, setYukleniyor] = useState(true);

  const baslangic = useMemo(() => haftaBaslangici(haftaTarih), [haftaTarih]);
  const gunler = useMemo(
    () => Array.from({ length: 7 }, (_, i) => ({ tarih: gunEkle(baslangic, i), etiket: GUN_ADLARI[i] })),
    [baslangic]
  );
  const bitis = gunler[6].tarih;

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
      setGorevler([]);
      return;
    }
    haftalikProgramGetir(ogrenciId, baslangic, bitis).then(setGorevler).catch(() => {});
  }, [ogrenciId, baslangic, bitis]);

  const gunGorevleri = useMemo(() => {
    const map = new Map<string, Gorev[]>();
    for (const g of gorevler) {
      const liste = map.get(g.tarih) ?? [];
      liste.push(g);
      map.set(g.tarih, liste);
    }
    return map;
  }, [gorevler]);

  async function gunGorevleriniEkle(index: number) {
    if (!ogrenciId) return;
    const satirlar =
      (yeniGorevler[index] ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    if (satirlar.length === 0) return;
    await haftalikProgramKaydet(
      ogrenciId,
      satirlar.map((baslik) => ({ tarih: gunler[index].tarih, baslik }))
    );
    setYeniGorevler((y) => ({ ...y, [index]: "" }));
    setGorevler(await haftalikProgramGetir(ogrenciId, baslangic, bitis));
  }

  async function handleSil(id: string) {
    setGorevler((gs) => gs.filter((x) => x.id !== id));
    await gorevSil(id);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Haftalık Program</h1>

      {ogrenciler.length === 0 ? (
        <div className="card stagger-item">
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Henüz öğrencin yok. "Öğrenciler" sekmesinden davet kodu oluşturup öğrenci ekleyebilirsin.
          </p>
        </div>
      ) : (
        <>
          <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
            <h2 className="card-title">Öğrenci &amp; Hafta</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select className="input" style={{ flex: 1, minWidth: 180 }} value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)}>
                {ogrenciler.map((o) => (
                  <option key={o.id} value={o.id}>{o.ad_soyad}</option>
                ))}
              </select>
              <input
                className="input"
                type="date"
                value={haftaTarih}
                onChange={(e) => setHaftaTarih(e.target.value || bugunIso())}
                style={{ flex: 1, minWidth: 150 }}
              />
            </div>
            <p className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              Hafta: {gunler[0].tarih} – {bitis}
            </p>
          </div>

          {gunler.map((gun, i) => {
            const liste = gunGorevleri.get(gun.tarih) ?? [];
            return (
              <div key={gun.tarih} className="card stagger-item" style={{ marginTop: 12, animationDelay: `${0.1 + i * 0.04}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <h2 className="card-title" style={{ marginBottom: 0 }}>
                    {gun.etiket} <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>· {tarihEtiketi(gun.tarih)}</span>
                  </h2>
                  <span className="mono" style={{ fontSize: 11.5, color: liste.some((g) => g.tamamlandi && !g.kontrol_edildi) ? "var(--gold-dim)" : "var(--muted)" }}>
                    {liste.filter((g) => g.tamamlandi).length}/{liste.length}
                  </span>
                </div>

                {liste.map((g) => (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #f2f2f2" }}>
                    <input type="checkbox" checked={g.tamamlandi} readOnly style={{ accentColor: "var(--gold-dim)", width: 15, height: 15 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13.5, color: "var(--ink)", textDecoration: g.tamamlandi ? "line-through" : "none", opacity: g.tamamlandi ? 0.5 : 1 }}>{g.baslik}</p>
                      {g.tamamlandi && (
                        <p style={{ fontSize: 11.5, color: g.kontrol_edildi ? "var(--dogru)" : "var(--gold-dim)" }}>
                          {g.kontrol_edildi ? "✓ koç onayladı" : "koç onayı bekleniyor"}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleSil(g.id)} style={{ border: "none", background: "none", color: "var(--yanlis)", fontSize: 12 }}>Sil</button>
                  </div>
                ))}
                {liste.length === 0 && <p style={{ color: "var(--muted)", fontSize: 12.5 }}>Görev yok.</p>}

                <textarea
                  className="input"
                  rows={2}
                  placeholder={"Görev ekle — her satıra bir görev"}
                  value={yeniGorevler[i] ?? ""}
                  onChange={(e) => setYeniGorevler((y) => ({ ...y, [i]: e.target.value }))}
                  style={{ width: "100%", marginTop: 8, resize: "vertical" }}
                />
                <button
                  onClick={() => gunGorevleriniEkle(i)}
                  disabled={!(yeniGorevler[i] ?? "").trim()}
                  className="btn btn-primary"
                  style={{ marginTop: 6 }}
                >
                  Ekle
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
