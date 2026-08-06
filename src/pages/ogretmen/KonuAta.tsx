import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { konularVeDersler, type KonuDersBilgisi } from "../../lib/konuIlerlemeQueries";
import { ogrenciKonuIlerlemeleriGetir, konuAta, konuAtamasiKaldir } from "../../lib/konuIlerlemeQueries";
import type { KonuIlerleme } from "../../types/database";
import { Card, Select, Btn, Badge } from "../../components/ui";

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

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Konu Ata</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrencilere çalışacakları konuları atayın</p>
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
            <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Konu Ata</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Select
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
              </Select>
              <Select style={{ flex: 1, minWidth: 160 }} value={konuId} onChange={(e) => setKonuId(e.target.value)}>
                <option value="">Konu seç…</option>
                {seciliDersKonulari.map((k) => (
                  <option key={k.id} value={k.id}>{k.ad}</option>
                ))}
              </Select>
              <Btn onClick={handleAta} disabled={!konuId}>Ata</Btn>
            </div>
            {dersSecimi && seciliDersKonulari.length === 0 && (
              <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 12.5, marginTop: 8 }}>Bu derste henüz konu yok — "Ders / Konu Yönetimi"nden ekleyebilirsin.</p>
            )}
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Atanan Konular</h3>
            {ilerlemeler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Bu öğrenciye henüz konu atanmamış.</p>}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ilerlemeler.map((il) => {
                const konu = konuHaritasi.get(il.konu_id);
                return (
                  <div key={il.konu_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13.5, textDecoration: il.tamamlandi ? "line-through" : "none", opacity: il.tamamlandi ? 0.5 : 1 }}>
                        {konu?.ad ?? "Bilinmeyen konu"}
                      </p>
                      <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)" }}>{konu?.ders_adi ?? "—"}</p>
                    </div>
                    {il.tamamlandi ? (
                      <Badge variant="teal">✓ tamamlandı</Badge>
                    ) : (
                      <>
                        <span style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)" }}>çalışılıyor</span>
                        <Btn variant="ghost" size="sm" onClick={() => handleKaldir(il.konu_id)}>Kaldır</Btn>
                      </>
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
