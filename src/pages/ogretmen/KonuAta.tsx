import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { konularVeDersler, type KonuDersBilgisi } from "../../lib/konuIlerlemeQueries";
import { ogrenciKonuIlerlemeleriGetir, konuAta, konuAtamasiKaldir } from "../../lib/konuIlerlemeQueries";
import type { KonuIlerleme } from "../../types/database";

export default function KonuAta() {
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [ogrenciId, setOgrenciId] = useState("");
  const [konular, setKonular] = useState<KonuDersBilgisi[]>([]);
  const [ilerlemeler, setIlerlemeler] = useState<KonuIlerleme[]>([]);
  const [dersSecimi, setDersSecimi] = useState("");
  const [konuId, setKonuId] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([kocOgrencileri(), konularVeDersler()])
      .then(([o, k]) => {
        setOgrenciler(o);
        setKonular(k);
        if (o.length > 0) setOgrenciId(o[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    if (!ogrenciId) {
      setIlerlemeler([]);
      return;
    }
    ogrenciKonuIlerlemeleriGetir(ogrenciId).then(setIlerlemeler).catch(() => {});
  }, [ogrenciId]);

  const dersGrubu = useMemo(() => {
    const map = new Map<string, KonuDersBilgisi[]>();
    for (const k of konular) {
      if (!map.has(k.ders_adi)) map.set(k.ders_adi, []);
      map.get(k.ders_adi)!.push(k);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [konular]);

  const seciliDersKonulari = useMemo(
    () => dersGrubu.find(([ad]) => ad === dersSecimi)?.[1] ?? [],
    [dersGrubu, dersSecimi]
  );

  const konuHaritasi = useMemo(() => {
    const map = new Map<string, KonuDersBilgisi>();
    for (const k of konular) map.set(k.id, k);
    return map;
  }, [konular]);

  async function handleAta() {
    if (!ogrenciId || !konuId) return;
    await konuAta(ogrenciId, konuId);
    setKonuId("");
    setIlerlemeler(await ogrenciKonuIlerlemeleriGetir(ogrenciId));
  }

  async function handleKaldir(konuId2: string) {
    if (!ogrenciId) return;
    setIlerlemeler((il) => il.filter((x) => x.konu_id !== konuId2));
    await konuAtamasiKaldir(ogrenciId, konuId2);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Konu Ata</h1>

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
            <h2 className="card-title">Konu Atam</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                className="input"
                style={{ flex: 1, minWidth: 160 }}
                value={dersSecimi}
                onChange={(e) => {
                  setDersSecimi(e.target.value);
                  setKonuId("");
                }}
              >
                <option value="">Ders seç…</option>
                {dersGrubu.map(([ad]) => (
                  <option key={ad} value={ad}>{ad}</option>
                ))}
              </select>
              <select className="input" style={{ flex: 1, minWidth: 160 }} value={konuId} onChange={(e) => setKonuId(e.target.value)}>
                <option value="">Konu seç…</option>
                {seciliDersKonulari.map((k) => (
                  <option key={k.id} value={k.id}>{k.ad}</option>
                ))}
              </select>
              <button onClick={handleAta} disabled={!konuId} className="btn btn-primary">Ata</button>
            </div>
            {dersSecimi && seciliDersKonulari.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 8 }}>Bu derste henüz konu yok — "Ders / Konu Yönetimi"nden ekleyebilirsin.</p>
            )}
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
            <h2 className="card-title">Atanan Konular</h2>
            {ilerlemeler.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bu öğrenciye henüz konu atanmamış.</p>}
            {ilerlemeler.map((il, i) => {
              const konu = konuHaritasi.get(il.konu_id);
              return (
                <div key={il.konu_id} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.04}s` }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13.5, color: "var(--ink)", textDecoration: il.tamamlandi ? "line-through" : "none", opacity: il.tamamlandi ? 0.5 : 1 }}>
                      {konu?.ad ?? "Bilinmeyen konu"}
                    </p>
                    <p style={{ fontSize: 11.5, color: "var(--muted)" }}>{konu?.ders_adi ?? "—"}</p>
                  </div>
                  {il.tamamlandi ? (
                    <span style={{ fontSize: 11.5, color: "var(--dogru)", fontWeight: 600 }}>✓ tamamlandı</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 11.5, color: "var(--muted)" }}>çalışılıyor</span>
                      <button onClick={() => handleKaldir(il.konu_id)} style={{ border: "none", background: "none", color: "var(--yanlis)", fontSize: 12 }}>Kaldır</button>
                    </>
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
