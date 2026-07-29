import { useEffect, useState } from "react";
import type { Ders, Konu } from "../../types/database";
import {
  dersleriGetir,
  konulariGetir,
  sablonOlustur,
  sablonSorulariniKaydet,
} from "../../lib/queries";

interface SoruSatiri {
  soru_no: number;
  konu_id: string;
  konu_ad: string;
}

export default function SablonOlustur() {
  const [dersler, setDersler] = useState<Ders[]>([]);
  const [dersId, setDersId] = useState("");
  const [konular, setKonular] = useState<Konu[]>([]);
  const [sablonAdi, setSablonAdi] = useState("");
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [aralikKonuId, setAralikKonuId] = useState("");
  const [satirlar, setSatirlar] = useState<SoruSatiri[]>([]);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [basariMesaji, setBasariMesaji] = useState("");

  useEffect(() => {
    dersleriGetir().then((d) => {
      setDersler(d);
      if (d.length > 0) setDersId(d[0].id);
    });
  }, []);

  useEffect(() => {
    if (!dersId) return;
    konulariGetir(dersId).then((k) => {
      setKonular(k);
      setAralikKonuId(k[0]?.id ?? "");
    });
    setSatirlar([]);
  }, [dersId]);

  function aralikEkle() {
    const bas = parseInt(baslangic, 10);
    const son = parseInt(bitis, 10);
    if (!bas || !son || son < bas || !aralikKonuId) return;
    const konu = konular.find((k) => k.id === aralikKonuId);
    if (!konu) return;

    const yeniSatirlar: SoruSatiri[] = [];
    for (let no = bas; no <= son; no++) yeniSatirlar.push({ soru_no: no, konu_id: konu.id, konu_ad: konu.ad });

    setSatirlar((mevcut) => {
      const filtreli = mevcut.filter((s) => !yeniSatirlar.some((y) => y.soru_no === s.soru_no));
      return [...filtreli, ...yeniSatirlar].sort((a, b) => a.soru_no - b.soru_no);
    });
    setBaslangic("");
    setBitis("");
  }

  function satirSil(soruNo: number) {
    setSatirlar((s) => s.filter((x) => x.soru_no !== soruNo));
  }

  async function handleKaydet() {
    if (!sablonAdi.trim() || satirlar.length === 0) return;
    setKaydediliyor(true);
    try {
      const yeniSablon = await sablonOlustur(sablonAdi.trim(), dersId);
      await sablonSorulariniKaydet(yeniSablon.id, satirlar.map((s) => ({ soru_no: s.soru_no, konu_id: s.konu_id })));
      setBasariMesaji(`"${sablonAdi}" şablonu ${satirlar.length} soru ile kaydedildi.`);
      setSablonAdi("");
      setSatirlar([]);
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 6 }}>Deneme Şablonu Oluştur</h1>
      <p className="stagger-item" style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20, animationDelay: "0.03s" }}>
        Soru no aralıklarını konulara eşleştir. Bu şablonu daha sonra aynı yayının denemelerinde tekrar kullanabilirsin.
      </p>

      <div className="card stagger-item" style={{ animationDelay: "0.06s" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={sablonAdi} onChange={(e) => setSablonAdi(e.target.value)} placeholder="Şablon adı, örn. Hız Yayınları TYT Matematik" className="input" style={{ flex: 1 }} />
          <select value={dersId} onChange={(e) => setDersId(e.target.value)} className="input">
            {dersler.map((d) => <option key={d.id} value={d.id}>{d.ad}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
          <input value={baslangic} onChange={(e) => setBaslangic(e.target.value)} placeholder="Başlangıç no" className="input" style={{ width: 110 }} />
          <span style={{ color: "var(--muted)" }}>–</span>
          <input value={bitis} onChange={(e) => setBitis(e.target.value)} placeholder="Bitiş no" className="input" style={{ width: 110 }} />
          <select value={aralikKonuId} onChange={(e) => setAralikKonuId(e.target.value)} className="input" style={{ flex: 1 }}>
            {konular.map((k) => <option key={k.id} value={k.id}>{k.ad}</option>)}
          </select>
          <button onClick={aralikEkle} className="btn btn-primary">Aralık Ekle</button>
        </div>

        {konular.length === 0 && (
          <p style={{ color: "var(--yanlis)", fontSize: 13, marginTop: 10 }}>
            Bu derste henüz konu yok — önce Ders/Konu Yönetimi ekranından konu ekle.
          </p>
        )}
      </div>

      {satirlar.length > 0 && (
        <div className="card stagger-item" style={{ marginTop: 16, padding: 0, overflow: "hidden", animationDelay: "0.1s" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead style={{ background: "var(--paper-dim)" }}>
              <tr>
                <th style={{ textAlign: "left", padding: 10 }}>Soru No</th>
                <th style={{ textAlign: "left", padding: 10 }}>Konu</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {satirlar.map((s) => (
                <tr key={s.soru_no} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td className="mono" style={{ padding: 10 }}>{s.soru_no}</td>
                  <td style={{ padding: 10 }}>{s.konu_ad}</td>
                  <td style={{ padding: 10, textAlign: "right" }}>
                    <button onClick={() => satirSil(s.soru_no)} style={{ color: "var(--yanlis)", border: "none", background: "none" }}>sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={handleKaydet}
        disabled={kaydediliyor || !sablonAdi.trim() || satirlar.length === 0}
        className="btn btn-primary"
        style={{ marginTop: 16 }}
      >
        {kaydediliyor ? "Kaydediliyor…" : `Şablonu Kaydet (${satirlar.length} soru)`}
      </button>

      {basariMesaji && <p style={{ marginTop: 12, color: "var(--dogru)", fontSize: 13.5 }}>{basariMesaji}</p>}
    </div>
  );
}
