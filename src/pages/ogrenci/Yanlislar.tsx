import { useToast } from "../../components/useToast";
import { useEffect, useMemo, useState } from "react";
import { yanlislariGetir, yanlisEkle, yanlisCozulduIsaretle, yanlisSil } from "../../lib/yanlisQueries";
import { konularVeDersler, type KonuDersBilgisi } from "../../lib/konuIlerlemeQueries";
import { tekrarPlanEkle } from "../../lib/tekrarPlanQueries";
import type { YanlisArsivi } from "../../types/database";
import { Card, Btn, Input, Label, FormGroup, Select, Checkbox, EmptyState, Badge } from "../../components/ui";
import { Icon } from "../../components/Icon";

export default function Yanlislar() {
  const { toast, show } = useToast();
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

  async function handleEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!aciklama.trim()) return;
    const yeni = await yanlisEkle({
      konu_id: konuId || null,
      kaynak_adi: kaynakAdi.trim() || null,
      sayfa_no: sayfaNo.trim() === "" ? null : Number(sayfaNo),
      soru_no: soruNo.trim() === "" ? null : Number(soruNo),
      aciklama: aciklama.trim() || null,
    });
    setKayitlar((k) => [yeni, ...k]);
    setKonuId("");
    setKaynakAdi("");
    setSayfaNo("");
    setSoruNo("");
    setAciklama("");
    show("Yanlış eklendi ✓");
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
    show("Tekrar planına eklendi ✓");
  }

  async function handleSil(id: string) {
    setKayitlar((ks) => ks.filter((x) => x.id !== id));
    await yanlisSil(id);
  }

  const cozulmeyenler = kayitlar.filter((k) => !k.cozuldu);
  const cozulenler = kayitlar.filter((k) => k.cozuldu);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Yanlışlar</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Yanlış soru arşivi ve tekrar planı</p>
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Yanlış Soru Ekle</h3>
        <form onSubmit={handleEkle} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
          <FormGroup>
            <Label>Açıklama *</Label>
            <Input placeholder="Fonksiyon tanımı ve özellikleri" value={aciklama} onChange={(e) => setAciklama(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Konu</Label>
            <Select value={konuId} onChange={(e) => setKonuId(e.target.value)}>
              <option value="">Seç…</option>
              {konular.map((k) => <option key={k.id} value={k.id}>{k.ad}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Kaynak</Label>
            <Input placeholder="Palme TYT" value={kaynakAdi} onChange={(e) => setKaynakAdi(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Sayfa</Label>
            <Input type="number" min={0} placeholder="142" value={sayfaNo} onChange={(e) => setSayfaNo(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Soru No</Label>
            <Input type="number" min={0} placeholder="12" value={soruNo} onChange={(e) => setSoruNo(e.target.value)} />
          </FormGroup>
          <Btn variant="primary" type="submit" size="sm"><Icon name="plus" size={14} /> Ekle</Btn>
        </form>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Çözülmeyenler</h3>
          <Badge variant="brick">{cozulmeyenler.length} bekliyor</Badge>
        </div>
        {cozulmeyenler.length === 0 ? (
          <EmptyState icon="✅" title="Tüm yanlışları çözdün!" desc="Harika iş! Yeni yanlışlar eklenince burada görünür." />
        ) : (
          <div className="rule-lines" style={{ borderRadius: 8, overflow: "hidden" }}>
            {cozulmeyenler.map((k) => {
              const konu = k.konu_id ? konuHaritasi.get(k.konu_id) : null;
              return (
                <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                  <Checkbox checked={false} onChange={() => toggleCozuldu(k)} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#0F1B2D", marginBottom: 2 }}>{k.aciklama || "Açıklamasız yanlış"}</p>
                    <p style={{ fontSize: 11, color: "rgba(15,27,45,0.45)" }}>
                      {konu && <>{konu.ad} · </>}{k.kaynak_adi && <>{k.kaynak_adi}</>}{k.sayfa_no != null && <> · s.{k.sayfa_no}</>}{k.soru_no != null && <> · s.{k.soru_no}</>} · {k.eklenme_tarihi}
                    </p>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => tekrarinaEkle(k)}>Tekrara Ekle</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleSil(k.id)}><Icon name="trash" size={13} /></button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {cozulenler.length > 0 && (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Çözülenler</h3>
          <div className="rule-lines" style={{ borderRadius: 8, overflow: "hidden" }}>
            {cozulenler.map((k) => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", opacity: 0.6 }}>
                <Checkbox checked onChange={() => toggleCozuldu(k)} />
                <p style={{ flex: 1, fontSize: 13, textDecoration: "line-through", color: "rgba(15,27,45,0.5)" }}>{k.aciklama || "Açıklamasız yanlış"}</p>
                <Badge variant="teal">Çözüldü ✓</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
