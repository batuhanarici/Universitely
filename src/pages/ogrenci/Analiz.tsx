import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { kendiSonuclariniGetir, type SonucDetay } from "../../lib/ogrenciQueries";

const TEAL = "var(--dogru)";
const RUST = "var(--yanlis)";
const BOS = "var(--bos)";
const GOLD = "var(--gold-dim)";

interface KonuYanlis {
  konu_adi: string;
  yanlis: number;
  bos: number;
}

export default function Analiz() {
  const [sonuclar, setSonuclar] = useState<SonucDetay[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    kendiSonuclariniGetir().then(setSonuclar).catch(() => {}).finally(() => setYukleniyor(false));
  }, []);

  const netTrend = useMemo(() => {
    const map = new Map<string, { deneme_adi: string; tarih: string; dogru: number; yanlis: number }>();
    for (const s of sonuclar) {
      if (!map.has(s.deneme_id)) {
        map.set(s.deneme_id, { deneme_adi: s.deneme_adi, tarih: s.tarih, dogru: 0, yanlis: 0 });
      }
      const o = map.get(s.deneme_id)!;
      if (s.durum === "dogru") o.dogru++;
      else if (s.durum === "yanlis") o.yanlis++;
    }
    return Array.from(map.values())
      .sort((a, b) => a.tarih.localeCompare(b.tarih))
      .map((o) => ({ ...o, net: Math.round((o.dogru - o.yanlis / 4) * 10) / 10 }));
  }, [sonuclar]);

  const dersBazli = useMemo(() => {
    const map = new Map<string, { ders: string; dogru: number; yanlis: number; bos: number }>();
    for (const s of sonuclar) {
      if (!map.has(s.ders_adi)) map.set(s.ders_adi, { ders: s.ders_adi, dogru: 0, yanlis: 0, bos: 0 });
      const o = map.get(s.ders_adi)!;
      if (s.durum === "dogru") o.dogru++;
      else if (s.durum === "yanlis") o.yanlis++;
      else o.bos++;
    }
    return Array.from(map.values());
  }, [sonuclar]);

  const yanlisKonuDagilimi = useMemo(() => {
    const map = new Map<string, KonuYanlis>();
    for (const s of sonuclar) {
      if (s.durum === "dogru") continue;
      if (!map.has(s.konu_adi)) map.set(s.konu_adi, { konu_adi: s.konu_adi, yanlis: 0, bos: 0 });
      const o = map.get(s.konu_adi)!;
      if (s.durum === "yanlis") o.yanlis++;
      else o.bos++;
    }
    return Array.from(map.values())
      .sort((a, b) => b.yanlis + b.bos - (a.yanlis + a.bos))
      .slice(0, 10);
  }, [sonuclar]);

  const konuBazli = useMemo(() => {
    const map = new Map<string, { konu: string; dogru: number; toplam: number }>();
    for (const s of sonuclar) {
      if (!map.has(s.konu_adi)) map.set(s.konu_adi, { konu: s.konu_adi, dogru: 0, toplam: 0 });
      const o = map.get(s.konu_adi)!;
      o.toplam++;
      if (s.durum === "dogru") o.dogru++;
    }
    return Array.from(map.values()).map((o) => ({
      konu: o.konu,
      basari: o.toplam === 0 ? 0 : Math.round((o.dogru / o.toplam) * 100),
    })).sort((a, b) => a.basari - b.basari);
  }, [sonuclar]);

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Analiz</h1>

      {sonuclar.length === 0 ? (
        <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz sonuç girilmemiş — öğretmenin sonuç girince analizler burada görünecek.</p>
        </div>
      ) : (
        <>
          <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
            <h2 className="card-title">Net Trendi</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={netTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="deneme_adi" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip formatter={(v: any) => `${v} net`} />
                <Line type="monotone" dataKey="net" name="Net" stroke={GOLD} strokeWidth={2.5} dot={{ r: 4, fill: GOLD }} animationDuration={700} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
            <h2 className="card-title">Ders Bazlı Doğru / Yanlış / Boş</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dersBazli}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="ders" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="dogru" name="Doğru" stackId="a" fill={TEAL} animationDuration={700} />
                <Bar dataKey="yanlis" name="Yanlış" stackId="a" fill={RUST} animationDuration={700} />
                <Bar dataKey="bos" name="Boş" stackId="a" fill={BOS} radius={[3, 3, 0, 0]} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
            <h2 className="card-title">Konu Bazlı Başarı (zayıf → güçlü)</h2>
            {konuBazli.map((k, i) => (
              <div key={k.konu} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.04}s` }}>
                <span style={{ width: 130, fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{k.konu}</span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${k.basari}%`, background: k.basari < 55 ? RUST : k.basari >= 80 ? TEAL : GOLD }} />
                </div>
                <span className="mono" style={{ width: 42, textAlign: "right", fontSize: 13, color: "var(--muted)" }}>{k.basari}%</span>
              </div>
            ))}
          </div>

          <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.2s" }}>
            <h2 className="card-title">En Çok Yanlış Yapılan Konular</h2>
            {yanlisKonuDagilimi.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Yanlış/boş soru yok, bravo!</p>}
            {yanlisKonuDagilimi.map((k, i) => (
              <div key={k.konu_adi} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.25 + i * 0.04}s` }}>
                <span style={{ flex: 1, fontSize: 13.5, color: "var(--ink)" }}>{k.konu_adi}</span>
                <span className="mono" style={{ fontSize: 12.5, color: "var(--yanlis)" }}>{k.yanlis}Y</span>
                <span className="mono" style={{ fontSize: 12.5, color: "var(--bos)" }}>{k.bos}B</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
