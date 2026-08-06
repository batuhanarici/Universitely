import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { odemeleriGetir, odemeEkle, odemeOdendiGuncelle, odemeSil } from "../../lib/kocAraclariQueries";
import type { Odeme } from "../../types/database";
import AnimatedNumber from "../../components/AnimatedNumber";

type Filtre = "hepsi" | "odendi" | "bekleniyor" | "gecikti";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function durum(od: Odeme): { id: "odendi" | "bekleniyor" | "gecikti"; metin: string; renk: string } {
  if (od.odendi) return { id: "odendi", metin: "ödendi", renk: "var(--dogru)" };
  if (od.tarih < bugunIso()) return { id: "gecikti", metin: "gecikti", renk: "var(--yanlis)" };
  return { id: "bekleniyor", metin: "bekleniyor", renk: "var(--gold-dim)" };
}

const FILTRELER: { id: Filtre; metin: string }[] = [
  { id: "hepsi", metin: "Hepsi" },
  { id: "odendi", metin: "Ödendi" },
  { id: "bekleniyor", metin: "Bekleniyor" },
  { id: "gecikti", metin: "Gecikti" },
];

export default function Muhasebe() {
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [odemeler, setOdemeler] = useState<Odeme[]>([]);
  const [filtre, setFiltre] = useState<Filtre>("hepsi");
  const [ogrenciFiltre, setOgrenciFiltre] = useState("");

  const [oOgrenciId, setOOgrenciId] = useState("");
  const [oTutar, setOTutar] = useState("");
  const [oTarih, setOTarih] = useState(bugunIso());
  const [oAciklama, setOAciklama] = useState("");
  const [oKaydediliyor, setOKaydediliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([kocOgrencileri(), odemeleriGetir()])
      .then(([o, od]) => {
        setOgrenciler(o);
        setOdemeler(od);
        if (o.length > 0) setOOgrenciId(o[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const ogrenciAdi = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of ogrenciler) map.set(o.id, o.ad_soyad);
    return map;
  }, [ogrenciler]);

  const ozet = useMemo(() => {
    const toplam = odemeler.reduce((a, o) => a + Number(o.tutar), 0);
    const odenen = odemeler.filter((o) => o.odendi).reduce((a, o) => a + Number(o.tutar), 0);
    const gecikti = odemeler.filter((o) => !o.odendi && o.tarih < bugunIso()).reduce((a, o) => a + Number(o.tutar), 0);
    const bekleyen = odemeler.filter((o) => !o.odendi && o.tarih >= bugunIso()).reduce((a, o) => a + Number(o.tutar), 0);
    return { toplam, odenen, gecikti, bekleyen };
  }, [odemeler]);

  const goruntulenen = useMemo(() => {
    return odemeler.filter((od) => {
      if (ogrenciFiltre && od.ogrenci_id !== ogrenciFiltre) return false;
      if (filtre === "hepsi") return true;
      return durum(od).id === filtre;
    });
  }, [odemeler, filtre, ogrenciFiltre]);

  async function handleEkle() {
    if (!oOgrenciId || !oTutar) return;
    const tutar = Number(oTutar);
    if (!Number.isFinite(tutar) || tutar <= 0) return;
    setOKaydediliyor(true);
    try {
      const yeni = await odemeEkle({
        ogrenci_id: oOgrenciId,
        tutar,
        tarih: oTarih,
        aciklama: oAciklama.trim() || null,
      });
      setOdemeler((od) => [yeni, ...od]);
      setOTutar("");
      setOAciklama("");
    } finally {
      setOKaydediliyor(false);
    }
  }

  async function odemeOdendiDegistir(od: Odeme) {
    setOdemeler((ods) => ods.map((x) => (x.id === od.id ? { ...x, odendi: !x.odendi } : x)));
    await odemeOdendiGuncelle(od.id, !od.odendi);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Muhasebe</h1>

      <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, animationDelay: "0.05s" }}>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}><AnimatedNumber value={Math.round(ozet.toplam)} /> ₺</p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>toplam tahsilat</p>
        </div>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--dogru)" }}><AnimatedNumber value={Math.round(ozet.odenen)} /> ₺</p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>ödenen</p>
        </div>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--gold-dim)" }}><AnimatedNumber value={Math.round(ozet.bekleyen)} /> ₺</p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>bekleniyor</p>
        </div>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--yanlis)" }}><AnimatedNumber value={Math.round(ozet.gecikti)} /> ₺</p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>gecikmiş</p>
        </div>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
        <h2 className="card-title">Yeni Ödeme</h2>
        <select className="input" style={{ width: "100%" }} value={oOgrenciId} onChange={(e) => setOOgrenciId(e.target.value)}>
          {ogrenciler.map((o) => (
            <option key={o.id} value={o.id}>{o.ad_soyad}</option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input className="input" style={{ width: 130 }} type="number" min="0" step="0.01" placeholder="Tutar (₺)" value={oTutar} onChange={(e) => setOTutar(e.target.value)} />
          <input className="input" style={{ width: 150 }} type="date" value={oTarih} onChange={(e) => setOTarih(e.target.value)} />
          <input className="input" style={{ flex: 1 }} value={oAciklama} onChange={(e) => setOAciklama(e.target.value)} placeholder="Açıklama (ör. Eylül dönemi)" onKeyDown={(e) => e.key === "Enter" && handleEkle()} />
        </div>
        <button onClick={handleEkle} disabled={oKaydediliyor || !oTutar || Number(oTutar) <= 0} className="btn btn-primary" style={{ marginTop: 8, width: "100%" }}>
          {oKaydediliyor ? "Kaydediliyor…" : "Ödemeyi Kaydet"}
        </button>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Ödemeler</h2>
          <select className="input" style={{ width: 180 }} value={ogrenciFiltre} onChange={(e) => setOgrenciFiltre(e.target.value)}>
            <option value="">Tüm öğrenciler</option>
            {ogrenciler.map((o) => (
              <option key={o.id} value={o.id}>{o.ad_soyad}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {FILTRELER.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltre(f.id)}
              className={`btn${filtre === f.id ? " btn-primary" : ""}`}
              style={{ padding: "5px 12px", fontSize: 12 }}
            >
              {f.metin}
            </button>
          ))}
        </div>

        {goruntulenen.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bu filtrede ödeme kaydı yok.</p>}
        {goruntulenen.map((od, i) => {
          const d = durum(od);
          return (
            <div key={od.id} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.03}s` }}>
              <input type="checkbox" checked={od.odendi} onChange={() => odemeOdendiDegistir(od)} style={{ accentColor: "var(--gold-dim)", width: 16, height: 16 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: od.odendi ? "var(--muted)" : "var(--ink)", textDecoration: od.odendi ? "line-through" : "none" }}>
                  {ogrenciAdi.get(od.ogrenci_id) ?? "Öğrenci"} · {Number(od.tutar).toLocaleString("tr-TR")} ₺
                </p>
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                  {od.tarih} {od.aciklama ? `· ${od.aciklama}` : ""}
                </p>
              </div>
              <span className="chip" style={{ fontSize: 10.5, background: d.renk, color: "#fff" }}>{d.metin}</span>
              <button onClick={() => odemeSil(od.id)} style={{ border: "none", background: "none", color: "var(--muted)", fontSize: 12 }}>Sil</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
