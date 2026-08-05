import { useEffect, useMemo, useState } from "react";
import { kendiSonuclariniGetir, type SonucDetay } from "../../lib/ogrenciQueries";
import { denemeleriGetir } from "../../lib/denemeQueries";
import { csvIndir } from "../../lib/exportUtils";
import type { Deneme, DenemeTuru } from "../../types/database";

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

const GOLD = "var(--gold-dim)";

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

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="stagger-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 24, color: "var(--ink)" }}>Deneme Karşılaştırma</h1>
        {gruplar.length > 0 && (
          <button onClick={() => csvIndir("deneme_karsilastirma", csvSatirlari)} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)" }}>
            CSV indir
          </button>
        )}
      </div>

      {gruplar.length === 0 ? (
        <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Karşılaştırma için aynı şablondan en az 2 deneme gerekli. Öğretmenin aynı şablonla 2. denemeyi oluşturup sonuç girince burada ders bazlı net karşılaştırması görünecek.
          </p>
        </div>
      ) : (
        gruplar.map((g, gi) => {
          const enIyiIndex = g.denemeler.reduce((best, o, i) => (o.net > g.denemeler[best].net ? i : best), 0);
          const dersler: string[] = [];
          for (const o of g.denemeler) {
            for (const d of o.dersNet.keys()) {
              if (!dersler.includes(d)) dersler.push(d);
            }
          }
          return (
            <div key={gi} className="card stagger-item" style={{ marginBottom: 16, animationDelay: `${0.05 + gi * 0.05}s`, overflowX: "auto" }}>
              <h2 className="card-title">
                {g.baslik}
                <span className="mono" style={{ fontWeight: 400, fontSize: 12, color: "var(--muted)", marginLeft: 8 }}>{g.denemeler.length} deneme</span>
              </h2>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 420, marginTop: 8 }}>
                <thead>
                  <tr>
                    <th style={thStil}>Ders</th>
                    {g.denemeler.map((o, i) => (
                      <th key={o.id} style={{ ...thStil, background: i === enIyiIndex ? "rgba(228,187,96,0.18)" : "#f7f4ec" }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{o.ad}</div>
                        <div className="mono" style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)" }}>{o.tarih}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dersler.map((ders) => (
                    <tr key={ders}>
                      <td style={tdStil}>{ders}</td>
                      {g.denemeler.map((o) => {
                        const net = o.dersNet.get(ders);
                        return (
                          <td key={o.id} style={{ ...tdStil, textAlign: "center", color: net === undefined ? "var(--muted)" : net < 0 ? "var(--yanlis)" : "var(--ink)" }}>
                            {net === undefined ? "—" : net}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...tdStil, fontWeight: 700 }}>Toplam Net</td>
                    {g.denemeler.map((o, i) => (
                      <td key={o.id} style={{ ...tdStil, textAlign: "center", fontWeight: 700, color: i === enIyiIndex ? "#8a6a1f" : "var(--ink)", background: i === enIyiIndex ? "rgba(228,187,96,0.18)" : "transparent" }}>
                        {o.net}
                        {i === enIyiIndex && <span style={{ marginLeft: 4 }}>🏅</span>}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })
      )}
      {gruplar.length > 0 && (
        <p className="stagger-item mono" style={{ color: "var(--muted)", fontSize: 12, animationDelay: "0.3s" }}>
          🏅 ile en yüksek toplam net vurgulanır. Aynı şablondaki denemeler yan yana görünür.
        </p>
      )}
    </div>
  );
}

const thStil: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  fontSize: 13,
  color: "var(--ink)",
  borderBottom: "2px solid " + GOLD,
};
const tdStil: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 12.5,
  borderBottom: "1px solid #f2f2f2",
  color: "var(--ink)",
};
