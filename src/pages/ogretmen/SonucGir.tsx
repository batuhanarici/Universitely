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

type DenemeDetayli = Deneme & { sablon_adi: string };

const DURUMLAR: { deger: SoruDurumu; etiket: string; renk: string }[] = [
  { deger: "dogru", etiket: "D", renk: "var(--dogru)" },
  { deger: "yanlis", etiket: "Y", renk: "var(--yanlis)" },
  { deger: "bos", etiket: "B", renk: "var(--bos)" },
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
    return <p style={{ textAlign: "center", marginTop: 60, color: "var(--yanlis)" }}>Önce bir deneme oluşturman lazım.</p>;
  }
  if (ogrenciler.length === 0) {
    return <p style={{ textAlign: "center", marginTop: 60, color: "var(--yanlis)" }}>Henüz kayıtlı öğrenci yok — öğrenciler kendi hesaplarını oluşturunca burada görünecekler.</p>;
  }

  return (
    <div>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Sonuç Gir</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <select value={denemeId} onChange={(e) => setDenemeId(e.target.value)} className="input" style={{ flex: 1 }}>
            {denemeler.map((d) => <option key={d.id} value={d.id}>{d.ad}</option>)}
          </select>
          <select value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)} className="input" style={{ flex: 1 }}>
            {ogrenciler.map((o) => <option key={o.id} value={o.id}>{o.ad_soyad}</option>)}
          </select>
        </div>

        {zatenGirilmis && (
          <p style={{ color: "var(--gold-dim)", marginTop: 12, fontSize: 13 }}>
            Bu öğrenci için bu denemenin sonuçları zaten girilmiş.
          </p>
        )}

        {!zatenGirilmis && sorular.length > 0 && (
          <>
            <div style={{ marginTop: 16, border: "1px solid var(--paper-dim)", borderRadius: 10, overflow: "hidden" }}>
              {sorular.map((s, i) => (
                <div key={s.soru_no} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderTop: i === 0 ? "none" : "1px solid #f2f2f2", animationDelay: `${i * 0.02}s` }}>
                  <span className="mono" style={{ width: 36, fontSize: 12.5, color: "var(--muted)" }}>#{s.soru_no}</span>
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
                          fontWeight: 700, fontSize: 12, transition: "all 0.15s var(--ease)",
                        }}
                      >
                        {d.etiket}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleKaydet} disabled={!tumuCevaplandi || kaydediliyor} className="btn btn-primary" style={{ marginTop: 16 }}>
              {kaydediliyor ? "Kaydediliyor…" : tumuCevaplandi ? "Sonuçları Kaydet" : `${Object.keys(cevaplar).length}/${sorular.length} soru işaretlendi`}
            </button>
          </>
        )}

        {mesaj && <p style={{ marginTop: 12, color: "var(--dogru)" }}>{mesaj}</p>}
      </div>
    </div>
  );
}
