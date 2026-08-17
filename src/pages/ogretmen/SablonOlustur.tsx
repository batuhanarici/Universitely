import { useToast } from "../../components/useToast";
import { useEffect, useState } from "react";
import type { Ders, Konu } from "../../types/database";
import {
  dersleriGetir,
  konulariGetir,
  sablonOlustur,
  sablonSorulariniKaydet,
} from "../../lib/queries";
import { sablonlariGetirDetayli } from "../../lib/denemeQueries";
import { Card, Input, Select, Btn, Badge, Label, FormGroup } from "../../components/ui";
import { Icon } from "../../components/Icon";

interface Aralik {
  id: string;
  baslangic: number;
  bitis: number;
  konu_id: string;
  konu_ad: string;
}

type MevcutSablon = { id: string; ad: string; ders_adi: string };

export default function SablonOlustur() {
  const { toast, show } = useToast();
  const [dersler, setDersler] = useState<Ders[]>([]);
  const [dersId, setDersId] = useState("");
  const [konular, setKonular] = useState<Konu[]>([]);
  const [sablonAdi, setSablonAdi] = useState("");
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [aralikKonuId, setAralikKonuId] = useState("");
  const [araliklar, setAraliklar] = useState<Aralik[]>([]);
  const [mevcutSablonlar, setMevcutSablonlar] = useState<MevcutSablon[]>([]);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    dersleriGetir().then((d) => {
      setDersler(d);
      if (d.length > 0) setDersId(d[0].id);
    });
    sablonlariGetirDetayli().then(setMevcutSablonlar).catch(() => {});
  }, []);

  useEffect(() => {
    if (!dersId) return;
    konulariGetir(dersId).then((k) => {
      setKonular(k);
      setAralikKonuId(k[0]?.id ?? "");
    });
    setAraliklar([]);
  }, [dersId]);

  function aralikEkle(e: React.FormEvent) {
    e.preventDefault();
    const bas = parseInt(baslangic, 10);
    const son = parseInt(bitis, 10);
    if (!bas || !son || son < bas || !aralikKonuId) return;
    const konu = konular.find((k) => k.id === aralikKonuId);
    if (!konu) return;

    setAraliklar((mevcut) => {
      const filtreli = mevcut.filter((a) => !(bas <= a.bitis && son >= a.baslangic));
      return [
        ...filtreli,
        { id: `${bas}-${son}-${Date.now()}`, baslangic: bas, bitis: son, konu_id: konu.id, konu_ad: konu.ad },
      ].sort((a, b) => a.baslangic - b.baslangic);
    });
    setBaslangic("");
    setBitis("");
  }

  const totalQ = araliklar.reduce((a, r) => a + (r.bitis - r.baslangic + 1), 0);

  async function handleKaydet() {
    if (!sablonAdi.trim() || araliklar.length === 0) return;
    setKaydediliyor(true);
    try {
      const yeniSablon = await sablonOlustur(sablonAdi.trim(), dersId);
      const sorular = araliklar.flatMap((a) => {
        const rows: { soru_no: number; konu_id: string }[] = [];
        for (let no = a.baslangic; no <= a.bitis; no++) rows.push({ soru_no: no, konu_id: a.konu_id });
        return rows;
      });
      await sablonSorulariniKaydet(yeniSablon.id, sorular);
      show(`Şablon kaydedildi: ${totalQ} soru ✓`);
      setSablonAdi("");
      setAraliklar([]);
      setMevcutSablonlar(await sablonlariGetirDetayli());
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Deneme Şablonu Oluştur</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>
          Soru no aralıklarını konulara eşleştir, şablonu kaydet
        </p>
      </div>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 16 }}>
          <FormGroup>
            <Label>Şablon Adı *</Label>
            <Input placeholder="TYT Standart Şablon" value={sablonAdi} onChange={(e) => setSablonAdi(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Ders</Label>
            <Select value={dersId} onChange={(e) => setDersId(e.target.value)}>
              {dersler.map((d) => (
                <option key={d.id} value={d.id}>{d.ad}</option>
              ))}
            </Select>
          </FormGroup>
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "rgba(15,27,45,0.6)" }}>Soru Aralığı Ekle</h3>
        <form onSubmit={aralikEkle} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 3fr auto", gap: 10, alignItems: "flex-end" }}>
          <FormGroup>
            <Label>Başlangıç No *</Label>
            <Input type="number" min={1} placeholder="1" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Bitiş No *</Label>
            <Input type="number" min={1} placeholder="40" value={bitis} onChange={(e) => setBitis(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Konu *</Label>
            <Select value={aralikKonuId} onChange={(e) => setAralikKonuId(e.target.value)} required>
              {konular.map((k) => (
                <option key={k.id} value={k.id}>{k.ad}</option>
              ))}
            </Select>
          </FormGroup>
          <Btn variant="primary" type="submit" size="sm">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="plus" size={14} /> Ekle</span>
          </Btn>
        </form>
        {konular.length === 0 && (
          <p style={{ color: "#C4503A", fontSize: 13, marginTop: 10 }}>
            Bu derste henüz konu yok — önce Ders/Konu Yönetimi ekranından konu ekle.
          </p>
        )}
      </Card>

      {araliklar.length > 0 && (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Soru Tablosu ({totalQ} soru)</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Başlangıç</th>
                <th>Bitiş</th>
                <th>Soru Sayısı</th>
                <th>Konu</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {araliklar.map((r) => (
                <tr key={r.id}>
                  <td className="tabular">{r.baslangic}</td>
                  <td className="tabular">{r.bitis}</td>
                  <td className="tabular" style={{ fontWeight: 600 }}>{r.bitis - r.baslangic + 1}</td>
                  <td style={{ fontWeight: 500 }}>{r.konu_ad}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => setAraliklar((l) => l.filter((x) => x.id !== r.id))} title="Aralığı sil">
                      <Icon name="trash" size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="primary" onClick={handleKaydet} disabled={kaydediliyor || !sablonAdi.trim()}>
              {kaydediliyor ? "Kaydediliyor…" : `Şablonu Kaydet (${totalQ} soru)`}
            </Btn>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Mevcut Şablonlar</h3>
        {mevcutSablonlar.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Henüz şablon yok.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mevcutSablonlar.map((t) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                <span style={{ fontWeight: 500 }}>{t.ad}</span>
                <Badge variant="gray">{t.ders_adi}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
