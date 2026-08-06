import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import {
  gorusmeleriGetir, gorusmeEkle, gorusmeDurumGuncelle, gorusmeSil,
  odemeleriGetir, odemeEkle, odemeOdendiGuncelle, odemeSil,
} from "../../lib/kocAraclariQueries";
import type { Gorusme, Odeme } from "../../types/database";
import { Card, Select, Input, Textarea, Btn, Badge, Checkbox, Tabs, Label, FormGroup, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";

type Sekme = "gorusmeler" | "odemeler";

const DURUM_ETIKET: Record<string, string> = { planlandi: "planlandı", tamamlandi: "tamamlandı", iptal: "iptal" };

const DURUM_VAZIAN: Record<string, "gold" | "teal" | "brick"> = {
  planlandi: "gold",
  tamamlandi: "teal",
  iptal: "brick",
};

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function GorusmeYonetimi() {
  const { toast, show } = useToast();
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

  async function handleGorusmeEkle(e: React.FormEvent) {
    e.preventDefault();
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
      show("Görüşme planlandı ✓");
    } finally {
      setGKaydediliyor(false);
    }
  }

  async function handleOdemeEkle(e: React.FormEvent) {
    e.preventDefault();
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
      show("Ödeme kaydedildi ✓");
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

  if (ogrenciler.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {toast}
        <h1 className="page-title">Görüşme & Ödeme</h1>
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
        <h1 className="page-title">Görüşme & Ödeme</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Velilerle görüşmeleri planlayın, tahsilatları takip edin</p>
      </div>

      <Tabs tabs={["Görüşmeler", "Ödemeler"]} active={sekme === "gorusmeler" ? "Görüşmeler" : "Ödemeler"} onChange={(t) => setSekme(t === "Görüşmeler" ? "gorusmeler" : "odemeler")} />

      {sekme === "gorusmeler" ? (
        <>
          <Card>
            <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Yeni Görüşme</h3>
            <form onSubmit={handleGorusmeEkle} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 2fr", gap: 10 }}>
              <FormGroup>
                <Label>Öğrenci *</Label>
                <Select value={gOgrenciId} onChange={(e) => setGOgrenciId(e.target.value)}>
                  {ogrenciler.map((o) => (
                    <option key={o.id} value={o.id}>{o.ad_soyad}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Katılımcı</Label>
                <Select value={gKatilimci} onChange={(e) => setGKatilimci(e.target.value)}>
                  <option value="ogrenci">Öğrenci</option>
                  <option value="veli">Veli</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Tarih-Saat *</Label>
                <Input type="datetime-local" value={gTarih} onChange={(e) => setGTarih(e.target.value)} required />
              </FormGroup>
              <FormGroup>
                <Label>Konu *</Label>
                <Input placeholder="Görüşme konusu" value={gBaslik} onChange={(e) => setGBaslik(e.target.value)} required />
              </FormGroup>
              <FormGroup style={{ gridColumn: "1/-1" }}>
                <Label>Not</Label>
                <Textarea placeholder="Opsiyonel not" value={gNotlar} onChange={(e) => setGNotlar(e.target.value)} style={{ minHeight: 48 }} />
              </FormGroup>
              <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end" }}>
                <Btn variant="primary" type="submit" disabled={gKaydediliyor}>
                  {gKaydediliyor ? "…" : "Görüşmeyi Planla"}
                </Btn>
              </div>
            </form>
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Görüşmeler</h3>
            {gorusmeler.length === 0 ? (
              <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Henüz görüşme yok.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {gorusmeler.map((m) => (
                  <div key={m.id} style={{ display: "flex", gap: 12, padding: "12px", borderRadius: 8, background: "rgba(15,27,45,0.02)", border: "1px solid rgba(15,27,45,0.07)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{ogrenciAdi.get(m.ogrenci_id) ?? "Öğrenci"}</span>
                        <Badge variant="gray">{m.katilimci === "veli" ? "Veli" : "Öğrenci"}</Badge>
                        <Badge variant={DURUM_VAZIAN[m.durum] ?? "gold"}>{DURUM_ETIKET[m.durum] ?? m.durum}</Badge>
                      </div>
                      <p style={{ fontSize: 13, color: "#0F1B2D" }}>{m.baslik}</p>
                      <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)" }}>
                        {new Date(m.tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {m.notlar && <p style={{ fontSize: 12, color: "rgba(15,27,45,0.6)", marginTop: 4, whiteSpace: "pre-wrap" }}>{m.notlar}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                      {m.durum === "planlandi" && (
                        <>
                          <Btn variant="ghost" size="sm" onClick={() => gorusmeDurumunaGec(m, "tamamlandi")}>Tamamlandı</Btn>
                          <Btn variant="danger" size="sm" onClick={() => gorusmeDurumunaGec(m, "iptal")}>İptal</Btn>
                        </>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => gorusmeSil(m.id)} title="Görüşmeyi sil"><Icon name="trash" size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : (
        <>
          <div className="grid-2">
            <Card>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 4 }}>Toplam Tahsilat</p>
              <p className="metric-value" style={{ fontSize: 32, fontWeight: 700 }}>₺{toplam.toLocaleString("tr-TR")}</p>
            </Card>
            <Card>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 4 }}>Ödenen</p>
              <p className="metric-value" style={{ fontSize: 32, fontWeight: 700, color: "#2A9D8F" }}>₺{odenen.toLocaleString("tr-TR")}</p>
            </Card>
          </div>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Yeni Ödeme</h3>
            <form onSubmit={handleOdemeEkle} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr auto", gap: 10, alignItems: "flex-end" }}>
              <FormGroup>
                <Label>Öğrenci *</Label>
                <Select value={oOgrenciId} onChange={(e) => setOOgrenciId(e.target.value)}>
                  {ogrenciler.map((o) => (
                    <option key={o.id} value={o.id}>{o.ad_soyad}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Tutar *</Label>
                <Input type="number" min={0} placeholder="1500" value={oTutar} onChange={(e) => setOTutar(e.target.value)} required />
              </FormGroup>
              <FormGroup>
                <Label>Tarih</Label>
                <Input type="date" value={oTarih} onChange={(e) => setOTarih(e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>Açıklama</Label>
                <Input placeholder="Ocak ayı" value={oAciklama} onChange={(e) => setOAciklama(e.target.value)} />
              </FormGroup>
              <Btn variant="primary" type="submit" size="sm" disabled={oKaydediliyor}>
                {oKaydediliyor ? "…" : "Kaydet"}
              </Btn>
            </form>
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Ödemeler</h3>
            {odemeler.length === 0 ? (
              <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Henüz ödeme kaydı yok.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Öğrenci</th>
                    <th>Tutar</th>
                    <th>Tarih</th>
                    <th>Açıklama</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {odemeler.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Checkbox checked={p.odendi} onChange={() => odemeOdendiDegistir(p)} />
                      </td>
                      <td style={{ fontWeight: 500, textDecoration: p.odendi ? "line-through" : "none", opacity: p.odendi ? 0.6 : 1 }}>
                        {ogrenciAdi.get(p.ogrenci_id) ?? "Öğrenci"}
                      </td>
                      <td className="tabular" style={{ fontWeight: 700 }}>₺{Number(p.tutar).toLocaleString("tr-TR")}</td>
                      <td style={{ fontSize: 12, color: "rgba(15,27,45,0.5)" }}>{p.tarih}</td>
                      <td style={{ fontSize: 12, color: "rgba(15,27,45,0.6)" }}>{p.aciklama}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => odemeSil(p.id)} title="Ödemeyi sil"><Icon name="trash" size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
