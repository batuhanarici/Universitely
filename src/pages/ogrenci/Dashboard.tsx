import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  kendiSonuclariniGetir,
  kendiTekrarHavuzunuGetir,
  tekrarCozulduIsaretle,
  type SonucDetay,
  type TekrarKaydi,
} from "../../lib/ogrenciQueries";
import { gorevleriGetir } from "../../lib/gorevQueries";
import type { Gorev } from "../../types/database";
import AnimatedNumber from "../../components/AnimatedNumber";
import ProgressBar from "../../components/ProgressBar";
import UYArrow from "../../components/UYArrow";

const TEAL = "var(--dogru)";
const RUST = "var(--yanlis)";
const BOS = "var(--bos)";
const GOLD = "var(--gold-dim)";

interface KonuOzet {
  konu_adi: string;
  ders_adi: string;
  dogru: number;
  yanlis: number;
  bos: number;
}

function konulariOzetle(sonuclar: SonucDetay[]): KonuOzet[] {
  const map = new Map<string, KonuOzet>();
  for (const s of sonuclar) {
    if (!map.has(s.konu_adi)) {
      map.set(s.konu_adi, { konu_adi: s.konu_adi, ders_adi: s.ders_adi, dogru: 0, yanlis: 0, bos: 0 });
    }
    const ozet = map.get(s.konu_adi)!;
    if (s.durum === "dogru") ozet.dogru++;
    else if (s.durum === "yanlis") ozet.yanlis++;
    else ozet.bos++;
  }
  return Array.from(map.values());
}

function oranHesapla(o: KonuOzet) {
  const toplam = o.dogru + o.yanlis + o.bos;
  return toplam === 0 ? 0 : Math.round((o.dogru / toplam) * 100);
}

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function haftaBasiIso(): string {
  const d = new Date();
  const gun = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - gun);
  return d.toISOString().slice(0, 10);
}

function motivasyonMesaji(kalanTekrar: number, zayifKonular: KonuOzet[], sonNet: number, oncekiNet: number | null): string {
  if (kalanTekrar >= 5) return `Tekrar havuzunda ${kalanTekrar} soru bekliyor — bugün onları eritebilirsin.`;
  if (zayifKonular.length > 0) return `Zayıf görünen ${zayifKonular[0].konu_adi} konusuna bugün ağırlık verebilirsin.`;
  if (oncekiNet !== null && sonNet < oncekiNet) return "Netin biraz düştü, panik yok — küçük ve düzenli adımlarla toparlarsın.";
  return "Bugün de küçük bir adım at; düzen, büyük sıçramalardan güçlüdür.";
}

export default function Dashboard() {
  const [sonuclar, setSonuclar] = useState<SonucDetay[]>([]);
  const [havuz, setHavuz] = useState<TekrarKaydi[]>([]);
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([kendiSonuclariniGetir(), kendiTekrarHavuzunuGetir(), gorevleriGetir()])
      .then(([s, h, g]) => {
        setSonuclar(s);
        setHavuz(h);
        setGorevler(g);
      })
      .finally(() => setYukleniyor(false));
  }, []);

  const konuOzetleri = useMemo(() => konulariOzetle(sonuclar), [sonuclar]);
  const zayifKonular = useMemo(() => konuOzetleri.filter((o) => oranHesapla(o) < 55), [konuOzetleri]);

  const denemeBazliOzet = useMemo(() => {
    const map = new Map<string, { deneme_adi: string; tarih: string; dogru: number; yanlis: number; bos: number }>();
    for (const s of sonuclar) {
      if (!map.has(s.deneme_id)) {
        map.set(s.deneme_id, { deneme_adi: s.deneme_adi, tarih: s.tarih, dogru: 0, yanlis: 0, bos: 0 });
      }
      const o = map.get(s.deneme_id)!;
      if (s.durum === "dogru") o.dogru++;
      else if (s.durum === "yanlis") o.yanlis++;
      else o.bos++;
    }
    return Array.from(map.values()).sort((a, b) => a.tarih.localeCompare(b.tarih));
  }, [sonuclar]);

  const sonNet = useMemo(() => {
    if (denemeBazliOzet.length === 0) return 0;
    const son = denemeBazliOzet[denemeBazliOzet.length - 1];
    return Math.round((son.dogru - son.yanlis / 4) * 10) / 10;
  }, [denemeBazliOzet]);

  const oncekiNet = useMemo(() => {
    if (denemeBazliOzet.length < 2) return null;
    const onceki = denemeBazliOzet[denemeBazliOzet.length - 2];
    return Math.round((onceki.dogru - onceki.yanlis / 4) * 10) / 10;
  }, [denemeBazliOzet]);

  const bugun = bugunIso();
  const haftaBasi = haftaBasiIso();
  const bugunkuGorevler = useMemo(() => gorevler.filter((g) => g.tarih === bugun), [gorevler, bugun]);
  const haftalikGorevler = useMemo(
    () => gorevler.filter((g) => g.tarih >= haftaBasi && g.tarih <= bugun),
    [gorevler, haftaBasi, bugun]
  );

  const tamamlananBugun = bugunkuGorevler.filter((g) => g.tamamlandi).length;
  const tamamlanmaYuzdesi = bugunkuGorevler.length === 0
    ? 0
    : Math.round((tamamlananBugun / bugunkuGorevler.length) * 100);
  const haftalikTamamlanan = haftalikGorevler.filter((g) => g.tamamlandi).length;
  const haftalikYuzde = haftalikGorevler.length === 0
    ? 0
    : Math.round((haftalikTamamlanan / haftalikGorevler.length) * 100);

  async function toggleCozuldu(kayit: TekrarKaydi) {
    const yeniDurum = !kayit.cozuldu;
    setHavuz((h) => h.map((k) => (k.sonuc_id === kayit.sonuc_id ? { ...k, cozuldu: yeniDurum } : k)));
    await tekrarCozulduIsaretle(kayit.sonuc_id, yeniDurum);
  }

  if (yukleniyor) return <p style={{ textAlign: "center", marginTop: 80 }}>Yükleniyor…</p>;

  const kalanTekrar = havuz.filter((h) => !h.cozuldu).length;
  const yukseliyor = oncekiNet !== null && sonNet > oncekiNet;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="stagger-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 24, color: "var(--ink)" }}>Günlük</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--ink)", padding: "10px 16px", borderRadius: 12 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Son Net</p>
            <p className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--gold-glow)" }}>
              <AnimatedNumber value={sonNet} decimals={1} />
            </p>
          </div>
          {oncekiNet !== null && <UYArrow size={20} color={yukseliyor ? "var(--dogru)" : "var(--yanlis)"} float style={{ transform: yukseliyor ? "none" : "rotate(180deg)" }} />}
        </div>
      </div>

      <div className="card stagger-item" style={{ animationDelay: "0.05s", borderLeft: "4px solid var(--gold)" }}>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>Bugün</p>
        <p style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", fontStyle: "italic" }}>{motivasyonMesaji(kalanTekrar, zayifKonular, sonNet, oncekiNet)}</p>
      </div>

      <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 16, animationDelay: "0.1s" }}>
        <div className="card">
          <h2 className="card-title">Bugünün Yapılacakları</h2>
          {bugunkuGorevler.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bugün için görev yok.</p>}
          {bugunkuGorevler.slice(0, 5).map((g) => (
            <p key={g.id} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f2f2f2", textDecoration: g.tamamlandi ? "line-through" : "none", opacity: g.tamamlandi ? 0.45 : 1, color: "var(--ink)" }}>
              {g.baslik}
            </p>
          ))}
        </div>
        <div className="card">
          <h2 className="card-title">Tekrar Havuzu</h2>
          <p className="mono" style={{ fontSize: 30, fontWeight: 700, color: kalanTekrar > 0 ? "var(--yanlis)" : "var(--dogru)" }}>
            <AnimatedNumber value={kalanTekrar} />
          </p>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{kalanTekrar > 0 ? "soru tekrar edilmeyi bekliyor" : "havuz boş, bravo!"}</p>
        </div>
        <div className="card">
          <h2 className="card-title">Bugünkü Tamamlanma</h2>
          {bugunkuGorevler.length > 0 && (
            <p className="mono" style={{ fontSize: 30, fontWeight: 700, color: "var(--ink)" }}>
              <AnimatedNumber value={tamamlanmaYuzdesi} suffix="%" />
            </p>
          )}
          <ProgressBar oran={tamamlanmaYuzdesi} color={tamamlanmaYuzdesi >= 70 ? TEAL : GOLD} delay={200} />
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
            Haftalık hedef: <AnimatedNumber value={haftalikYuzde} suffix="%" /> ({haftalikTamamlanan}/{haftalikGorevler.length} görev)
          </p>
        </div>
      </div>

      {sonuclar.length === 0 ? (
        <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz sana ait bir deneme sonucu girilmemiş — öğretmenin sonuç girince grafikler burada görünecek.</p>
        </div>
      ) : (
        <>
          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
            <h2 className="card-title">Deneme Bazlı Doğru / Yanlış / Boş</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={denemeBazliOzet}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="deneme_adi" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="dogru" name="Doğru" stackId="a" fill={TEAL} animationDuration={800} />
                <Bar dataKey="yanlis" name="Yanlış" stackId="a" fill={RUST} animationDuration={800} />
                <Bar dataKey="bos" name="Boş" stackId="a" fill={BOS} radius={[3, 3, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.2s" }}>
            <h2 className="card-title">Konu Bazlı Performans</h2>
            {konuOzetleri.map((o, i) => {
              const oran = oranHesapla(o);
              const zayif = oran < 55;
              const renk = zayif ? RUST : oran >= 80 ? TEAL : GOLD;
              return (
                <div key={o.konu_adi} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.25 + i * 0.05}s` }}>
                  <div style={{ width: 110, fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{o.konu_adi}</div>
                  <ProgressBar oran={oran} color={renk} delay={i * 60} />
                  <div className="mono" style={{ width: 42, textAlign: "right", fontSize: 13, color: "var(--muted)" }}>
                    <AnimatedNumber value={oran} suffix="%" />
                  </div>
                  {zayif && <span className="badge-weak">Ağırlık ver</span>}
                </div>
              );
            })}
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.25s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <h2 className="card-title" style={{ marginBottom: 0 }}>Tekrar Havuzu</h2>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{kalanTekrar} soru bekliyor</span>
            </div>
            {havuz.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Tekrar edilecek soru yok.</p>}
            {havuz.map((k, i) => (
              <div key={k.sonuc_id} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.3 + i * 0.04}s` }}>
                <input type="checkbox" checked={k.cozuldu} onChange={() => toggleCozuldu(k)} style={{ accentColor: "var(--gold-dim)", width: 16, height: 16 }} />
                <div style={{ flex: 1, opacity: k.cozuldu ? 0.4 : 1, textDecoration: k.cozuldu ? "line-through" : "none", transition: "opacity 0.2s" }}>
                  <p style={{ fontSize: 13 }}>{k.deneme_adi} — Soru {k.soru_no}</p>
                  <p style={{ fontSize: 11, color: "var(--muted)" }}>{k.konu_adi} · {k.tarih}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
