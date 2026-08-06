import { useEffect, useMemo, useState } from "react";
import { konularVeDersler, konuIlerlemeleriGetir, konuIlerlemeIsaretle, type KonuDersBilgisi } from "../../lib/konuIlerlemeQueries";
import { kendiSonuclariniGetir, type SonucDetay } from "../../lib/ogrenciQueries";
import type { KonuIlerleme } from "../../types/database";
import { Card, Badge, ProgressBar, Checkbox, AnimatedNumber } from "../../components/ui";

function zayifKonuIdleri(sonuclar: SonucDetay[]): Set<string> {
  const map = new Map<string, { dogru: number; toplam: number }>();
  for (const s of sonuclar) {
    const mevcut = map.get(s.konu_id ?? "") ?? { dogru: 0, toplam: 0 };
    mevcut.toplam++;
    if (s.durum === "dogru") mevcut.dogru++;
    map.set(s.konu_id ?? "", mevcut);
  }
  const zayif = new Set<string>();
  for (const [id, deger] of map) {
    if (deger.toplam > 0 && (deger.dogru / deger.toplam) * 100 < 55) zayif.add(id);
  }
  return zayif;
}

function yuzde(a: number, b: number): number {
  return b === 0 ? 0 : Math.round((a / b) * 100);
}

export default function Konular() {
  const [konular, setKonular] = useState<KonuDersBilgisi[]>([]);
  const [ilerlemeler, setIlerlemeler] = useState<KonuIlerleme[]>([]);
  const [zayiflar, setZayiflar] = useState<Set<string>>(new Set());
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([konularVeDersler(), konuIlerlemeleriGetir(), kendiSonuclariniGetir()])
      .then(([k, i, s]) => {
        setKonular(k);
        setIlerlemeler(i);
        setZayiflar(zayifKonuIdleri(s));
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const ilerlemeHaritasi = useMemo(() => {
    const map = new Map<string, KonuIlerleme>();
    for (const i of ilerlemeler) map.set(i.konu_id, i);
    return map;
  }, [ilerlemeler]);

  async function toggle(konuId: string) {
    const mevcut = ilerlemeHaritasi.get(konuId);
    const yeniDurum = !mevcut?.tamamlandi;
    setIlerlemeler((iler) => {
      const kalan = iler.filter((x) => x.konu_id !== konuId);
      return yeniDurum
        ? [...kalan, { id: mevcut?.id ?? "", ogrenci_id: "", konu_id: konuId, tamamlandi: true, tamamlanma_tarihi: new Date().toISOString().slice(0, 10) }]
        : kalan;
    });
    await konuIlerlemeIsaretle(konuId, yeniDurum);
  }

  const dersGrubu = useMemo(() => {
    const map = new Map<string, KonuDersBilgisi[]>();
    for (const k of konular) {
      if (!map.has(k.ders_adi)) map.set(k.ders_adi, []);
      map.get(k.ders_adi)!.push(k);
    }
    return Array.from(map.entries());
  }, [konular]);

  const eksikler = useMemo(
    () => konular.filter((k) => !ilerlemeHaritasi.get(k.id)?.tamamlandi || zayiflar.has(k.id)),
    [konular, ilerlemeHaritasi, zayiflar]
  );
  const tamamlananSayisi = konular.filter((k) => ilerlemeHaritasi.get(k.id)?.tamamlandi).length;
  const ilerlemeYuzde = yuzde(tamamlananSayisi, konular.length);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Konular</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Konuları tamamlandı olarak işaretle</p>
      </div>

      <div className="card tape-accent" style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)" }}>Genel İlerleme</p>
          <span className="metric-value" style={{ fontSize: 48, fontWeight: 700, color: "#0F1B2D", lineHeight: 1 }}>
            <AnimatedNumber value={ilerlemeYuzde} />%
          </span>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.5)", marginTop: 4 }}>{tamamlananSayisi} / {konular.length} konu tamamlandı</p>
        </div>
        <div style={{ flex: 1 }}>
          <ProgressBar pct={ilerlemeYuzde} color="#2A9D8F" />
        </div>
      </div>

      {eksikler.length > 0 && (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Eksik / Ağırlık Verilmesi Gerekenler</h3>
          <div className="rule-lines" style={{ borderRadius: 8, overflow: "hidden" }}>
            {eksikler.map((k) => {
              const durum = ilerlemeHaritasi.get(k.id);
              return (
                <label key={k.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", cursor: "pointer" }}>
                  <Checkbox checked={!!durum?.tamamlandi} onChange={() => toggle(k.id)} />
                  <span style={{ flex: 1, fontSize: 13, textDecoration: durum?.tamamlandi ? "line-through" : "none", color: durum?.tamamlandi ? "rgba(15,27,45,0.35)" : "#0F1B2D" }}>
                    {durum?.tamamlandi ? "✓ " : ""}{k.ad}
                  </span>
                  <Badge variant="gray">{k.ders_adi}</Badge>
                  {zayiflar.has(k.id) && <Badge variant="brick">Zayıf</Badge>}
                </label>
              );
            })}
          </div>
        </Card>
      )}

      {konular.length === 0 && (
        <Card>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)", fontStyle: "italic" }}>
            Henüz konu tanımlanmamış — öğretmenin konu eklediğinde burada listelenecek.
          </p>
        </Card>
      )}

      {dersGrubu.map(([dersAdi, konularListesi]) => {
        const dersTamamlanan = konularListesi.filter((k) => ilerlemeHaritasi.get(k.id)?.tamamlandi).length;
        return (
          <Card key={dersAdi}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>{dersAdi}</h3>
              <span className="tabular" style={{ fontSize: 13, color: "rgba(15,27,45,0.5)" }}>{dersTamamlanan}/{konularListesi.length}</span>
            </div>
            <ProgressBar pct={yuzde(dersTamamlanan, konularListesi.length)} color="#E4BB60" />
            <div className="rule-lines" style={{ borderRadius: 8, overflow: "hidden", marginTop: 10 }}>
              {konularListesi.map((k) => {
                const durum = ilerlemeHaritasi.get(k.id);
                const zayif = zayiflar.has(k.id);
                return (
                  <label key={k.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", cursor: "pointer" }}>
                    <Checkbox checked={!!durum?.tamamlandi} onChange={() => toggle(k.id)} />
                    <span style={{ flex: 1, fontSize: 13, textDecoration: durum?.tamamlandi ? "line-through" : "none", color: durum?.tamamlandi ? "rgba(15,27,45,0.35)" : "#0F1B2D" }}>
                      {durum?.tamamlandi ? "✓ " : ""}{k.ad}
                    </span>
                    {zayif && <Badge variant="brick">Zayıf</Badge>}
                  </label>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
