import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { kitapAta, ogrenciKitaplariGetir, kitapSil } from "../../lib/kaynakQueries";
import type { KaynakTuru, Kitap } from "../../types/database";
import { subeleriGetir, subeyeGoreFiltrele, type Sube } from "../../lib/subeQueries";
import { Card, Select, Input, Label, FormGroup, Btn, Badge, ProgressBar, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";

const TURLER: { deger: KaynakTuru; etiket: string }[] = [
  { deger: "kitap", etiket: "Kitap" },
  { deger: "soru_bankasi", etiket: "Soru Bankası" },
  { deger: "deneme", etiket: "Deneme" },
  { deger: "video", etiket: "Video" },
];

export default function KaynakAta() {
  const { toast, show } = useToast();
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [subeler, setSubeler] = useState<Sube[]>([]);
  const [seciliSubeId, setSeciliSubeId] = useState("");
  const [ogrenciId, setOgrenciId] = useState("");
  const [kitaplar, setKitaplar] = useState<Kitap[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [ad, setAd] = useState("");
  const [kaynakTuru, setKaynakTuru] = useState<KaynakTuru>("kitap");
  const [toplam, setToplam] = useState("");
  const [bitisHedefi, setBitisHedefi] = useState("");

  useEffect(() => {
    Promise.all([kocOgrencileri(), subeleriGetir()])
      .then(([o, s]) => {
        setOgrenciler(o);
        setSubeler(s);
        if (o.length > 0) setOgrenciId(o[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const filtreliOgrenciler = useMemo(() => subeyeGoreFiltrele(ogrenciler, seciliSubeId), [ogrenciler, seciliSubeId]);

  useEffect(() => {
    if (filtreliOgrenciler.length === 0) return;
    if (!filtreliOgrenciler.some((o) => o.id === ogrenciId)) {
      setOgrenciId(filtreliOgrenciler[0].id);
    }
  }, [filtreliOgrenciler, ogrenciId]);

  useEffect(() => {
    if (!ogrenciId) {
      setKitaplar([]);
      return;
    }
    ogrenciKitaplariGetir(ogrenciId).then(setKitaplar).catch(() => {});
  }, [ogrenciId]);

  async function handleAta() {
    if (!ogrenciId || !ad.trim()) return;
    await kitapAta(ogrenciId, {
      ad: ad.trim(),
      kaynak_turu: kaynakTuru,
      toplam: Number(toplam) || 0,
      baslangic_tarihi: new Date().toISOString().slice(0, 10),
      bitis_hedefi: bitisHedefi || null,
    });
    setAd("");
    setToplam("");
    setBitisHedefi("");
    setKitaplar(await ogrenciKitaplariGetir(ogrenciId));
    show("Kaynak atandı ✓");
  }

  async function handleSil(id: string) {
    setKitaplar((ks) => ks.filter((x) => x.id !== id));
    await kitapSil(id);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  if (ogrenciler.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {toast}
        <h1 className="page-title">Kaynak Ata</h1>
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz öğrencin yok.</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Kaynak Ata</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrencilere kitap, soru bankası ve deneme atayın</p>
      </div>

      <Card style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {subeler.length > 0 && (
            <FormGroup>
              <Label>Şube</Label>
              <Select value={seciliSubeId} onChange={(e) => setSeciliSubeId(e.target.value)} style={{ maxWidth: 160 }}>
                <option value="">Tüm Şubeler</option>
                {subeler.map((s) => (
                  <option key={s.id} value={s.id}>{s.ad}</option>
                ))}
              </Select>
            </FormGroup>
          )}
          <FormGroup>
            <Label>Öğrenci</Label>
            <Select value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)} style={{ maxWidth: 220 }}>
              {filtreliOgrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </Select>
          </FormGroup>
        </div>
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Yeni Kaynak Ata</h3>
        <form
          onSubmit={(e) => { e.preventDefault(); handleAta(); }}
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10, alignItems: "flex-end" }}
        >
          <FormGroup>
            <Label>Kaynak Adı *</Label>
            <Input placeholder="Palme TYT Matematik" value={ad} onChange={(e) => setAd(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Tür</Label>
            <Select value={kaynakTuru} onChange={(e) => setKaynakTuru(e.target.value as KaynakTuru)}>
              {TURLER.map((t) => (
                <option key={t.deger} value={t.deger}>{t.etiket}</option>
              ))}
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
          <Btn variant="primary" type="submit" size="sm">Ata</Btn>
        </form>
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Atanan Kaynaklar</h3>
        {kitaplar.length === 0 ? <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Kaynak atanmamış.</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {kitaplar.map((k) => {
              const p = k.toplam === 0 ? 0 : Math.round((k.ilerleme / k.toplam) * 100);
              return (
                <div key={k.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{k.ad}</span>
                      <Badge variant="gray">{TURLER.find((t) => t.deger === k.kaynak_turu)?.etiket ?? k.kaynak_turu}</Badge>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="tabular" style={{ fontSize: 13 }}>{k.ilerleme}/{k.toplam} ({p}%)</span>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleSil(k.id)} title="Kaynağı kaldır"><Icon name="trash" size={13} /></button>
                    </div>
                  </div>
                  <ProgressBar pct={p} color="#E4BB60" />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
