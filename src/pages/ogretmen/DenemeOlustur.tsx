import { useEffect, useState } from "react";
import type { DenemeSablonu, Deneme, DenemeTuru } from "../../types/database";
import { sablonlariGetirDetayli, denemeOlustur, denemeleriGetir } from "../../lib/denemeQueries";
import { Card, Input, Select, Btn, Badge, Label, FormGroup, useToast } from "../../components/ui";

type SablonDetayli = DenemeSablonu & { ders_adi: string };
type DenemeDetayli = Deneme & { sablon_adi: string };

const TURLER: { deger: DenemeTuru; etiket: string }[] = [
  { deger: "tyt", etiket: "TYT" },
  { deger: "ayt", etiket: "AYT" },
  { deger: "brans", etiket: "Branş" },
];

const TUR_VAZIAN: Record<string, "gold" | "teal" | "gray"> = { tyt: "gold", ayt: "teal", brans: "gray" };

export default function DenemeOlustur() {
  const { toast, show } = useToast();
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

  async function handleKaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!ad.trim() || !sablonId || !tarih) return;
    setKaydediliyor(true);
    try {
      await denemeOlustur(ad.trim(), tarih, sablonId, tur);
      setAd("");
      await verileriYenile();
      show("Deneme oluşturuldu ✓");
    } finally {
      setKaydediliyor(false);
    }
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Deneme Oluştur</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Şablondan yeni deneme kaydı oluşturun</p>
      </div>

      {sablonlar.length === 0 ? (
        <Card>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)" }}>Önce Deneme Şablonu oluşturun.</p>
        </Card>
      ) : (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Yeni Deneme</h3>
          <form onSubmit={handleKaydet} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
            <FormGroup>
              <Label>Deneme Adı *</Label>
              <Input placeholder="TYT Denemesi #4" value={ad} onChange={(e) => setAd(e.target.value)} required />
            </FormGroup>
            <FormGroup>
              <Label>Şablon *</Label>
              <Select value={sablonId} onChange={(e) => setSablonId(e.target.value)} required>
                <option value="">Şablon seç…</option>
                {sablonlar.map((s) => (
                  <option key={s.id} value={s.id}>{s.ad} · {s.ders_adi}</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Tür</Label>
              <Select value={tur} onChange={(e) => setTur(e.target.value as DenemeTuru)}>
                {TURLER.map((t) => (
                  <option key={t.deger} value={t.deger}>{t.etiket}</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Tarih</Label>
              <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
            </FormGroup>
            <Btn variant="primary" type="submit" size="sm" disabled={kaydediliyor}>
              {kaydediliyor ? "…" : "Oluştur"}
            </Btn>
          </form>
        </Card>
      )}

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Oluşturulan Denemeler</h3>
        {denemeler.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Henüz deneme yok.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Şablon</th>
                <th>Tür</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {denemeler.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 500 }}>{e.ad}</td>
                  <td style={{ fontSize: 12, color: "rgba(15,27,45,0.6)" }}>{e.sablon_adi}</td>
                  <td>{e.tur && <Badge variant={TUR_VAZIAN[e.tur] ?? "gray"}>{e.tur.toUpperCase()}</Badge>}</td>
                  <td className="tabular" style={{ fontSize: 12, color: "rgba(15,27,45,0.6)" }}>{e.tarih}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
