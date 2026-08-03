import { useEffect, useMemo, useState } from "react";
import { yanlislariGetir, yanlisEkle, yanlisCozulduIsaretle, yanlisSil } from "../../lib/yanlisQueries";
import { konularVeDersler, type KonuDersBilgisi } from "../../lib/konuIlerlemeQueries";
import { tekrarPlanEkle } from "../../lib/tekrarPlanQueries";
import type { YanlisArsivi } from "../../types/database";

export default function Yanlislar() {
  const [kayitlar, setKayitlar] = useState<YanlisArsivi[]>([]);
  const [konular, setKonular] = useState<KonuDersBilgisi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [konuId, setKonuId] = useState("");
  const [kaynakAdi, setKaynakAdi] = useState("");
  const [sayfaNo, setSayfaNo] = useState("");
  const [soruNo, setSoruNo] = useState("");
  const [aciklama, setAciklama] = useState("");

  useEffect(() => {
    Promise.all([yanlislariGetir(), konularVeDersler()])
      .then(([y, k]) => {
        setKayitlar(y);
        setKonular(k);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const konuHaritasi = useMemo(() => {
    const map = new Map<string, KonuDersBilgisi>();
    for (const k of konular) map.set(k.id, k);
    return map;
  }, [konular]);

  async function handleEkle() {
    if (!aciklama.trim() && !kaynakAdi.trim()) return;
    const yeni = await yanlisEkle({
      konu_id: konuId || null,
      kaynak_adi: kaynakAdi.trim() || null,
      sayfa_no: sayfaNo.trim() === "" ? null : Number(sayfaNo),
      soru_no: soruNo.trim() === "" ? null : Number(soruNo),
      aciklama: aciklama.trim() || null,
    });
    setKayitlar((k) => [yeni, ...k]);
    setKaynakAdi("");
    setSayfaNo("");
    setSoruNo("");
    setAciklama("");
  }

  async function toggleCozuldu(k: YanlisArsivi) {
    const yeni = !k.cozuldu;
    setKayitlar((ks) => ks.map((x) => (x.id === k.id ? { ...x, cozuldu: yeni } : x)));
    await yanlisCozulduIsaretle(k.id, yeni);
  }

  async function tekrarinaEkle(k: YanlisArsivi) {
    await tekrarPlanEkle(
      k.aciklama || `Yanlış soru (${k.kaynak_adi ?? "kaynak belirtilmedi"}${k.soru_no ? ` · Soru ${k.soru_no}` : ""})`,
      k.id,
      new Date().toISOString().slice(0, 10)
    );
  }

  async function handleSil(id: string) {
    setKayitlar((ks) => ks.filter((x) => x.id !== id));
    await yanlisSil(id);
  }

  const cozulmeyenler = kayitlar.filter((k) => !k.cozuldu);
  const cozulenler = kayitlar.filter((k) => k.cozuldu);

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  function Satir({ k, i }: { k: YanlisArsivi; i: number }) {
    const konu = k.konu_id ? konuHaritasi.get(k.konu_id) : null;
    return (
      <div className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.04}s` }}>
        <input type="checkbox" checked={k.cozuldu} onChange={() => toggleCozuldu(k)} style={{ accentColor: "var(--gold-dim)", width: 16, height: 16 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13.5, color: "var(--ink)", textDecoration: k.cozuldu ? "line-through" : "none", opacity: k.cozuldu ? 0.5 : 1 }}>
            {k.aciklama || "Açıklamasız yanlış"}
            {k.soru_no ? ` (Soru ${k.soru_no})` : ""}
          </p>
          <p style={{ fontSize: 11.5, color: "var(--muted)" }}>
            {konu ? `${konu.ad} · ` : ""}{k.kaynak_adi || "kaynak yok"}{k.sayfa_no ? ` · sf. ${k.sayfa_no}` : ""} · {k.eklenme_tarihi}
          </p>
        </div>
        {!k.cozuldu && (
          <button onClick={() => tekrarinaEkle(k)} className="btn" style={{ padding: "5px 10px", background: "var(--ink)", color: "var(--gold-glow)", fontSize: 12 }}>
            Tekrarına ekle
          </button>
        )}
        <button onClick={() => handleSil(k.id)} style={{ border: "none", background: "none", color: "var(--yanlis)", fontSize: 12 }}>Sil</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Yanlışlar</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <h2 className="card-title">Yanlış Soru Ekle</h2>
        <input className="input" style={{ width: "100%" }} value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Kısa açıklama / soru hakkında not" onKeyDown={(e) => e.key === "Enter" && handleEkle()} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
          <select className="input" value={konuId} onChange={(e) => setKonuId(e.target.value)}>
            <option value="">Konu (isteğe bağlı)</option>
            {konular.map((k) => <option key={k.id} value={k.id}>{k.ad}</option>)}
          </select>
          <input className="input" value={kaynakAdi} onChange={(e) => setKaynakAdi(e.target.value)} placeholder="Kaynak" />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" type="number" value={sayfaNo} onChange={(e) => setSayfaNo(e.target.value)} placeholder="sf." style={{ width: 70 }} />
            <input className="input" type="number" value={soruNo} onChange={(e) => setSoruNo(e.target.value)} placeholder="soru no" style={{ flex: 1 }} />
          </div>
        </div>
        <button onClick={handleEkle} disabled={!aciklama.trim() && !kaynakAdi.trim()} className="btn btn-primary" style={{ marginTop: 12 }}>
          Ekle
        </button>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
        <h2 className="card-title">Çözülmeyen ({cozulmeyenler.length})</h2>
        {cozulmeyenler.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Çözülmemiş yanlış yok.</p>}
        {cozulmeyenler.map((k, i) => <Satir key={k.id} k={k} i={i} />)}
      </div>

      {cozulenler.length > 0 && (
        <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
          <h2 className="card-title">Çözülen ({cozulenler.length})</h2>
          {cozulenler.map((k, i) => <Satir key={k.id} k={k} i={i} />)}
        </div>
      )}
    </div>
  );
}
