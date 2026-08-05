import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import {
  gorusmeleriGetir, gorusmeEkle, gorusmeDurumGuncelle, gorusmeSil,
  odemeleriGetir, odemeEkle, odemeOdendiGuncelle, odemeSil,
} from "../../lib/kocAraclariQueries";
import type { Gorusme, Odeme } from "../../types/database";

type Sekme = "gorusmeler" | "odemeler";

const DURUM_ETIKET: Record<string, { metin: string; renk: string }> = {
  planlandi: { metin: "planlandı", renk: "var(--gold-dim)" },
  tamamlandi: { metin: "tamamlandı", renk: "var(--dogru)" },
  iptal: { metin: "iptal", renk: "var(--yanlis)" },
};

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function GorusmeYonetimi() {
  const [sekme, setSekme] = useState<Sekme>("gorusmeler");
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);
  const [gOgrenciId, setGOgrenciId] = useState("");
  const [gKatilimci, setGKatilimci] = useState("ogrenci");
  const [gBaslik, setGBaslik] = useState("");
  const [gTarih, setGTarih] = useState("");
  const [gNotlar, setGNotlar] = useState("");
  const [gKaydediliyor, setGKaydediliyor] = useState(false);

  const [odemeler, setOdemeler] = useState<Odeme[]>([]);
  const [oOgrenciId, setOOgrenciId] = useState("");
  const [oTutar, setOTutar] = useState("");
  const [oAciklama, setOAciklama] = useState("");
  const [oTarih, setOTarih] = useState(bugunIso());
  const [oKaydediliyor, setOKaydediliyor] = useState(false);

  useEffect(() => {
    Promise.all([kocOgrencileri(), gorusmeleriGetir(), odemeleriGetir()])
      .then(([o, g, od]) => {
        setOgrenciler(o);
        setGorusmeler(g);
        setOdemeler(od);
        if (o.length > 0) {
          setGOgrenciId(o[0].id);
          setOOgrenciId(o[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const ogrenciAdi = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of ogrenciler) map.set(o.id, o.ad_soyad);
    return map;
  }, [ogrenciler]);

  async function handleGorusmeEkle() {
    if (!gOgrenciId || !gBaslik.trim() || !gTarih) return;
    setGKaydediliyor(true);
    try {
      const yeni = await gorusmeEkle({
        ogrenci_id: gOgrenciId,
        katilimci: gKatilimci,
        baslik: gBaslik.trim(),
        tarih: new Date(gTarih).toISOString(),
        notlar: gNotlar.trim() || null,
      });
      setGorusmeler((gs) => [yeni, ...gs]);
      setGBaslik("");
      setGNotlar("");
    } finally {
      setGKaydediliyor(false);
    }
  }

  async function handleOdemeEkle() {
    if (!oOgrenciId || !oTutar) return;
    const tutar = Number(oTutar);
    if (!Number.isFinite(tutar) || tutar <= 0) return;
    setOKaydediliyor(true);
    try {
      const yeni = await odemeEkle({
        ogrenci_id: oOgrenciId,
        tutar,
        aciklama: oAciklama.trim() || null,
        tarih: oTarih,
      });
      setOdemeler((od) => [yeni, ...od]);
      setOTutar("");
      setOAciklama("");
    } finally {
      setOKaydediliyor(false);
    }
  }

  async function gorusmeDurumunaGec(g: Gorusme, durum: string) {
    setGorusmeler((gs) => gs.map((x) => (x.id === g.id ? { ...x, durum } : x)));
    await gorusmeDurumGuncelle(g.id, durum);
  }

  async function odemeOdendiDegistir(od: Odeme) {
    setOdemeler((ods) => ods.map((x) => (x.id === od.id ? { ...x, odendi: !x.odendi } : x)));
    await odemeOdendiGuncelle(od.id, !od.odendi);
  }

  const odenen = odemeler.filter((o) => o.odendi).reduce((a, o) => a + Number(o.tutar), 0);
  const toplam = odemeler.reduce((a, o) => a + Number(o.tutar), 0);

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Görüşme & Ödeme Yönetimi</h1>

      <div className="stagger-item" style={{ display: "flex", gap: 8, marginBottom: 16, animationDelay: "0.05s" }}>
        <button onClick={() => setSekme("gorusmeler")} className={`btn${sekme === "gorusmeler" ? " btn-primary" : ""}`}>Görüşmeler</button>
        <button onClick={() => setSekme("odemeler")} className={`btn${sekme === "odemeler" ? " btn-primary" : ""}`}>Ödemeler</button>
      </div>

      {ogrenciler.length === 0 ? (
        <div className="card stagger-item">
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz öğrencin yok.</p>
        </div>
      ) : sekme === "gorusmeler" ? (
        <>
          <div className="card stagger-item" style={{ animationDelay: "0.1s" }}>
            <h2 className="card-title">Yeni Görüşme</h2>
            <select className="input" style={{ width: "100%" }} value={gOgrenciId} onChange={(e) => setGOgrenciId(e.target.value)}>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <select className="input" style={{ width: 140 }} value={gKatilimci} onChange={(e) => setGKatilimci(e.target.value)}>
                <option value="ogrenci">Öğrenci</option>
                <option value="veli">Veli</option>
              </select>
              <input className="input" style={{ flex: 1 }} type="datetime-local" value={gTarih} onChange={(e) => setGTarih(e.target.value)} />
            </div>
            <input className="input" style={{ width: "100%", marginTop: 8 }} value={gBaslik} onChange={(e) => setGBaslik(e.target.value)} placeholder="Görüşme konusu" onKeyDown={(e) => e.key === "Enter" && handleGorusmeEkle()} />
            <input className="input" style={{ width: "100%", marginTop: 8 }} value={gNotlar} onChange={(e) => setGNotlar(e.target.value)} placeholder="Not (isteğe bağlı)" onKeyDown={(e) => e.key === "Enter" && handleGorusmeEkle()} />
            <button onClick={handleGorusmeEkle} disabled={gKaydediliyor || !gBaslik.trim() || !gTarih} className="btn btn-primary" style={{ marginTop: 8, width: "100%" }}>
              {gKaydediliyor ? "Kaydediliyor…" : "Görüşmeyi Planla"}
            </button>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
            <h2 className="card-title">Görüşmeler</h2>
            {gorusmeler.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz görüşme yok.</p>}
            {gorusmeler.map((g, i) => {
              const d = DURUM_ETIKET[g.durum] ?? { metin: g.durum, renk: "var(--muted)" };
              return (
                <div key={g.id} className="stagger-item" style={{ padding: "11px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.03}s` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{g.baslik}</p>
                      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                        {ogrenciAdi.get(g.ogrenci_id) ?? "Öğrenci"} · {g.katilimci === "veli" ? "👪 Veli" : "🎓 Öğrenci"} ·{" "}
                        {new Date(g.tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        <span style={{ color: d.renk, fontWeight: 600 }}> · {d.metin}</span>
                      </p>
                      {g.notlar && <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, whiteSpace: "pre-wrap" }}>{g.notlar}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {g.durum !== "tamamlandi" && (
                        <button onClick={() => gorusmeDurumunaGec(g, "tamamlandi")} className="btn" style={{ padding: "5px 10px", background: "var(--dogru)", color: "#fff", fontSize: 11.5 }}>Tamamlandı</button>
                      )}
                      {g.durum !== "iptal" && g.durum !== "tamamlandi" && (
                        <button onClick={() => gorusmeDurumunaGec(g, "iptal")} className="btn" style={{ padding: "5px 10px", background: "var(--yanlis)", color: "#fff", fontSize: 11.5 }}>İptal</button>
                      )}
                      <button onClick={() => gorusmeSil(g.id)} style={{ border: "none", background: "none", color: "var(--muted)", fontSize: 12 }}>Sil</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, animationDelay: "0.1s" }}>
            <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{toplam.toLocaleString("tr-TR")} ₺</p>
              <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>toplam tahsilat</p>
            </div>
            <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: "var(--dogru)" }}>{odenen.toLocaleString("tr-TR")} ₺</p>
              <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>ödenen</p>
            </div>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
            <h2 className="card-title">Yeni Ödeme</h2>
            <select className="input" style={{ width: "100%" }} value={oOgrenciId} onChange={(e) => setOOgrenciId(e.target.value)}>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input className="input" style={{ width: 130 }} type="number" min="0" step="0.01" placeholder="Tutar (₺)" value={oTutar} onChange={(e) => setOTutar(e.target.value)} />
              <input className="input" style={{ width: 150 }} type="date" value={oTarih} onChange={(e) => setOTarih(e.target.value)} />
              <input className="input" style={{ flex: 1 }} value={oAciklama} onChange={(e) => setOAciklama(e.target.value)} placeholder="Açıklama (ör. Eylül dönemi)" onKeyDown={(e) => e.key === "Enter" && handleOdemeEkle()} />
            </div>
            <button onClick={handleOdemeEkle} disabled={oKaydediliyor || !oTutar || Number(oTutar) <= 0} className="btn btn-primary" style={{ marginTop: 8, width: "100%" }}>
              {oKaydediliyor ? "Kaydediliyor…" : "Ödemeyi Kaydet"}
            </button>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.2s" }}>
            <h2 className="card-title">Ödemeler</h2>
            {odemeler.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz ödeme kaydı yok.</p>}
            {odemeler.map((od, i) => (
              <div key={od.id} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.25 + i * 0.03}s` }}>
                <input type="checkbox" checked={od.odendi} onChange={() => odemeOdendiDegistir(od)} style={{ accentColor: "var(--gold-dim)", width: 16, height: 16 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: od.odendi ? "var(--muted)" : "var(--ink)", textDecoration: od.odendi ? "line-through" : "none" }}>
                    {ogrenciAdi.get(od.ogrenci_id) ?? "Öğrenci"} · {Number(od.tutar).toLocaleString("tr-TR")} ₺
                  </p>
                  <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                    {od.tarih} {od.aciklama ? `· ${od.aciklama}` : ""}
                  </p>
                </div>
                <button onClick={() => odemeSil(od.id)} style={{ border: "none", background: "none", color: "var(--muted)", fontSize: 12 }}>Sil</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
