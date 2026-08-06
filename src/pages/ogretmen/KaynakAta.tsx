import { useEffect, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { kitapAta, ogrenciKitaplariGetir, kitapSil } from "../../lib/kaynakQueries";
import type { KaynakTuru, Kitap } from "../../types/database";
import { Card, Select, Input, Btn, Badge, ProgressBar } from "../../components/ui";

const TURLER: { deger: KaynakTuru; etiket: string }[] = [
  { deger: "kitap", etiket: "Kitap" },
  { deger: "soru_bankasi", etiket: "Soru Bankası" },
  { deger: "deneme", etiket: "Deneme" },
  { deger: "video", etiket: "Video" },
];

const TUR_VAZIAN: Record<string, "gray" | "gold" | "teal" | "brick"> = {
  kitap: "gray",
  soru_bankasi: "gold",
  deneme: "teal",
  video: "brick",
};

export default function KaynakAta() {
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [ogrenciId, setOgrenciId] = useState("");
  const [kitaplar, setKitaplar] = useState<Kitap[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [ad, setAd] = useState("");
  const [kaynakTuru, setKaynakTuru] = useState<KaynakTuru>("kitap");
  const [toplam, setToplam] = useState("");
  const [bitisHedefi, setBitisHedefi] = useState("");

  useEffect(() => {
    kocOgrencileri()
      .then((o) => {
        setOgrenciler(o);
        if (o.length > 0) setOgrenciId(o[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

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
  }

  async function handleSil(id: string) {
    setKitaplar((ks) => ks.filter((x) => x.id !== id));
    await kitapSil(id);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Kaynak Ata</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrencilere kitap, soru bankası ve deneme atayın</p>
      </div>

      {ogrenciler.length === 0 ? (
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz öğrencin yok.</p>
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Öğrenci</h3>
            <Select style={{ width: "100%" }} value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)}>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </Select>
          </Card>

          <Card className="tape-accent">
            <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Yeni Kaynak Ata</h3>
            <Input style={{ width: "100%" }} value={ad} onChange={(e) => setAd(e.target.value)} placeholder='Kaynak adı, örn. "345 TYT Matematik"' onKeyDown={(e) => e.key === "Enter" && handleAta()} />
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <Select value={kaynakTuru} onChange={(e) => setKaynakTuru(e.target.value as KaynakTuru)} style={{ flex: 1, minWidth: 130 }}>
                {TURLER.map((t) => (
                  <option key={t.deger} value={t.deger}>{t.etiket}</option>
                ))}
              </Select>
              <Input type="number" min={0} placeholder="Toplam sayfa/soru" value={toplam} onChange={(e) => setToplam(e.target.value)} style={{ flex: 1, minWidth: 120 }} />
              <Input type="date" value={bitisHedefi} onChange={(e) => setBitisHedefi(e.target.value)} style={{ flex: 1, minWidth: 140 }} title="Bitiş hedefi" />
              <Btn onClick={handleAta} disabled={!ad.trim()}>Ata</Btn>
            </div>
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Atanan Kaynaklar</h3>
            {kitaplar.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Bu öğrenciye henüz kaynak atanmamış.</p>}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {kitaplar.map((k) => {
                const yuzde = k.toplam === 0 ? 0 : Math.round((k.ilerleme / k.toplam) * 100);
                return (
                  <div key={k.id} style={{ padding: "11px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600 }}>{k.ad}</p>
                        <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)" }}>
                          <Badge variant={TUR_VAZIAN[k.kaynak_turu] ?? "gray"}>{TURLER.find((t) => t.deger === k.kaynak_turu)?.etiket ?? k.kaynak_turu}</Badge>
                          {" "}· {k.ilerleme}/{k.toplam} ({yuzde}%)
                        </p>
                      </div>
                      <Btn variant="ghost" size="sm" onClick={() => handleSil(k.id)}>Kaldır</Btn>
                    </div>
                    <ProgressBar pct={yuzde} color="#A07C20" />
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
