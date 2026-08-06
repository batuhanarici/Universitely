import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { odemeleriGetir, odemeEkle, odemeOdendiGuncelle, odemeSil } from "../../lib/kocAraclariQueries";
import type { Odeme } from "../../types/database";
import { Card, KPICard, Badge, Btn, Input, Select } from "../../components/ui";
import { Icon } from "../../components/Icon";

type Filtre = "hepsi" | "odendi" | "bekleniyor" | "gecikti";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function durum(od: Odeme): { id: "odendi" | "bekleniyor" | "gecikti"; metin: string; renk: string; badge: "teal" | "gold" | "brick" } {
  if (od.odendi) return { id: "odendi", metin: "ödendi", renk: "#1E7A6E", badge: "teal" };
  if (od.tarih < bugunIso()) return { id: "gecikti", metin: "gecikti", renk: "#C4503A", badge: "brick" };
  return { id: "bekleniyor", metin: "bekleniyor", renk: "#A07C20", badge: "gold" };
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

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Muhasebe</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Ödeme takibi</p>
      </div>

      <div className="grid-4">
        <KPICard label="Toplam Tahsilat" value={Math.round(ozet.toplam)} sub="₺" />
        <KPICard label="Ödenen" value={Math.round(ozet.odenen)} color="#1E7A6E" sub="₺" />
        <KPICard label="Bekleniyor" value={Math.round(ozet.bekleyen)} color="#A07C20" sub="₺" />
        <KPICard label="Gecikmiş" value={Math.round(ozet.gecikti)} color="#C4503A" sub="₺" />
      </div>

      <Card className="tape-accent">
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Yeni Ödeme</h3>
        <Select value={oOgrenciId} onChange={(e) => setOOgrenciId(e.target.value)}>
          {ogrenciler.map((o) => (
            <option key={o.id} value={o.id}>{o.ad_soyad}</option>
          ))}
        </Select>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Input style={{ width: 130 }} type="number" min="0" step="0.01" placeholder="Tutar (₺)" value={oTutar} onChange={(e) => setOTutar(e.target.value)} />
          <Input style={{ width: 150 }} type="date" value={oTarih} onChange={(e) => setOTarih(e.target.value)} />
          <Input style={{ flex: 1 }} value={oAciklama} onChange={(e) => setOAciklama(e.target.value)} placeholder="Açıklama (ör. Eylül dönemi)" onKeyDown={(e) => e.key === "Enter" && handleEkle()} />
        </div>
        <Btn onClick={handleEkle} disabled={oKaydediliyor || !oTutar || Number(oTutar) <= 0} style={{ marginTop: 8, width: "100%" }}>
          {oKaydediliyor ? "Kaydediliyor…" : "Ödemeyi Kaydet"}
        </Btn>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
          <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Ödemeler</h3>
          <Select style={{ width: 180 }} value={ogrenciFiltre} onChange={(e) => setOgrenciFiltre(e.target.value)}>
            <option value="">Tüm öğrenciler</option>
            {ogrenciler.map((o) => (
              <option key={o.id} value={o.id}>{o.ad_soyad}</option>
            ))}
          </Select>
        </div>
        <div className="tabs" style={{ marginBottom: 12 }}>
          {FILTRELER.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltre(f.id)}
              className={`tab-btn${filtre === f.id ? " active" : ""}`}
            >
              {f.metin}
            </button>
          ))}
        </div>

        {goruntulenen.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Bu filtrede ödeme kaydı yok.</p>}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {goruntulenen.map((od) => {
            const d = durum(od);
            return (
              <div key={od.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                <input type="checkbox" checked={od.odendi} onChange={() => odemeOdendiDegistir(od)} className="checkbox" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: od.odendi ? "rgba(15,27,45,0.45)" : "#0F1B2D", textDecoration: od.odendi ? "line-through" : "none" }}>
                    {ogrenciAdi.get(od.ogrenci_id) ?? "Öğrenci"} · {Number(od.tutar).toLocaleString("tr-TR")} ₺
                  </p>
                  <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)", marginTop: 1 }}>
                    {od.tarih} {od.aciklama ? `· ${od.aciklama}` : ""}
                  </p>
                </div>
                <Badge variant={d.badge}>{d.metin}</Badge>
                <button className="btn btn-ghost btn-sm" onClick={() => odemeSil(od.id)}><Icon name="trash" size={12} /></button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
