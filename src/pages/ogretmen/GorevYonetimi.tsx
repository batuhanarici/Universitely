import { useEffect, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { ogrenciGorevleriGetir, gorevAta, gorevSil, gorevKontrolEt, gorevGeriBildirimYaz } from "../../lib/gorevQueries";
import type { Gorev } from "../../types/database";
import { Card, Select, Input, Label, FormGroup, Btn, Badge, Checkbox, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const TIP_ETIKET: Record<string, string> = { gunluk: "günlük", haftalik: "haftalık", koc: "koç" };

export default function GorevYonetimi() {
  const { toast, show } = useToast();
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [ogrenciId, setOgrenciId] = useState("");
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [baslik, setBaslik] = useState("");
  const [tarih, setTarih] = useState(bugunIso());
  const [geriBildirimler, setGeriBildirimler] = useState<Record<string, string>>({});
  const [kaydediliyor, setKaydediliyor] = useState<Record<string, boolean>>({});
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    kocOgrencileri()
      .then((o) => {
        setOgrenciler(o);
        if (o.length > 0) setOgrenciId(o[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  async function gorevleriTazele() {
    if (!ogrenciId) return;
    const g = await ogrenciGorevleriGetir(ogrenciId);
    setGorevler(g);
    const taslak: Record<string, string> = {};
    for (const x of g) taslak[x.id] = x.geri_bildirim ?? "";
    setGeriBildirimler(taslak);
  }

  useEffect(() => {
    if (!ogrenciId) {
      setGorevler([]);
      return;
    }
    gorevleriTazele().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ogrenciId]);

  async function handleAta() {
    if (!ogrenciId || !baslik.trim()) return;
    await gorevAta(ogrenciId, baslik.trim(), tarih);
    setBaslik("");
    await gorevleriTazele();
    show("Görev atandı ✓");
  }

  async function toggleKontrol(g: Gorev) {
    const yeniDurum = !g.kontrol_edildi;
    setGorevler((gs) => gs.map((x) => (x.id === g.id ? { ...x, kontrol_edildi: yeniDurum } : x)));
    await gorevKontrolEt(g.id, yeniDurum);
    show("Onaylandı ✓");
  }

  async function geriBildirimiKaydet(g: Gorev) {
    const metin = (geriBildirimler[g.id] ?? "").trim();
    setKaydediliyor((k) => ({ ...k, [g.id]: true }));
    try {
      await gorevGeriBildirimYaz(g.id, metin);
      setGorevler((gs) => gs.map((x) => (x.id === g.id ? { ...x, geri_bildirim: metin || null } : x)));
    } finally {
      setKaydediliyor((k) => ({ ...k, [g.id]: false }));
    }
  }

  async function handleSil(id: string) {
    setGorevler((gs) => gs.filter((x) => x.id !== id));
    await gorevSil(id);
  }

  function durum(g: Gorev): { metin: string; variant: "gray" | "gold" | "teal" } {
    if (!g.tamamlandi) return { metin: "Bekliyor", variant: "gray" };
    if (!g.kontrol_edildi) return { metin: "Onay Bekliyor", variant: "gold" };
    return { metin: "Onaylandı", variant: "teal" };
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  if (ogrenciler.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {toast}
        <h1 className="page-title">Görev Yönetimi</h1>
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
        <h1 className="page-title">Görev Yönetimi</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Görev ata, onayla ve geri bildirim yaz</p>
      </div>

      <Card style={{ padding: "14px 20px" }}>
        <FormGroup>
          <Label>Öğrenci</Label>
          <Select value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)} style={{ maxWidth: 220 }}>
            {ogrenciler.map((o) => (
              <option key={o.id} value={o.id}>{o.ad_soyad}</option>
            ))}
          </Select>
        </FormGroup>
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Görev Ata</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleAta(); }} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <FormGroup style={{ flex: 1, minWidth: 200 }}>
            <Label>Açıklama *</Label>
            <Input placeholder="Görev açıklaması" value={baslik} onChange={(e) => setBaslik(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Tarih</Label>
            <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
          </FormGroup>
          <Btn variant="primary" type="submit" size="sm">Ata</Btn>
        </form>
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Görevler & Kontrol</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {gorevler.length === 0 && <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Bu öğrenciye görev atanmamış.</p>}
          {gorevler.map((g) => {
            const d = durum(g);
            return (
              <div key={g.id} className="card-sm" style={{ background: "rgba(15,27,45,0.02)", borderRadius: 8, border: "1px solid rgba(15,27,45,0.07)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, textDecoration: g.tamamlandi ? "line-through" : "none", opacity: g.tamamlandi ? 0.6 : 1 }}>{g.baslik}</p>
                    <p style={{ fontSize: 11, color: "rgba(15,27,45,0.45)" }}>{g.tarih} · {TIP_ETIKET[g.tip] ?? g.tip}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge variant={d.variant}>{d.metin}</Badge>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleSil(g.id)} title="Görevi sil"><Icon name="trash" size={13} /></button>
                  </div>
                </div>
                {g.tamamlandi && !g.kontrol_edildi && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                    <FormGroup style={{ flex: 1, minWidth: 200 }}>
                      <Label>Geri Bildirim</Label>
                      <Input placeholder="Harika iş! Devam et." value={geriBildirimler[g.id] ?? ""} onChange={(e) => setGeriBildirimler((fb) => ({ ...fb, [g.id]: e.target.value }))} />
                    </FormGroup>
                    <Btn variant="gold" size="sm" onClick={() => geriBildirimiKaydet(g)} disabled={kaydediliyor[g.id]}>
                      {kaydediliyor[g.id] ? "…" : "Kaydet"}
                    </Btn>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, paddingBottom: 8, cursor: "pointer" }}>
                      <Checkbox checked={g.kontrol_edildi} onChange={() => toggleKontrol(g)} />
                      Onayla
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
