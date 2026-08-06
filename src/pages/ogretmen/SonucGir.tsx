import { useEffect, useState } from "react";
import type { Ogrenci, SoruDurumu } from "../../types/database";
import { denemeleriGetir } from "../../lib/denemeQueries";
import {
  ogrencileriGetir,
  sablonSorulariniGetir,
  denemeSonucuVarMi,
  sonucGirisiKaydet,
  type SablonSorusuDetayli,
} from "../../lib/sonucQueries";
import type { Deneme } from "../../types/database";
import { Card, Select, Btn, Badge } from "../../components/ui";

type DenemeDetayli = Deneme & { sablon_adi: string };

const DURUMLAR: { deger: SoruDurumu; etiket: string; renk: string }[] = [
  { deger: "dogru", etiket: "D", renk: "#2A9D8F" },
  { deger: "yanlis", etiket: "Y", renk: "#C4503A" },
  { deger: "bos", etiket: "B", renk: "#8C8780" },
];

export default function SonucGir() {
  const [denemeler, setDenemeler] = useState<DenemeDetayli[]>([]);
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [denemeId, setDenemeId] = useState("");
  const [ogrenciId, setOgrenciId] = useState("");
  const [sorular, setSorular] = useState<SablonSorusuDetayli[]>([]);
  const [cevaplar, setCevaplar] = useState<Record<number, SoruDurumu>>({});
  const [zatenGirilmis, setZatenGirilmis] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    Promise.all([denemeleriGetir(), ogrencileriGetir()])
      .then(([d, o]) => {
        setDenemeler(d);
        setOgrenciler(o);
        if (d.length > 0) setDenemeId(d[0].id);
        if (o.length > 0) setOgrenciId(o[0].id);
      })
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    const secilenDeneme = denemeler.find((d) => d.id === denemeId);
    if (!secilenDeneme?.sablon_id) { setSorular([]); return; }
    sablonSorulariniGetir(secilenDeneme.sablon_id).then((s) => {
      setSorular(s);
      setCevaplar({});
    });
  }, [denemeId, denemeler]);

  useEffect(() => {
    if (!denemeId || !ogrenciId) return;
    denemeSonucuVarMi(denemeId, ogrenciId).then(setZatenGirilmis);
  }, [denemeId, ogrenciId]);

  function cevapSec(soruNo: number, durum: SoruDurumu) {
    setCevaplar((c) => ({ ...c, [soruNo]: durum }));
  }

  const tumuCevaplandi = sorular.length > 0 && sorular.every((s) => cevaplar[s.soru_no]);

  async function handleKaydet() {
    setKaydediliyor(true);
    setMesaj("");
    try {
      const kayit = sorular.map((s) => ({ soru_no: s.soru_no, durum: cevaplar[s.soru_no] }));
      await sonucGirisiKaydet(denemeId, ogrenciId, kayit);
      setMesaj("Sonuçlar kaydedildi.");
      setZatenGirilmis(true);
      setCevaplar({});
    } finally {
      setKaydediliyor(false);
    }
  }

  if (yukleniyor) return <p>Yükleniyor…</p>;

  if (denemeler.length === 0) {
    return <p style={{ textAlign: "center", marginTop: 60, color: "#C4503A" }}>Önce bir deneme oluşturman lazım.</p>;
  }
  if (ogrenciler.length === 0) {
    return <p style={{ textAlign: "center", marginTop: 60, color: "#C4503A" }}>Henüz kayıtlı öğrenci yok — öğrenciler kendi hesaplarını oluşturunca burada görünecekler.</p>;
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Sonuç Gir</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrencinin deneme cevaplarını işaretleyin</p>
      </div>

      <Card className="tape-accent">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Select value={denemeId} onChange={(e) => setDenemeId(e.target.value)} style={{ flex: 1, minWidth: 220 }}>
            {denemeler.map((d) => <option key={d.id} value={d.id}>{d.ad}</option>)}
          </Select>
          <Select value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)} style={{ flex: 1, minWidth: 220 }}>
            {ogrenciler.map((o) => <option key={o.id} value={o.id}>{o.ad_soyad}</option>)}
          </Select>
        </div>

        {zatenGirilmis && (
          <Badge variant="gold" >Bu öğrenci için bu denemenin sonuçları zaten girilmiş.</Badge>
        )}

        {!zatenGirilmis && sorular.length > 0 && (
          <>
            <div style={{ marginTop: 16, border: "1px solid rgba(15,27,45,0.08)", borderRadius: 10, overflow: "hidden" }}>
              {sorular.map((s, i) => (
                <div key={s.soru_no} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderTop: i === 0 ? "none" : "1px solid rgba(15,27,45,0.06)" }}>
                  <span className="tabular" style={{ width: 36, fontSize: 12.5, color: "rgba(15,27,45,0.5)" }}>#{s.soru_no}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{s.konu_ad}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {DURUMLAR.map((d) => (
                      <button
                        key={d.deger}
                        onClick={() => cevapSec(s.soru_no, d.deger)}
                        style={{
                          width: 30, height: 30, borderRadius: 7, border: "1px solid #ddd",
                          background: cevaplar[s.soru_no] === d.deger ? d.renk : "white",
                          color: cevaplar[s.soru_no] === d.deger ? "white" : "#555",
                          fontWeight: 700, fontSize: 12, transition: "all 0.15s ease", cursor: "pointer",
                        }}
                      >
                        {d.etiket}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Btn onClick={handleKaydet} disabled={!tumuCevaplandi || kaydediliyor} style={{ marginTop: 16 }}>
              {kaydediliyor ? "Kaydediliyor…" : tumuCevaplandi ? "Sonuçları Kaydet" : `${Object.keys(cevaplar).length}/${sorular.length} soru işaretlendi`}
            </Btn>
          </>
        )}

        {mesaj && <Badge variant="teal" >{mesaj}</Badge>}
      </Card>
    </div>
  );
}
