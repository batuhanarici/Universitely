import { useEffect, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { ogrenciGorevleriGetir, gorevAta, gorevSil, gorevKontrolEt, gorevGeriBildirimYaz } from "../../lib/gorevQueries";
import type { Gorev } from "../../types/database";
import { Card, Select, Input, Btn, Checkbox, Badge } from "../../components/ui";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const TIP_ETIKET: Record<string, string> = { gunluk: "günlük", haftalik: "haftalık", koc: "koç" };

export default function GorevYonetimi() {
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
  }

  async function toggleKontrol(g: Gorev) {
    const yeniDurum = !g.kontrol_edildi;
    setGorevler((gs) => gs.map((x) => (x.id === g.id ? { ...x, kontrol_edildi: yeniDurum } : x)));
    await gorevKontrolEt(g.id, yeniDurum);
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
    if (!g.tamamlandi) return { metin: "bekliyor", variant: "gray" };
    if (!g.kontrol_edildi) return { metin: "onay bekliyor", variant: "gold" };
    return { metin: "onaylandı", variant: "teal" };
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Görev Yönetimi</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Görev ata, onayla ve geri bildirim yaz</p>
      </div>

      {ogrenciler.length === 0 ? (
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz öğrencin yok.</p>
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Öğrenci</h3>
            <Select style={{ width: "100%" }} value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)}>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </Select>
          </Card>

          <Card className="tape-accent">
            <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Görev Ata</h3>
            <Input style={{ width: "100%" }} value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Görev açıklaması" onKeyDown={(e) => e.key === "Enter" && handleAta()} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ flex: 1 }} />
              <Btn onClick={handleAta} disabled={!baslik.trim()}>Ata</Btn>
            </div>
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Görevler ve Kontrol</h3>
            {gorevler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Bu öğrencinin görevi yok.</p>}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {gorevler.map((g) => {
                const d = durum(g);
                return (
                  <div key={g.id} style={{ padding: "11px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 500, textDecoration: g.tamamlandi ? "line-through" : "none", opacity: g.tamamlandi ? 0.6 : 1 }}>
                          {g.baslik}
                        </p>
                        <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)", marginTop: 1 }}>
                          {g.tarih} · <Badge variant="gray">{TIP_ETIKET[g.tip] ?? g.tip}</Badge>
                          {g.tamamlandi && (
                            <Badge variant={d.variant} >· {d.metin}</Badge>
                          )}
                        </p>
                      </div>
                      <Btn variant="ghost" size="sm" onClick={() => handleSil(g.id)}>Sil</Btn>
                    </div>

                    {g.tamamlandi && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer" }}>
                          <Checkbox checked={g.kontrol_edildi} onChange={() => toggleKontrol(g)} />
                          Onayla
                        </label>
                        <Input
                          style={{ flex: 1, minWidth: 200 }}
                          placeholder="Geri bildirim…"
                          value={geriBildirimler[g.id] ?? ""}
                          onChange={(e) => setGeriBildirimler((gb) => ({ ...gb, [g.id]: e.target.value }))}
                        />
                        <Btn variant="gold" size="sm" onClick={() => geriBildirimiKaydet(g)} disabled={kaydediliyor[g.id]}>
                          {kaydediliyor[g.id] ? "…" : "Kaydet"}
                        </Btn>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
