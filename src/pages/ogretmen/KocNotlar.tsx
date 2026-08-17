import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { kocNotlariniGetir, kocNotEkle, kocNotSil } from "../../lib/kocAraclariQueries";
import type { KocNot } from "../../types/database";
import { subeleriGetir, subeyeGoreFiltrele, type Sube } from "../../lib/subeQueries";
import { Card, Select, Textarea, Btn, Badge, Label, FormGroup, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";

const ONEMLER: { deger: string; etiket: string }[] = [
  { deger: "dusuk", etiket: "Düşük" },
  { deger: "normal", etiket: "Normal" },
  { deger: "yuksek", etiket: "Yüksek" },
];

const ONEM_VAZIAN: Record<string, "gray" | "gold" | "brick"> = { dusuk: "gray", normal: "gold", yuksek: "brick" };

const ONEM_RENK: Record<string, string> = { yuksek: "#C4503A", normal: "#E4BB60", dusuk: "#9A9FA8" };

export default function KocNotlar() {
  const { toast, show } = useToast();
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [subeler, setSubeler] = useState<Sube[]>([]);
  const [seciliSubeId, setSeciliSubeId] = useState("");
  const [ogrenciId, setOgrenciId] = useState("");
  const [notlar, setNotlar] = useState<KocNot[]>([]);
  const [metin, setMetin] = useState("");
  const [onem, setOnem] = useState("normal");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

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
      setNotlar([]);
      return;
    }
    kocNotlariniGetir(ogrenciId).then(setNotlar).catch(() => {});
  }, [ogrenciId]);

  async function handleEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!ogrenciId || !metin.trim()) return;
    setKaydediliyor(true);
    try {
      const yeni = await kocNotEkle(ogrenciId, metin.trim(), onem);
      setNotlar((n) => [yeni, ...n]);
      setMetin("");
      setOnem("normal");
      show("Not kaydedildi ✓");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function handleSil(id: string) {
    setNotlar((n) => n.filter((x) => x.id !== id));
    await kocNotSil(id);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  if (ogrenciler.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {toast}
        <h1 className="page-title">Koç Notları</h1>
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
        <h1 className="page-title">Koç Notları</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrenciler hakkında özel notlar tutun</p>
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
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Not Ekle</h3>
        <form onSubmit={handleEkle} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Textarea placeholder="Not içeriği…" value={metin} onChange={(e) => setMetin(e.target.value)} required style={{ minHeight: 72 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <FormGroup>
              <Label>Önem</Label>
              <Select value={onem} onChange={(e) => setOnem(e.target.value)} style={{ maxWidth: 140 }}>
                {ONEMLER.map((o) => (
                  <option key={o.deger} value={o.deger}>{o.etiket}</option>
                ))}
              </Select>
            </FormGroup>
            <Btn variant="primary" type="submit" disabled={kaydediliyor || !metin.trim()}>
              {kaydediliyor ? "…" : "Kaydet"}
            </Btn>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Notlar</h3>
        {notlar.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Bu öğrenci için not yok.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notlar.map((n) => (
              <div key={n.id} style={{ display: "flex", gap: 12, padding: "12px", borderRadius: 8, background: "rgba(15,27,45,0.02)", border: "1px solid rgba(15,27,45,0.07)", borderLeft: `3px solid ${ONEM_RENK[n.onem] ?? "#9A9FA8"}` }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "#0F1B2D", whiteSpace: "pre-wrap" }}>{n.not_metni}</p>
                  <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <Badge variant={ONEM_VAZIAN[n.onem] ?? "gray"}>{ONEMLER.find((o) => o.deger === n.onem)?.etiket ?? n.onem}</Badge>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleSil(n.id)} title="Notu sil"><Icon name="trash" size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
