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
import { Card, Select, Btn, Badge, Label, FormGroup, useToast } from "../../components/ui";

type DenemeDetayli = Deneme & { sablon_adi: string };

const DURUMLAR: { deger: SoruDurumu; etiket: string; renk: string }[] = [
  { deger: "dogru", etiket: "D", renk: "#2A9D8F" },
  { deger: "yanlis", etiket: "Y", renk: "#C4503A" },
  { deger: "bos", etiket: "B", renk: "#9A9FA8" },
];

const btnStyle = (val: SoruDurumu, cur: SoruDurumu | undefined, color: string) => ({
  padding: "4px 10px",
  borderRadius: 6,
  border: `1.5px solid ${cur === val ? color : "rgba(15,27,45,0.15)"}`,
  background: cur === val ? `${color}20` : "transparent",
  fontFamily: "var(--font-body)",
  fontSize: 12,
  fontWeight: 700,
  color: cur === val ? color : "rgba(15,27,45,0.5)",
  cursor: "pointer",
});

export default function SonucGir() {
  const { toast, show } = useToast();
  const [denemeler, setDenemeler] = useState<DenemeDetayli[]>([]);
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [denemeId, setDenemeId] = useState("");
  const [ogrenciId, setOgrenciId] = useState("");
  const [sorular, setSorular] = useState<SablonSorusuDetayli[]>([]);
  const [cevaplar, setCevaplar] = useState<Record<number, SoruDurumu>>({});
  const [zatenGirilmis, setZatenGirilmis] = useState(false);
  const [kaydedildi, setKaydedildi] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

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
    if (!secilenDeneme?.sablon_id) {
      setSorular([]);
      return;
    }
    sablonSorulariniGetir(secilenDeneme.sablon_id).then((s) => {
      setSorular(s);
      setCevaplar({});
    });
    setKaydedildi(false);
  }, [denemeId, denemeler]);

  useEffect(() => {
    if (!denemeId || !ogrenciId) return;
    denemeSonucuVarMi(denemeId, ogrenciId).then(setZatenGirilmis);
    setKaydedildi(false);
  }, [denemeId, ogrenciId]);

  function cevapSec(soruNo: number, durum: SoruDurumu) {
    setCevaplar((c) => ({ ...c, [soruNo]: durum }));
  }

  const marked = Object.keys(cevaplar).length;
  const allMarked = sorular.length > 0 && marked === sorular.length;

  async function handleKaydet() {
    if (!allMarked) return;
    setKaydediliyor(true);
    try {
      const kayit = sorular.map((s) => ({ soru_no: s.soru_no, durum: cevaplar[s.soru_no] }));
      await sonucGirisiKaydet(denemeId, ogrenciId, kayit);
      setKaydedildi(true);
      setZatenGirilmis(true);
      setCevaplar({});
      show("Sonuçlar kaydedildi ✓");
    } finally {
      setKaydediliyor(false);
    }
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  if (denemeler.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 className="page-title">Sonuç Gir</h1>
        <Card><p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)" }}>Önce bir deneme oluşturman lazım.</p></Card>
      </div>
    );
  }
  if (ogrenciler.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 className="page-title">Sonuç Gir</h1>
        <Card><p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)" }}>Henüz kayıtlı öğrenci yok — öğrenciler kendi hesaplarını oluşturunca burada görünecekler.</p></Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Sonuç Gir</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrencinin deneme cevaplarını işaretleyin</p>
      </div>

      {kaydedildi ? (
        <Card>
          <p style={{ color: "#2A9D8F", fontWeight: 600, fontSize: 14 }}>✓ Bu öğrencinin bu deneme için sonuçları girildi.</p>
        </Card>
      ) : (
        <>
          <Card style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <FormGroup style={{ minWidth: 200 }}>
                <Label>Deneme</Label>
                <Select value={denemeId} onChange={(e) => { setDenemeId(e.target.value); setCevaplar({}); }}>
                  {denemeler.map((d) => (
                    <option key={d.id} value={d.id}>{d.ad}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup style={{ minWidth: 200 }}>
                <Label>Öğrenci</Label>
                <Select value={ogrenciId} onChange={(e) => { setOgrenciId(e.target.value); setCevaplar({}); }}>
                  {ogrenciler.map((o) => (
                    <option key={o.id} value={o.id}>{o.ad_soyad}</option>
                  ))}
                </Select>
              </FormGroup>
            </div>
          </Card>

          {zatenGirilmis && (
            <Card>
              <Badge variant="gold">Bu öğrenci için bu denemenin sonuçları zaten girilmiş.</Badge>
            </Card>
          )}

          {!zatenGirilmis && sorular.length > 0 && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Soru Listesi</h3>
                <Badge variant={allMarked ? "teal" : "gray"}>{marked}/{sorular.length} soru işaretlendi</Badge>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                {sorular.map((q) => (
                  <div key={q.soru_no} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(15,27,45,0.02)", border: "1px solid rgba(15,27,45,0.07)" }}>
                    <span className="tabular" style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,27,45,0.35)", minWidth: 28 }}>{q.soru_no}</span>
                    <span style={{ flex: 1, fontSize: 12, color: "rgba(15,27,45,0.6)" }}>{q.konu_ad}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {DURUMLAR.map((d) => (
                        <button
                          key={d.deger}
                          style={btnStyle(d.deger, cevaplar[q.soru_no], d.renk)}
                          onClick={() => cevapSec(q.soru_no, d.deger)}
                        >
                          {d.etiket}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <Btn variant="primary" onClick={handleKaydet} disabled={!allMarked || kaydediliyor}>
                  {kaydediliyor ? "Kaydediliyor…" : `Kaydet (${marked}/${sorular.length} işaretlendi)`}
                </Btn>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
