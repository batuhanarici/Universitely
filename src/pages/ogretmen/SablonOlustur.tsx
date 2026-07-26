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
    for (let no = bas; no <= son; no++) {
      yeniSatirlar.push({ soru_no: no, konu_id: konu.id, konu_ad: konu.ad });
    }

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
      await sablonSorulariniKaydet(
        yeniSablon.id,
        satirlar.map((s) => ({ soru_no: s.soru_no, konu_id: s.konu_id }))
      );
      setBasariMesaji(`"${sablonAdi}" şablonu ${satirlar.length} soru ile kaydedildi.`);
      setSablonAdi("");
      setSatirlar([]);
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20 }}>Deneme Şablonu Oluştur</h1>
      <p style={{ color: "#777", fontSize: 13 }}>
        Soru no aralıklarını konulara eşleştir. Bu şablonu daha sonra aynı yayının denemelerinde tekrar kullanabilirsin.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <input
          value={sablonAdi}
          onChange={(e) => setSablonAdi(e.target.value)}
          placeholder="Şablon adı, örn. Hız Yayınları TYT Matematik"
          style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <select
          value={dersId}
          onChange={(e) => setDersId(e.target.value)}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
        >
          {dersler.map((d) => (
            <option key={d.id} value={d.id}>{d.ad}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
        <input
          value={baslangic}
          onChange={(e) => setBaslangic(e.target.value)}
          placeholder="Başlangıç no"
          style={{ width: 100, padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <span>–</span>
        <input
          value={bitis}
          onChange={(e) => setBitis(e.target.value)}
          placeholder="Bitiş no"
          style={{ width: 100, padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <select
          value={aralikKonuId}
          onChange={(e) => setAralikKonuId(e.target.value)}
          style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
        >
          {konular.map((k) => (
            <option key={k.id} value={k.id}>{k.ad}</option>
          ))}
        </select>
        <button onClick={aralikEkle} style={{ padding: "8px 14px", borderRadius: 6 }}>
          Aralık Ekle
        </button>
      </div>

      {konular.length === 0 && (
        <p style={{ color: "#b5482a", fontSize: 13, marginTop: 8 }}>
          Bu derste henüz konu yok — önce Ders/Konu Yönetimi ekranından konu ekle.
        </p>
      )}

      {satirlar.length > 0 && (
        <div style={{ marginTop: 20, border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "#f7f5f0" }}>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>Soru No</th>
                <th style={{ textAlign: "left", padding: 8 }}>Konu</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {satirlar.map((s) => (
                <tr key={s.soru_no} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{s.soru_no}</td>
                  <td style={{ padding: 8 }}>{s.konu_ad}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    <button onClick={() => satirSil(s.soru_no)} style={{ color: "#b5482a", border: "none", background: "none", cursor: "pointer" }}>
                      sil
                    </button>
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
        style={{ marginTop: 20, padding: "10px 18px", borderRadius: 6, background: "#1B2A4A", color: "white", border: "none" }}
      >
        {kaydediliyor ? "Kaydediliyor…" : `Şablonu Kaydet (${satirlar.length} soru)`}
      </button>

      {basariMesaji && (
        <p style={{ marginTop: 12, color: "#2e7d6b" }}>{basariMesaji}</p>
      )}
    </div>
  );
}
