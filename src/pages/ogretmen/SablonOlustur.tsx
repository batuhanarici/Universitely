import { useEffect, useState } from "react";
import type { Ders, Konu } from "../../types/database";
import {
  dersleriGetir,
  konulariGetir,
  sablonOlustur,
  sablonSorulariniKaydet,
} from "../../lib/queries";
import { Card, Input, Select, Btn, Badge } from "../../components/ui";

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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title" style={{ marginBottom: 6 }}>Deneme Şablonu Oluştur</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>
          Soru no aralıklarını konulara eşleştir. Bu şablonu daha sonra aynı yayının denemelerinde tekrar kullanabilirsin.
        </p>
      </div>

      <Card className="tape-accent">
        <div style={{ display: "flex", gap: 8 }}>
          <Input value={sablonAdi} onChange={(e) => setSablonAdi(e.target.value)} placeholder="Şablon adı, örn. Hız Yayınları TYT Matematik" style={{ flex: 1 }} />
          <Select value={dersId} onChange={(e) => setDersId(e.target.value)} style={{ minWidth: 150 }}>
            {dersler.map((d) => <option key={d.id} value={d.id}>{d.ad}</option>)}
          </Select>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
          <Input value={baslangic} onChange={(e) => setBaslangic(e.target.value)} placeholder="Başlangıç no" style={{ width: 120 }} />
          <span style={{ color: "rgba(15,27,45,0.5)" }}>–</span>
          <Input value={bitis} onChange={(e) => setBitis(e.target.value)} placeholder="Bitiş no" style={{ width: 120 }} />
          <Select value={aralikKonuId} onChange={(e) => setAralikKonuId(e.target.value)} style={{ flex: 1, minWidth: 150 }}>
            {konular.map((k) => <option key={k.id} value={k.id}>{k.ad}</option>)}
          </Select>
          <Btn onClick={aralikEkle}>Aralık Ekle</Btn>
        </div>

        {konular.length === 0 && (
          <p style={{ color: "#C4503A", fontSize: 13, marginTop: 10 }}>
            Bu derste henüz konu yok — önce Ders/Konu Yönetimi ekranından konu ekle.
          </p>
        )}
      </Card>

      {satirlar.length > 0 && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table" style={{ fontSize: 13.5 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 10 }}>Soru No</th>
                <th style={{ textAlign: "left", padding: 10 }}>Konu</th>
                <th style={{ padding: 10 }}></th>
              </tr>
            </thead>
            <tbody>
              {satirlar.map((s) => (
                <tr key={s.soru_no}>
                  <td className="tabular" style={{ padding: 10 }}>{s.soru_no}</td>
                  <td style={{ padding: 10 }}>{s.konu_ad}</td>
                  <td style={{ padding: 10, textAlign: "right" }}>
                    <Btn variant="ghost" size="sm" onClick={() => satirSil(s.soru_no)}>sil</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div>
        <Btn onClick={handleKaydet} disabled={kaydediliyor || !sablonAdi.trim() || satirlar.length === 0}>
          {kaydediliyor ? "Kaydediliyor…" : `Şablonu Kaydet (${satirlar.length} soru)`}
        </Btn>
        {basariMesaji && <Badge variant="teal">{basariMesaji}</Badge>}
      </div>
    </div>
  );
}
