import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import {
  gorusmeleriGetir, gorusmeEkle, gorusmeDurumGuncelle, gorusmeSil,
  odemeleriGetir, odemeEkle, odemeOdendiGuncelle, odemeSil,
} from "../../lib/kocAraclariQueries";
import type { Gorusme, Odeme } from "../../types/database";
import { Card, Select, Input, Btn, Badge, Checkbox, KPICard, Tabs } from "../../components/ui";

type Sekme = "gorusmeler" | "odemeler";

const DURUM_VAZIAN: Record<string, "gold" | "teal" | "brick"> = {
  planlandi: "gold",
  tamamlandi: "teal",
  iptal: "brick",
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

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Görüşme & Ödeme Yönetimi</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Velilerle görüşmeleri planlayın, tahsilatları takip edin</p>
      </div>

      <div style={{ maxWidth: 420 }}>
        <Tabs tabs={["Görüşmeler", "Ödemeler"]} active={sekme === "gorusmeler" ? "Görüşmeler" : "Ödemeler"} onChange={(t) => setSekme(t === "Görüşmeler" ? "gorusmeler" : "odemeler")} />
      </div>

      {ogrenciler.length === 0 ? (
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz öğrencin yok.</p>
        </Card>
      ) : sekme === "gorusmeler" ? (
        <>
          <Card className="tape-accent">
            <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Yeni Görüşme</h3>
            <Select style={{ width: "100%" }} value={gOgrenciId} onChange={(e) => setGOgrenciId(e.target.value)}>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </Select>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Select style={{ width: 140 }} value={gKatilimci} onChange={(e) => setGKatilimci(e.target.value)}>
                <option value="ogrenci">Öğrenci</option>
                <option value="veli">Veli</option>
              </Select>
              <Input style={{ flex: 1 }} type="datetime-local" value={gTarih} onChange={(e) => setGTarih(e.target.value)} />
            </div>
            <Input style={{ width: "100%", marginTop: 8 }} value={gBaslik} onChange={(e) => setGBaslik(e.target.value)} placeholder="Görüşme konusu" onKeyDown={(e) => e.key === "Enter" && handleGorusmeEkle()} />
            <Input style={{ width: "100%", marginTop: 8 }} value={gNotlar} onChange={(e) => setGNotlar(e.target.value)} placeholder="Not (isteğe bağlı)" onKeyDown={(e) => e.key === "Enter" && handleGorusmeEkle()} />
            <Btn onClick={handleGorusmeEkle} disabled={gKaydediliyor || !gBaslik.trim() || !gTarih} style={{ marginTop: 8, width: "100%" }}>
              {gKaydediliyor ? "Kaydediliyor…" : "Görüşmeyi Planla"}
            </Btn>
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Görüşmeler</h3>
            {gorusmeler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz görüşme yok.</p>}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {gorusmeler.map((g) => {
                return (
                  <div key={g.id} style={{ padding: "11px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 500 }}>{g.baslik}</p>
                        <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)", marginTop: 1 }}>
                          {ogrenciAdi.get(g.ogrenci_id) ?? "Öğrenci"} · {g.katilimci === "veli" ? "👪 Veli" : "🎓 Öğrenci"} ·{" "}
                          {new Date(g.tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          <Badge variant={DURUM_VAZIAN[g.durum] ?? "gray"}> · {DURUM_VAZIAN[g.durum] === "teal" ? "tamamlandı" : DURUM_VAZIAN[g.durum] === "brick" ? "iptal" : "planlandı"}</Badge>
                        </p>
                        {g.notlar && <p style={{ fontSize: 12.5, color: "rgba(15,27,45,0.5)", marginTop: 4, whiteSpace: "pre-wrap" }}>{g.notlar}</p>}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {g.durum !== "tamamlandi" && (
                          <Btn variant="primary" size="sm" onClick={() => gorusmeDurumunaGec(g, "tamamlandi")}>Tamamlandı</Btn>
                        )}
                        {g.durum !== "iptal" && g.durum !== "tamamlandi" && (
                          <Btn variant="danger" size="sm" onClick={() => gorusmeDurumunaGec(g, "iptal")}>İptal</Btn>
                        )}
                        <Btn variant="ghost" size="sm" onClick={() => gorusmeSil(g.id)}>Sil</Btn>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <KPICard label="Toplam tahsilat" value={toplam} sub="₺" />
            <KPICard label="Ödenen" value={odenen} sub="₺" color="#2A9D8F" />
          </div>

          <Card className="tape-accent">
            <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Yeni Ödeme</h3>
            <Select style={{ width: "100%" }} value={oOgrenciId} onChange={(e) => setOOgrenciId(e.target.value)}>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </Select>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <Input style={{ width: 130 }} type="number" min="0" step="0.01" placeholder="Tutar (₺)" value={oTutar} onChange={(e) => setOTutar(e.target.value)} />
              <Input style={{ width: 150 }} type="date" value={oTarih} onChange={(e) => setOTarih(e.target.value)} />
              <Input style={{ flex: 1, minWidth: 180 }} value={oAciklama} onChange={(e) => setOAciklama(e.target.value)} placeholder="Açıklama (ör. Eylül dönemi)" onKeyDown={(e) => e.key === "Enter" && handleOdemeEkle()} />
            </div>
            <Btn onClick={handleOdemeEkle} disabled={oKaydediliyor || !oTutar || Number(oTutar) <= 0} style={{ marginTop: 8, width: "100%" }}>
              {oKaydediliyor ? "Kaydediliyor…" : "Ödemeyi Kaydet"}
            </Btn>
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Ödemeler</h3>
            {odemeler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz ödeme kaydı yok.</p>}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {odemeler.map((od) => (
                <div key={od.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                  <Checkbox checked={od.odendi} onChange={() => odemeOdendiDegistir(od)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: od.odendi ? "rgba(15,27,45,0.5)" : "#0F1B2D", textDecoration: od.odendi ? "line-through" : "none" }}>
                      {ogrenciAdi.get(od.ogrenci_id) ?? "Öğrenci"} · {Number(od.tutar).toLocaleString("tr-TR")} ₺
                    </p>
                    <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)", marginTop: 1 }}>
                      {od.tarih} {od.aciklama ? `· ${od.aciklama}` : ""}
                    </p>
                  </div>
                  <Btn variant="ghost" size="sm" onClick={() => odemeSil(od.id)}>Sil</Btn>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
