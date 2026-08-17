import { useCallback, useEffect, useMemo, useState } from "react";
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
import { subeleriGetir, subeyeGoreFiltrele, type Sube } from "../../lib/subeQueries";
import { Card, Select, Btn, Badge, Label, FormGroup, ErrorState, LoadingState, useToast } from "../../components/ui";

type DenemeDetayli = Deneme & { sablon_adi: string };

const DURUMLAR: { deger: SoruDurumu; etiket: string; renk: string }[] = [
  { deger: "dogru", etiket: "D", renk: "#2A9D8F" },
  { deger: "yanlis", etiket: "Y", renk: "#C4503A" },
  { deger: "bos", etiket: "B", renk: "#9A9FA8" },
];

const btnStyle = (val: SoruDurumu, cur: SoruDurumu | undefined, color: string) => ({
  padding: "8px 12px",
  minWidth: 38,
  minHeight: 36,
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
  const [subeler, setSubeler] = useState<Sube[]>([]);
  const [seciliSubeId, setSeciliSubeId] = useState("");
  const [denemeId, setDenemeId] = useState("");
  const [ogrenciId, setOgrenciId] = useState("");
  const [sorular, setSorular] = useState<SablonSorusuDetayli[]>([]);
  const [cevaplar, setCevaplar] = useState<Record<number, SoruDurumu>>({});
  const [zatenGirilmis, setZatenGirilmis] = useState(false);
  const [kaydedildi, setKaydedildi] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);
  const [sorularYukleniyor, setSorularYukleniyor] = useState(false);
  const [sorularHatasi, setSorularHatasi] = useState(false);
  const [soruDeneme, setSoruDeneme] = useState(0);
  const [kontrolYukleniyor, setKontrolYukleniyor] = useState(false);
  const [kontrolHatasi, setKontrolHatasi] = useState(false);
  const [kontrolDeneme, setKontrolDeneme] = useState(0);
  const [kaydetmeHatasi, setKaydetmeHatasi] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const verileriYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata(false);
    try {
      const [d, o, s] = await Promise.all([denemeleriGetir(), ogrencileriGetir(), subeleriGetir()]);
      setDenemeler(d);
      setOgrenciler(o);
      setSubeler(s);
      if (d.length > 0) setDenemeId(d[0].id);
      if (o.length > 0) setOgrenciId(o[0].id);
    } catch {
      setHata(true);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void verileriYukle();
  }, [verileriYukle]);

  const filtreliOgrenciler = useMemo(() => subeyeGoreFiltrele(ogrenciler, seciliSubeId), [ogrenciler, seciliSubeId]);

  // Şube filtresi seçildiğinde, listede olmayan bir öğrenci seçili kalmasın
  useEffect(() => {
    if (filtreliOgrenciler.length === 0) return;
    if (!filtreliOgrenciler.some((o) => o.id === ogrenciId)) {
      setOgrenciId(filtreliOgrenciler[0].id);
    }
  }, [filtreliOgrenciler, ogrenciId]);

  useEffect(() => {
    const secilenDeneme = denemeler.find((d) => d.id === denemeId);
    if (!secilenDeneme?.sablon_id) {
      setSorular([]);
      setSorularYukleniyor(false);
      return;
    }

    let aktif = true;
    setSorularYukleniyor(true);
    setSorularHatasi(false);
    sablonSorulariniGetir(secilenDeneme.sablon_id)
      .then((s) => {
        if (!aktif) return;
        setSorular(s);
        setCevaplar({});
      })
      .catch(() => {
        if (!aktif) return;
        setSorular([]);
        setSorularHatasi(true);
      })
      .finally(() => {
        if (aktif) setSorularYukleniyor(false);
      });
    setKaydedildi(false);
    return () => {
      aktif = false;
    };
  }, [denemeId, denemeler, soruDeneme]);

  useEffect(() => {
    if (!denemeId || !ogrenciId) return;
    let aktif = true;
    setKontrolYukleniyor(true);
    setKontrolHatasi(false);
    setZatenGirilmis(false);
    denemeSonucuVarMi(denemeId, ogrenciId)
      .then((varMi) => {
        if (aktif) setZatenGirilmis(varMi);
      })
      .catch(() => {
        if (aktif) setKontrolHatasi(true);
      })
      .finally(() => {
        if (aktif) setKontrolYukleniyor(false);
      });
    setKaydedildi(false);
    return () => {
      aktif = false;
    };
  }, [denemeId, ogrenciId, kontrolDeneme]);

  function cevapSec(soruNo: number, durum: SoruDurumu) {
    setCevaplar((c) => ({ ...c, [soruNo]: durum }));
  }

  const marked = Object.keys(cevaplar).length;
  const allMarked = sorular.length > 0 && marked === sorular.length;

  async function handleKaydet() {
    if (!allMarked || kaydediliyor) return;
    setKaydetmeHatasi(false);
    setKaydediliyor(true);
    try {
      const kayit = sorular.map((s) => ({ soru_no: s.soru_no, durum: cevaplar[s.soru_no] }));
      await sonucGirisiKaydet(denemeId, ogrenciId, kayit);
      setKaydedildi(true);
      setZatenGirilmis(true);
      setCevaplar({});
      show("Sonuçlar kaydedildi ✓");
    } catch {
      setKaydetmeHatasi(true);
      show("Sonuçlar kaydedilemedi. İşaretlerin korunuyor; tekrar deneyebilirsin.");
    } finally {
      setKaydediliyor(false);
    }
  }

  if (yukleniyor) return <LoadingState className="page-loading" />;

  if (hata) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 className="page-title">Sonuç Gir</h1>
        <ErrorState
          title="Sonuç giriş verileri yüklenemedi."
          description="Deneme, öğrenci ve şube bilgileri alınamadı. Tekrar deneyebilirsin."
          onRetry={() => void verileriYukle()}
        />
      </div>
    );
  }

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
                  <Select disabled={kaydediliyor} value={denemeId} onChange={(e) => { setDenemeId(e.target.value); setCevaplar({}); setKaydetmeHatasi(false); }}>
                    {denemeler.map((d) => (
                      <option key={d.id} value={d.id}>{d.ad}</option>
                    ))}
                  </Select>
                </FormGroup>
              {subeler.length > 0 && (
                  <FormGroup style={{ minWidth: 160 }}>
                    <Label>Şube</Label>
                    <Select disabled={kaydediliyor} value={seciliSubeId} onChange={(e) => { setSeciliSubeId(e.target.value); setKaydetmeHatasi(false); }}>
                      <option value="">Tüm Şubeler</option>
                      {subeler.map((s) => (
                        <option key={s.id} value={s.id}>{s.ad}</option>
                      ))}
                    </Select>
                  </FormGroup>
              )}
                <FormGroup style={{ minWidth: 200 }}>
                  <Label>Öğrenci</Label>
                  <Select disabled={kaydediliyor} value={ogrenciId} onChange={(e) => { setOgrenciId(e.target.value); setCevaplar({}); setKaydetmeHatasi(false); }}>
                    {filtreliOgrenciler.map((o) => (
                      <option key={o.id} value={o.id}>{o.ad_soyad}</option>
                    ))}
                  </Select>
                </FormGroup>
            </div>
          </Card>

          {kontrolYukleniyor && <LoadingState label="Bu öğrenci için mevcut sonuç kontrol ediliyor…" />}
          {kontrolHatasi && (
            <ErrorState
              title="Mevcut sonuç kontrol edilemedi."
              description="Çift kayıt oluşturmamak için önce bu denemenin daha önce girilip girilmediğini doğrulamak gerekiyor."
              onRetry={() => setKontrolDeneme((sayi) => sayi + 1)}
            />
          )}
          {zatenGirilmis && !kontrolYukleniyor && (
            <Card>
              <Badge variant="gold">Bu öğrenci için bu denemenin sonuçları zaten girilmiş.</Badge>
            </Card>
          )}

          {sorularYukleniyor && <LoadingState label="Soru şablonu yükleniyor…" />}
          {sorularHatasi && !sorularYukleniyor && (
            <ErrorState
              title="Soru şablonu yüklenemedi."
              description="D/Y/B girişine başlamadan önce soru listesinin yüklenmesi gerekiyor."
              onRetry={() => setSoruDeneme((sayi) => sayi + 1)}
            />
          )}

          {!zatenGirilmis && !kontrolYukleniyor && !kontrolHatasi && !sorularYukleniyor && !sorularHatasi && sorular.length > 0 && (
              <Card>
              {kaydetmeHatasi && (
                <ErrorState
                  title="Sonuçlar kaydedilemedi."
                  description="İşaretlediğin cevaplar korunuyor. Bağlantını kontrol edip Kaydet düğmesine yeniden basabilirsin."
                />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Soru Listesi</h3>
                <Badge variant={allMarked ? "teal" : "gray"}>{marked}/{sorular.length} soru işaretlendi</Badge>
              </div>
              <div className="sonuc-soru-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
                {sorular.map((q) => (
                  <div key={q.soru_no} className="sonuc-soru-satiri" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(15,27,45,0.02)", border: "1px solid rgba(15,27,45,0.07)" }}>
                    <span className="tabular" style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,27,45,0.35)", minWidth: 28 }}>{q.soru_no}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: "rgba(15,27,45,0.6)", lineHeight: 1.3 }}>{q.konu_ad}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {DURUMLAR.map((d) => (
                        <button
                          key={d.deger}
                          type="button"
                          style={btnStyle(d.deger, cevaplar[q.soru_no], d.renk)}
                          onClick={() => cevapSec(q.soru_no, d.deger)}
                          disabled={kaydediliyor}
                          aria-pressed={cevaplar[q.soru_no] === d.deger}
                          aria-label={`Soru ${q.soru_no}: ${d.etiket}`}
                        >
                          {d.etiket}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <Btn variant="primary" type="button" onClick={handleKaydet} disabled={!allMarked || kaydediliyor}>
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
