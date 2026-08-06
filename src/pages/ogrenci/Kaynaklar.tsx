import { useEffect, useMemo, useState } from "react";
import { kitaplariGetir, kitapEkle, kitapGuncelle, kitapSil } from "../../lib/kaynakQueries";
import type { KaynakTuru, Kitap } from "../../types/database";
import { Card, Btn, Input, Label, FormGroup, Select, ProgressBar, Badge, AnimatedNumber, EmptyState, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";

const TURLER: { deger: KaynakTuru; etiket: string }[] = [
  { deger: "kitap", etiket: "Kitap" },
  { deger: "soru_bankasi", etiket: "Soru Bankası" },
  { deger: "deneme", etiket: "Deneme" },
  { deger: "video", etiket: "Video" },
];

function gunSayisi(tarih: string): number {
  return Math.round((new Date(tarih + "T00:00:00").getTime() - Date.now()) / 86400000);
}

function yuzde(a: number, b: number): number {
  return b === 0 ? 0 : Math.round((a / b) * 100);
}

export default function Kaynaklar() {
  const { toast, show } = useToast();
  const [kitaplar, setKitaplar] = useState<Kitap[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [ad, setAd] = useState("");
  const [kaynakTuru, setKaynakTuru] = useState<KaynakTuru>("kitap");
  const [toplam, setToplam] = useState("");
  const [bitisHedefi, setBitisHedefi] = useState("");

  useEffect(() => {
    kitaplariGetir().then(setKitaplar).catch(() => {}).finally(() => setYukleniyor(false));
  }, []);

  async function handleEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!ad.trim()) return;
    const yeni = await kitapEkle({
      ad: ad.trim(),
      kaynak_turu: kaynakTuru,
      toplam: Number(toplam) || 0,
      baslangic_tarihi: new Date().toISOString().slice(0, 10),
      bitis_hedefi: bitisHedefi || null,
    });
    setKitaplar((k) => [yeni, ...k]);
    setAd("");
    setToplam("");
    setBitisHedefi("");
    show("Kaynak eklendi ✓");
  }

  async function ilerlemeyiGuncelle(k: Kitap, miktar: number) {
    const yeni = Math.max(0, Math.min(k.toplam, k.ilerleme + miktar));
    if (yeni === k.ilerleme) return;
    setKitaplar((ks) => ks.map((x) => (x.id === k.id ? { ...x, ilerleme: yeni } : x)));
    await kitapGuncelle(k.id, { ilerleme: yeni });
  }

  async function handleSil(id: string) {
    setKitaplar((ks) => ks.filter((x) => x.id !== id));
    await kitapSil(id);
  }

  const genel = useMemo(() => {
    const toplamToplam = kitaplar.reduce((a, k) => a + k.toplam, 0);
    const toplamIlerleme = kitaplar.reduce((a, k) => a + k.ilerleme, 0);
    return {
      yuzde: yuzde(toplamIlerleme, toplamToplam),
      toplamIlerleme,
      toplamToplam,
    };
  }, [kitaplar]);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Kaynaklar</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Kitap, soru bankası ve deneme takibi</p>
      </div>

      <div className="card tape-accent" style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)" }}>Genel İlerleme</p>
          <span className="metric-value" style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
            <AnimatedNumber value={genel.yuzde} />%
          </span>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.5)", marginTop: 4 }}>{genel.toplamIlerleme} / {genel.toplamToplam} tamamlandı</p>
        </div>
        <div style={{ flex: 1 }}>
          <ProgressBar pct={genel.yuzde} color="#E4BB60" />
        </div>
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Kaynak Ekle</h3>
        <form onSubmit={handleEkle} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
          <FormGroup>
            <Label>Kaynak Adı *</Label>
            <Input placeholder="Palme TYT Mat." value={ad} onChange={(e) => setAd(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Tür</Label>
            <Select value={kaynakTuru} onChange={(e) => setKaynakTuru(e.target.value as KaynakTuru)}>
              {TURLER.map((t) => <option key={t.deger} value={t.deger}>{t.etiket}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Toplam *</Label>
            <Input type="number" min={1} placeholder="320" value={toplam} onChange={(e) => setToplam(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Bitiş Hedefi</Label>
            <Input type="date" value={bitisHedefi} onChange={(e) => setBitisHedefi(e.target.value)} />
          </FormGroup>
          <Btn variant="primary" type="submit" size="sm"><Icon name="plus" size={14} /> Ekle</Btn>
        </form>
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Kaynaklarım</h3>
        {kitaplar.length === 0 ? (
          <EmptyState icon="📚" title="Henüz kaynak yok" desc="Kitap, soru bankası veya deneme ekleyerek başla." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {kitaplar.map((k) => {
              const kalanGun = k.bitis_hedefi ? gunSayisi(k.bitis_hedefi) : null;
              const p = yuzde(k.ilerleme, k.toplam);
              const over = kalanGun !== null && kalanGun < 0;
              const done = p >= 100;
              const tur = TURLER.find((t) => t.deger === k.kaynak_turu)?.etiket ?? k.kaynak_turu;
              return (
                <div key={k.id} style={{ borderBottom: "1px solid rgba(15,27,45,0.07)", paddingBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{k.ad}</span>
                      <Badge variant="gray">{tur}</Badge>
                      {over && <Badge variant="brick">Gecikmiş</Badge>}
                      {done && <Badge variant="teal">Bitti ✓</Badge>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => ilerlemeyiGuncelle(k, -1)}>−</button>
                      <span className="tabular" style={{ fontSize: 14, fontWeight: 600, minWidth: 60, textAlign: "center" }}>
                        {k.ilerleme} / {k.toplam}
                      </span>
                      <button className="btn btn-ghost btn-sm" onClick={() => ilerlemeyiGuncelle(k, 1)}>+</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleSil(k.id)}><Icon name="trash" size={14} /></button>
                    </div>
                  </div>
                  <ProgressBar pct={p} color={over ? "#C4503A" : done ? "#2A9D8F" : "#E4BB60"} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "rgba(15,27,45,0.45)" }}>
                    <span>{p}% tamamlandı</span>
                    <span style={{ color: over ? "#C4503A" : "rgba(15,27,45,0.45)" }}>
                      {kalanGun === null ? "" : over ? `${Math.abs(kalanGun)} gün gecikmiş` : `${kalanGun} gün kaldı`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
