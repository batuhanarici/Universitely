import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { gorusmeleriGetir, gorusmeEkle, gorusmeDurumGuncelle, gorusmeSil } from "../../lib/kocAraclariQueries";
import type { Gorusme } from "../../types/database";
import { subeleriGetir, subeyeGoreFiltrele, type Sube } from "../../lib/subeQueries";
import { Card, Select, Input, Textarea, Btn, Badge, Label, FormGroup, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";

const DURUM_ETIKET: Record<string, string> = { planlandi: "planlandı", tamamlandi: "tamamlandı", iptal: "iptal" };

const DURUM_VAZIAN: Record<string, "gold" | "teal" | "brick"> = {
  planlandi: "gold",
  tamamlandi: "teal",
  iptal: "brick",
};

export default function GorusmeYonetimi() {
  const { toast, show } = useToast();
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [subeler, setSubeler] = useState<Sube[]>([]);
  const [seciliSubeId, setSeciliSubeId] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);

  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);
  const [gOgrenciId, setGOgrenciId] = useState("");
  const [gKatilimci, setGKatilimci] = useState("ogrenci");
  const [gBaslik, setGBaslik] = useState("");
  const [gTarih, setGTarih] = useState("");
  const [gNotlar, setGNotlar] = useState("");
  const [gKaydediliyor, setGKaydediliyor] = useState(false);

  useEffect(() => {
    Promise.all([kocOgrencileri(), gorusmeleriGetir(), subeleriGetir()])
      .then(([o, g, s]) => {
        setOgrenciler(o);
        setGorusmeler(g);
        setSubeler(s);
        if (o.length > 0) setGOgrenciId(o[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const filtreliOgrenciler = useMemo(() => subeyeGoreFiltrele(ogrenciler, seciliSubeId), [ogrenciler, seciliSubeId]);

  useEffect(() => {
    if (filtreliOgrenciler.length === 0) return;
    if (!filtreliOgrenciler.some((o) => o.id === gOgrenciId)) {
      setGOgrenciId(filtreliOgrenciler[0].id);
    }
  }, [filtreliOgrenciler, gOgrenciId]);

  const ogrenciAdi = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of ogrenciler) map.set(o.id, o.ad_soyad);
    return map;
  }, [ogrenciler]);

  const subeHaritasi = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const o of ogrenciler) map.set(o.id, o.sube_id);
    return map;
  }, [ogrenciler]);

  const filtreliGorusmeler = useMemo(() => {
    if (!seciliSubeId) return gorusmeler;
    return gorusmeler.filter((g) => subeHaritasi.get(g.ogrenci_id) === seciliSubeId);
  }, [gorusmeler, subeHaritasi, seciliSubeId]);

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

  async function gorusmeDurumunaGec(g: Gorusme, durum: string) {
    setGorusmeler((gs) => gs.map((x) => (x.id === g.id ? { ...x, durum } : x)));
    await gorusmeDurumGuncelle(g.id, durum);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  if (ogrenciler.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {toast}
        <h1 className="page-title">Görüşmeler</h1>
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
        <h1 className="page-title">Görüşmeler</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Velilerle ve öğrencilerle görüşmeleri planlayın</p>
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Yeni Görüşme</h3>
        <form onSubmit={handleGorusmeEkle} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 2fr", gap: 10 }}>
          <FormGroup>
            <Label>Öğrenci *</Label>
            <Select value={gOgrenciId} onChange={(e) => setGOgrenciId(e.target.value)}>
              {filtreliOgrenciler.map((o) => (
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Görüşmeler</h3>
          {subeler.length > 0 && (
            <Select value={seciliSubeId} onChange={(e) => setSeciliSubeId(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="">Tüm Şubeler</option>
              {subeler.map((s) => (
                <option key={s.id} value={s.id}>{s.ad}</option>
              ))}
            </Select>
          )}
        </div>
        {filtreliGorusmeler.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Henüz görüşme yok.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtreliGorusmeler.map((m) => (
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
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => gorusmeSil(m.id)} title="Görüşmeyi sil"><Icon name="trash" size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
