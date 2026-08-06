import { useEffect, useMemo, useState } from "react";
import { kendiSonuclariniGetir, type SonucDetay } from "../../lib/ogrenciQueries";
import { denemeleriGetir } from "../../lib/denemeQueries";
import { csvIndir } from "../../lib/exportUtils";
import type { Deneme, DenemeTuru } from "../../types/database";
import { Card, Btn } from "../../components/ui";

interface DenemeOzet {
  id: string;
  ad: string;
  tarih: string;
  tur: DenemeTuru | null;
  sablon_adi: string;
  net: number;
  dersNet: Map<string, number>;
}

interface Grup {
  baslik: string;
  denemeler: DenemeOzet[];
}

export default function Karsilastirma() {
  const [sonuclar, setSonuclar] = useState<SonucDetay[]>([]);
  const [denemeler, setDenemeler] = useState<(Deneme & { sablon_adi: string })[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([kendiSonuclariniGetir(), denemeleriGetir()])
      .then(([s, d]) => {
        setSonuclar(s);
        setDenemeler(d);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const denemeHarita = useMemo(() => new Map(denemeler.map((d) => [d.id, d])), [denemeler]);

  const gruplar = useMemo<Grup[]>(() => {
    const map = new Map<string, DenemeOzet>();
    for (const s of sonuclar) {
      let o = map.get(s.deneme_id);
      if (!o) {
        const den = denemeHarita.get(s.deneme_id);
        o = {
          id: s.deneme_id,
          ad: s.deneme_adi,
          tarih: s.tarih,
          tur: den?.tur ?? null,
          sablon_adi: den?.sablon_adi ?? "—",
          net: 0,
          dersNet: new Map<string, number>(),
        };
        map.set(s.deneme_id, o);
      }
      const onceki = o.dersNet.get(s.ders_adi);
      if (onceki === undefined) {
        o.dersNet.set(s.ders_adi, s.durum === "dogru" ? 1 : s.durum === "yanlis" ? -0.25 : 0);
      } else {
        o.dersNet.set(s.ders_adi, onceki + (s.durum === "dogru" ? 1 : s.durum === "yanlis" ? -0.25 : 0));
      }
    }
    const ozetler = Array.from(map.values());
    for (const o of ozetler) {
      o.net = 0;
      for (const [ders, net] of o.dersNet) {
        o.dersNet.set(ders, Math.round(net * 10) / 10);
        o.net += net;
      }
      o.net = Math.round(o.net * 10) / 10;
      o.dersNet = new Map(o.dersNet);
    }
    const sablonMap = new Map<string, DenemeOzet[]>();
    for (const o of ozetler) {
      const key = o.sablon_adi;
      if (!sablonMap.has(key)) sablonMap.set(key, []);
      sablonMap.get(key)!.push(o);
    }
    return Array.from(sablonMap.entries())
      .map(([baslik, list]) => ({
        baslik,
        denemeler: list.sort((a, b) => a.tarih.localeCompare(b.tarih)),
      }))
      .filter((g) => g.denemeler.length >= 2);
  }, [sonuclar, denemeHarita]);

  const csvSatirlari = useMemo(() => {
    const satirlar: (string | number)[][] = [["Şablon", "Deneme", "Tarih", "Ders", "Net"]];
    for (const g of gruplar) {
      for (const o of g.denemeler) {
        for (const [ders, net] of o.dersNet) {
          satirlar.push([g.baslik, o.ad, o.tarih, ders, net]);
        }
        satirlar.push([g.baslik, o.ad, o.tarih, "TOPLAM", o.net]);
      }
    }
    return satirlar;
  }, [gruplar]);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">Karşılaştırma</h1>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Aynı şablon bazında ders net karşılaştırması</p>
        </div>
        {gruplar.length > 0 && (
          <Btn variant="ghost" size="sm" onClick={() => csvIndir("karsilastirma", csvSatirlari)}>CSV İndir</Btn>
        )}
      </div>

      {gruplar.length === 0 ? (
        <Card>
          <p style={{ fontSize: 14, color: "rgba(15,27,45,0.6)" }}>
            Aynı şablondan en az 2 deneme gereklidir. Öğretmenin aynı şablonla 2. denemeyi oluşturup sonuç girince burada ders bazlı net karşılaştırması görünecek.
          </p>
        </Card>
      ) : (
        gruplar.map((g) => {
          const enIyiIndex = g.denemeler.reduce((best, o, i) => (o.net > g.denemeler[best].net ? i : best), 0);
          const dersler: string[] = [];
          for (const o of g.denemeler) {
            for (const d of o.dersNet.keys()) {
              if (!dersler.includes(d)) dersler.push(d);
            }
          }
          return (
            <Card key={g.baslik} style={{ overflowX: "auto" }}>
              <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>{g.baslik}</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ders</th>
                    {g.denemeler.map((o, i) => (
                      <th key={o.id} style={{ color: i === enIyiIndex ? "#A07C20" : undefined }}>
                        {o.ad.split(" ").slice(-1)[0]} · {o.tarih.slice(5)}
                        {i === enIyiIndex && " 🏅"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dersler.map((ders) => (
                    <tr key={ders}>
                      <td style={{ fontWeight: 500 }}>{ders}</td>
                      {g.denemeler.map((o, i) => {
                        const net = o.dersNet.get(ders);
                        return (
                          <td key={o.id} className="tabular" style={{ background: i === enIyiIndex ? "rgba(228,187,96,0.06)" : undefined, fontWeight: 600, color: net === undefined ? "rgba(15,27,45,0.4)" : net < 0 ? "#C4503A" : "#0F1B2D" }}>
                            {net === undefined ? "—" : net}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700 }}>
                    <td>Toplam Net</td>
                    {g.denemeler.map((o, i) => (
                      <td key={o.id} className="tabular metric-value" style={{ fontSize: 18, background: i === enIyiIndex ? "rgba(228,187,96,0.08)" : undefined, color: i === enIyiIndex ? "#A07C20" : "#0F1B2D" }}>
                        {o.net}
                        {i === enIyiIndex && <span style={{ marginLeft: 4 }}>🏅</span>}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Card>
          );
        })
      )}

      {gruplar.length > 0 && (
        <p style={{ fontSize: 12, color: "rgba(15,27,45,0.4)" }}>
          🏅 ile en yüksek toplam net vurgulanır. Aynı şablondaki denemeler yan yana görünür.
        </p>
      )}
    </div>
  );
}
