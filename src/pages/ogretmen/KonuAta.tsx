import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { konularVeDersler, type KonuDersBilgisi } from "../../lib/konuIlerlemeQueries";
import { ogrenciKonuIlerlemeleriGetir, konuAta, konuAtamasiKaldir } from "../../lib/konuIlerlemeQueries";
import type { KonuIlerleme } from "../../types/database";
import { subeleriGetir, subeyeGoreFiltrele, type Sube } from "../../lib/subeQueries";
import { Card, Select, Btn, Badge, Label, FormGroup, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";

export default function KonuAta() {
  const { toast, show } = useToast();
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [subeler, setSubeler] = useState<Sube[]>([]);
  const [seciliSubeId, setSeciliSubeId] = useState("");
  const [ogrenciId, setOgrenciId] = useState("");
  const [konular, setKonular] = useState<KonuDersBilgisi[]>([]);
  const [ilerlemeler, setIlerlemeler] = useState<KonuIlerleme[]>([]);
  const [dersSecimi, setDersSecimi] = useState("");
  const [konuId, setKonuId] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([kocOgrencileri(), konularVeDersler(), subeleriGetir()])
      .then(([o, k, s]) => {
        setOgrenciler(o);
        setKonular(k);
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
    show("Konu atandı ✓");
  }

  async function handleKaldir(konuId2: string) {
    if (!ogrenciId) return;
    setIlerlemeler((il) => il.filter((x) => x.konu_id !== konuId2));
    await konuAtamasiKaldir(ogrenciId, konuId2);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  if (ogrenciler.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {toast}
        <h1 className="page-title">Konu Ata</h1>
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
        <h1 className="page-title">Konu Ata</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrencilere çalışacakları konuları atayın</p>
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
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Konu Ata</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <FormGroup style={{ minWidth: 160 }}>
            <Label>Ders</Label>
            <Select
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
          </FormGroup>
          <FormGroup style={{ flex: 1 }}>
            <Label>Konu</Label>
            <Select value={konuId} onChange={(e) => setKonuId(e.target.value)}>
              <option value="">Konu seç…</option>
              {seciliDersKonulari.map((k) => (
                <option key={k.id} value={k.id}>{k.ad}</option>
              ))}
            </Select>
          </FormGroup>
          <Btn variant="primary" onClick={handleAta} disabled={!konuId}>Ata</Btn>
        </div>
        {dersSecimi && seciliDersKonulari.length === 0 && (
          <p style={{ fontSize: 12, color: "rgba(15,27,45,0.45)", marginTop: 8 }}>Bu ders için Ders/Konu yönetiminden konu ekleyin.</p>
        )}
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Atanan Konular</h3>
        {ilerlemeler.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Konu atanmamış.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {ilerlemeler.map((il) => {
              const konu = konuHaritasi.get(il.konu_id);
              return (
                <div key={il.konu_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, textDecoration: il.tamamlandi ? "line-through" : "none", opacity: il.tamamlandi ? 0.6 : 1 }}>
                    {konu?.ad ?? "Bilinmeyen konu"}
                  </span>
                  <Badge variant="gray">{konu?.ders_adi ?? "—"}</Badge>
                  <Badge variant={il.tamamlandi ? "teal" : "gray"}>{il.tamamlandi ? "✓ Tamamlandı" : "Çalışılıyor"}</Badge>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleKaldir(il.konu_id)} title="Atamayı kaldır"><Icon name="trash" size={13} /></button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
