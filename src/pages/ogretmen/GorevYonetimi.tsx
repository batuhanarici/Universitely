import { useEffect, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { ogrenciGorevleriGetir, gorevAta, gorevSil, gorevKontrolEt, gorevGeriBildirimYaz } from "../../lib/gorevQueries";
import type { Gorev } from "../../types/database";

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

  function durum(g: Gorev): { metin: string; renk: string } {
    if (!g.tamamlandi) return { metin: "bekliyor", renk: "var(--muted)" };
    if (!g.kontrol_edildi) return { metin: "onay bekliyor", renk: "var(--gold-dim)" };
    return { metin: "onaylandı", renk: "var(--dogru)" };
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Görev Yönetimi</h1>

      {ogrenciler.length === 0 ? (
        <div className="card stagger-item">
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz öğrencin yok.</p>
        </div>
      ) : (
        <>
          <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
            <h2 className="card-title">Öğrenci</h2>
            <select className="input" style={{ width: "100%" }} value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)}>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </select>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
            <h2 className="card-title">Görev Ata</h2>
            <input className="input" style={{ width: "100%" }} value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Görev açıklaması" onKeyDown={(e) => e.key === "Enter" && handleAta()} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input className="input" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ flex: 1 }} />
              <button onClick={handleAta} disabled={!baslik.trim()} className="btn btn-primary">Ata</button>
            </div>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
            <h2 className="card-title">Görevler ve Kontrol</h2>
            {gorevler.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bu öğrencinin görevi yok.</p>}
            {gorevler.map((g, i) => {
              const d = durum(g);
              return (
                <div key={g.id} className="stagger-item" style={{ padding: "11px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.03}s` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", textDecoration: g.tamamlandi ? "line-through" : "none", opacity: g.tamamlandi ? 0.6 : 1 }}>
                        {g.baslik}
                      </p>
                      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                        {g.tarih} · <span className="chip" style={{ fontSize: 10.5 }}>{TIP_ETIKET[g.tip] ?? g.tip}</span>
                        {g.tamamlandi && (
                          <span style={{ color: d.renk, fontWeight: 600 }}> · {d.metin}</span>
                        )}
                      </p>
                    </div>
                    <button onClick={() => handleSil(g.id)} style={{ border: "none", background: "none", color: "var(--yanlis)", fontSize: 12 }}>Sil</button>
                  </div>

                  {g.tamamlandi && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink)", cursor: "pointer" }}>
                        <input type="checkbox" checked={g.kontrol_edildi} onChange={() => toggleKontrol(g)} style={{ accentColor: "var(--gold-dim)", width: 15, height: 15 }} />
                        Onayla
                      </label>
                      <input
                        className="input"
                        style={{ flex: 1, minWidth: 200 }}
                        placeholder="Geri bildirim…"
                        value={geriBildirimler[g.id] ?? ""}
                        onChange={(e) => setGeriBildirimler((gb) => ({ ...gb, [g.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => geriBildirimiKaydet(g)}
                        disabled={kaydediliyor[g.id]}
                        className="btn"
                        style={{ padding: "6px 12px", background: "var(--ink)", color: "var(--gold-glow)", fontSize: 12 }}
                      >
                        {kaydediliyor[g.id] ? "…" : "Kaydet"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
