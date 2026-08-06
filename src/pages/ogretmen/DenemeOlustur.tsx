import { useEffect, useState } from "react";
import type { DenemeSablonu, Deneme, DenemeTuru } from "../../types/database";
import { sablonlariGetirDetayli, denemeOlustur, denemeleriGetir } from "../../lib/denemeQueries";
import { Card, Input, Select, Btn, Badge } from "../../components/ui";

type SablonDetayli = DenemeSablonu & { ders_adi: string };
type DenemeDetayli = Deneme & { sablon_adi: string };

const TURLER: { deger: DenemeTuru; etiket: string }[] = [
  { deger: "tyt", etiket: "TYT" },
  { deger: "ayt", etiket: "AYT" },
  { deger: "brans", etiket: "Branş" },
];

const TUR_VAZIAN: Record<string, "gold" | "teal" | "brick"> = { tyt: "gold", ayt: "teal", brans: "brick" };

export default function DenemeOlustur() {
  const [sablonlar, setSablonlar] = useState<SablonDetayli[]>([]);
  const [denemeler, setDenemeler] = useState<DenemeDetayli[]>([]);
  const [sablonId, setSablonId] = useState("");
  const [ad, setAd] = useState("");
  const [tarih, setTarih] = useState(() => new Date().toISOString().slice(0, 10));
  const [tur, setTur] = useState<DenemeTuru>("tyt");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  async function verileriYenile() {
    const [s, d] = await Promise.all([sablonlariGetirDetayli(), denemeleriGetir()]);
    setSablonlar(s);
    setDenemeler(d);
    if (s.length > 0 && !sablonId) setSablonId(s[0].id);
  }

  useEffect(() => {
    verileriYenile().finally(() => setYukleniyor(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleKaydet() {
    if (!ad.trim() || !sablonId || !tarih) return;
    setKaydediliyor(true);
    try {
      await denemeOlustur(ad.trim(), tarih, sablonId, tur);
      setAd("");
      await verileriYenile();
    } finally {
      setKaydediliyor(false);
    }
  }

  if (yukleniyor) return <p>Yükleniyor…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Deneme Oluştur</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Şablondan yeni deneme kaydı oluşturun</p>
      </div>

      {sablonlar.length === 0 ? (
        <Card>
          <p style={{ color: "#C4503A" }}>Önce en az bir deneme şablonu oluşturman lazım — "Deneme Şablonu Oluştur" ekranına git.</p>
        </Card>
      ) : (
        <Card className="tape-accent">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input value={ad} onChange={(e) => setAd(e.target.value)} placeholder='Deneme adı, örn. "Hız Yayınları TYT Deneme 4"' />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Select value={sablonId} onChange={(e) => setSablonId(e.target.value)} style={{ flex: 1, minWidth: 220 }}>
                {sablonlar.map((s) => <option key={s.id} value={s.id}>{s.ad} ({s.ders_adi})</option>)}
              </Select>
              <Select value={tur} onChange={(e) => setTur(e.target.value as DenemeTuru)} style={{ width: 110 }}>
                {TURLER.map((t) => <option key={t.deger} value={t.deger}>{t.etiket}</option>)}
              </Select>
              <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ minWidth: 140 }} />
            </div>
            <Btn onClick={handleKaydet} disabled={kaydediliyor || !ad.trim()} style={{ alignSelf: "flex-start" }}>
              {kaydediliyor ? "Kaydediliyor…" : "Denemeyi Oluştur"}
            </Btn>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Oluşturulan Denemeler</h3>
        {denemeler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)" }}>Henüz deneme yok.</p>}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {denemeler.map((d) => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <div>
                <p style={{ fontSize: 14 }}>{d.ad}</p>
                <p style={{ fontSize: 12, color: "rgba(15,27,45,0.5)" }}>{d.sablon_adi}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                {d.tur && <Badge variant={TUR_VAZIAN[d.tur] ?? "gray"}>{d.tur.toUpperCase()}</Badge>}
                <p className="tabular" style={{ fontSize: 13, color: "rgba(15,27,45,0.5)", marginTop: 4 }}>{d.tarih}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p style={{ fontSize: 12.5, color: "rgba(15,27,45,0.5)" }}>
        Not: Şu an sadece deneme kaydı oluşturuluyor. Soru sonuçlarının (D/Y/B) girilmesi, optik okuyucu import modülü hazır olunca otomatik yapılacak.
      </p>
    </div>
  );
}
