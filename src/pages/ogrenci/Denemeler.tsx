import { useEffect, useMemo, useState } from "react";
import { kendiSonuclariniGetir, type SonucDetay } from "../../lib/ogrenciQueries";
import { denemeleriGetir } from "../../lib/denemeQueries";
import type { DenemeTuru } from "../../types/database";
import AnimatedNumber from "../../components/AnimatedNumber";
import { csvIndir } from "../../lib/exportUtils";

const TURLER: { deger: DenemeTuru; etiket: string }[] = [
  { deger: "tyt", etiket: "TYT" },
  { deger: "ayt", etiket: "AYT" },
  { deger: "brans", etiket: "Branş" },
];

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

  const turlerMevcut = useMemo(() => {
    const set = new Set<DenemeTuru>();
    for (const o of denemeOzetleri) {
      const t = turHarita.get(o.id);
      if (t) set.add(t);
    }
    return set;
  }, [denemeOzetleri, turHarita]);

  const gorunenler = useMemo(() => {
    return denemeOzetleri.filter((o) => {
      const t = turHarita.get(o.id) ?? null;
      return filtre === "tumu" || t === filtre;
    });
  }, [denemeOzetleri, turHarita, filtre]);

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  function csvIndirTikla() {
    const satirlar: (string | number)[][] = [["Deneme", "Ders", "Tarih", "Doğru", "Yanlış", "Boş", "Net"]];
    for (const o of gorunenler) {
      satirlar.push([o.deneme_adi, o.ders_adi, o.tarih, o.dogru, o.yanlis, o.bos, o.net]);
    }
    csvIndir("denemelerim", satirlar);
  }

  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      <div className="stagger-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 24, color: "var(--ink)" }}>Denemelerim</h1>
        {gorunenler.length > 0 && (
          <button onClick={csvIndirTikla} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)" }}>CSV indir</button>
        )}
      </div>

      {turlerMevcut.size > 0 && (
        <div className="stagger-item" style={{ display: "flex", gap: 6, marginBottom: 16, animationDelay: "0.05s" }}>
          <button onClick={() => setFiltre("tumu")} className={`chip${filtre === "tumu" ? " active" : ""}`}>Tümü</button>
          {TURLER.map((t) => turlerMevcut.has(t.deger) && (
            <button key={t.deger} onClick={() => setFiltre(t.deger)} className={`chip${filtre === t.deger ? " active" : ""}`}>{t.etiket}</button>
          ))}
        </div>
      )}

      <div className="card stagger-item" style={{ animationDelay: "0.1s" }}>
        {gorunenler.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bu filtrede deneme yok.</p>}
        {gorunenler.map((o, i) => (
          <div key={o.id} className="stagger-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.04}s` }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{o.deneme_adi}</p>
                {turHarita.get(o.id) && <span className="chip" style={{ padding: "1px 7px", fontSize: 10.5 }}>{turHarita.get(o.id)!.toUpperCase()}</span>}
              </div>
              <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{o.ders_adi} · {o.tarih} · {o.dogru}D {o.yanlis}Y {o.bos}B</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
                <AnimatedNumber value={o.net} decimals={1} />
              </p>
              <p style={{ fontSize: 10.5, color: "var(--muted)" }}>net</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
