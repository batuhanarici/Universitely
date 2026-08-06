import { useEffect, useMemo, useState } from "react";
import { kendiSonuclariniGetir, type SonucDetay } from "../../lib/ogrenciQueries";
import { denemeleriGetir } from "../../lib/denemeQueries";
import type { DenemeTuru } from "../../types/database";
import { Card, Badge, Btn } from "../../components/ui";
import { csvIndir } from "../../lib/exportUtils";

const TURLER: { deger: DenemeTuru; etiket: string }[] = [
  { deger: "tyt", etiket: "TYT" },
  { deger: "ayt", etiket: "AYT" },
  { deger: "brans", etiket: "Branş" },
];

const badgeVariant: Record<string, "gold" | "teal" | "gray"> = { tyt: "gold", ayt: "teal", brans: "gray" };

interface DenemeOzet {
  id: string;
  deneme_adi: string;
  ders_adi: string;
  tarih: string;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
}

function formatTarih(tarih: string): string {
  return new Date(tarih + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

export default function Denemeler() {
  const [sonuclar, setSonuclar] = useState<SonucDetay[]>([]);
  const [turHarita, setTurHarita] = useState<Map<string, DenemeTuru>>(new Map());
  const [filtre, setFiltre] = useState<DenemeTuru | "tumu">("tumu");
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([kendiSonuclariniGetir(), denemeleriGetir()])
      .then(([s, d]) => {
        const turMap = new Map<string, DenemeTuru>();
        for (const den of d) {
          if (den.tur) turMap.set(den.id, den.tur);
        }
        setSonuclar(s);
        setTurHarita(turMap);
      })
      .catch(() => {
        kendiSonuclariniGetir().then(setSonuclar).catch(() => {});
      })
      .finally(() => setYukleniyor(false));
  }, []);

  const denemeOzetleri = useMemo(() => {
    const map = new Map<string, DenemeOzet>();
    for (const s of sonuclar) {
      if (!map.has(s.deneme_id)) {
        map.set(s.deneme_id, {
          id: s.deneme_id,
          deneme_adi: s.deneme_adi,
          ders_adi: s.ders_adi,
          tarih: s.tarih,
          dogru: 0, yanlis: 0, bos: 0, net: 0,
        });
      }
      const ozet = map.get(s.deneme_id)!;
      if (s.durum === "dogru") ozet.dogru++;
      else if (s.durum === "yanlis") ozet.yanlis++;
      else ozet.bos++;
    }
    const list = Array.from(map.values());
    for (const o of list) o.net = Math.round((o.dogru - o.yanlis / 4) * 10) / 10;
    return list.sort((a, b) => b.tarih.localeCompare(a.tarih));
  }, [sonuclar]);

  const gorunenler = useMemo(() => {
    return denemeOzetleri.filter((o) => {
      const t = turHarita.get(o.id) ?? null;
      return filtre === "tumu" || t === filtre;
    });
  }, [denemeOzetleri, turHarita, filtre]);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  function csvIndirTikla() {
    const satirlar: (string | number)[][] = [["Deneme", "Tür", "Ders", "Tarih", "Doğru", "Yanlış", "Boş", "Net"]];
    for (const o of gorunenler) {
      satirlar.push([o.deneme_adi, turHarita.get(o.id) ?? "", o.ders_adi, o.tarih, o.dogru, o.yanlis, o.bos, o.net]);
    }
    csvIndir("denemeler", satirlar);
  }

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">Denemeler</h1>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Tüm deneme sonuçları</p>
        </div>
        {gorunenler.length > 0 && (
          <Btn variant="ghost" size="sm" onClick={csvIndirTikla}>CSV İndir</Btn>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setFiltre("tumu")}
          style={{
            padding: "6px 14px", borderRadius: 8,
            border: filtre === "tumu" ? "1.5px solid #E4BB60" : "1.5px solid rgba(15,27,45,0.15)",
            background: filtre === "tumu" ? "rgba(228,187,96,0.12)" : "transparent",
            fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
            color: filtre === "tumu" ? "#A07C20" : "#0F1B2D", cursor: "pointer",
          }}
        >
          Tümü
        </button>
        {TURLER.map((t) => (
          <button
            key={t.deger}
            onClick={() => setFiltre(t.deger)}
            style={{
              padding: "6px 14px", borderRadius: 8,
              border: filtre === t.deger ? "1.5px solid #E4BB60" : "1.5px solid rgba(15,27,45,0.15)",
              background: filtre === t.deger ? "rgba(228,187,96,0.12)" : "transparent",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
              color: filtre === t.deger ? "#A07C20" : "#0F1B2D", cursor: "pointer",
            }}
          >
            {t.etiket}
          </button>
        ))}
      </div>

      <Card>
        {gorunenler.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)", fontStyle: "italic" }}>
            {denemeOzetleri.length === 0 ? "Henüz deneme sonucu girilmemiş — öğretmenin sonuç girince burada görünecek." : "Bu filtrede deneme yok."}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Deneme</th><th>Tür</th><th>Ders</th><th>Tarih</th><th>D</th><th>Y</th><th>B</th><th>Net</th></tr>
            </thead>
            <tbody>
              {gorunenler.map((o) => {
                const tur = turHarita.get(o.id);
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 500 }}>{o.deneme_adi}</td>
                    <td>{tur ? <Badge variant={badgeVariant[tur] || "gray"}>{tur.toUpperCase()}</Badge> : "—"}</td>
                    <td style={{ fontSize: 12, color: "rgba(15,27,45,0.6)" }}>{o.ders_adi}</td>
                    <td style={{ fontSize: 12, color: "rgba(15,27,45,0.6)" }}>{formatTarih(o.tarih)}</td>
                    <td className="tabular" style={{ color: "#2A9D8F", fontWeight: 600 }}>{o.dogru}</td>
                    <td className="tabular" style={{ color: "#C4503A", fontWeight: 600 }}>{o.yanlis}</td>
                    <td className="tabular" style={{ color: "#9A9FA8", fontWeight: 600 }}>{o.bos}</td>
                    <td>
                      <span className="metric-value" style={{ fontSize: 18, fontWeight: 700, color: "#0F1B2D" }}>{o.net}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
