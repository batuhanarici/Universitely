import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { haftalikProgramGetir, haftalikProgramKaydet } from "../../lib/programQueries";
import { gorevSil } from "../../lib/gorevQueries";
import type { Gorev } from "../../types/database";
import { Card, Select, Input, Label, FormGroup, Checkbox, useToast } from "../../components/ui";

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

export default function ProgramYonetimi() {
  const { toast, show } = useToast();
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
    show("Görev eklendi ✓");
  }

  async function handleSil(id: string) {
    setGorevler((gs) => gs.filter((x) => x.id !== id));
    await gorevSil(id);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  if (ogrenciler.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {toast}
        <h1 className="page-title">Haftalık Program</h1>
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>
            Henüz öğrencin yok. "Öğrenciler" sekmesinden davet kodu oluşturup öğrenci ekleyebilirsin.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Haftalık Program</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>{ogrenciler.find((o) => o.id === ogrenciId)?.ad_soyad} · {baslangic} — {bitis}</p>
      </div>

      <Card style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <FormGroup style={{ minWidth: 180 }}>
            <Label>Öğrenci</Label>
            <Select value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)}>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Hafta Başı</Label>
            <Input type="date" value={haftaTarih} onChange={(e) => setHaftaTarih(e.target.value || bugunIso())} />
          </FormGroup>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, overflowX: "auto", minWidth: 900 }}>
        {gunler.map((gun, i) => {
          const liste = gunGorevleri.get(gun.tarih) ?? [];
          const doneCount = liste.filter((g) => g.tamamlandi).length;
          return (
            <div key={gun.tarih} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="card" style={{ padding: "10px", borderTop: "3px solid #E4BB60", minHeight: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0F1B2D" }}>{gun.etiket.slice(0, 3)}</span>
                  {liste.length > 0 && <span style={{ fontSize: 10, color: "rgba(15,27,45,0.4)" }}>{doneCount}/{liste.length}</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                  {liste.map((g) => (
                    <div key={g.id} style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
                      <Checkbox checked={g.tamamlandi} readOnly />
                      <span style={{ flex: 1, fontSize: 11, lineHeight: 1.4, textDecoration: g.tamamlandi ? "line-through" : "none", color: g.tamamlandi ? "rgba(15,27,45,0.35)" : "#0F1B2D" }}>{g.baslik}</span>
                      <button
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#C4503A", padding: 0, opacity: 0.5 }}
                        onClick={() => handleSil(g.id)}
                        title="Görevi sil"
                      >×</button>
                    </div>
                  ))}
                </div>
                <textarea
                  placeholder="Görev ekle…"
                  value={yeniGorevler[i] ?? ""}
                  onChange={(e) => setYeniGorevler((y) => ({ ...y, [i]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); gunGorevleriniEkle(i); } }}
                  style={{ width: "100%", resize: "none", height: 48, fontSize: 11, padding: "4px 6px", border: "1px solid rgba(15,27,45,0.12)", borderRadius: 6, fontFamily: "var(--font-body)", background: "transparent", outline: "none", color: "#0F1B2D" }}
                />
                <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 4, fontSize: 11 }} onClick={() => gunGorevleriniEkle(i)}>+ Ekle</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
