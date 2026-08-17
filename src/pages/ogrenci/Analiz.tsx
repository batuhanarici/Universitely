import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { kendiSonuclariniGetir, type SonucDetay } from "../../lib/ogrenciQueries";
import { yanlisKonuDagiliminiHesapla } from "../../lib/analizHesaplari";
import { Card } from "../../components/ui";

const TEAL = "#2A9D8F";
const RUST = "#C4503A";
const BOS = "#9A9FA8";
const GOLD = "#E4BB60";

const tt = { contentStyle: { background: "#0F1B2D", border: "none", borderRadius: 8, color: "#F4EFE4", fontSize: 12 } };

export default function Analiz() {
  const [sonuclar, setSonuclar] = useState<SonucDetay[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);

  const verileriYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata(false);
    try {
      setSonuclar(await kendiSonuclariniGetir());
    } catch {
      setHata(true);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void verileriYukle();
  }, [verileriYukle]);

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
      .map((o) => ({ name: o.deneme_adi, net: Math.round((o.dogru - o.yanlis / 4) * 10) / 10 }));
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

  const yanlisKonuDagilimi = useMemo(
    () => yanlisKonuDagiliminiHesapla(sonuclar),
    [sonuclar],
  );

  const konuBazli = useMemo(() => {
    const map = new Map<string, { konu: string; dogru: number; toplam: number }>();
    for (const s of sonuclar) {
      if (!map.has(s.konu_adi)) map.set(s.konu_adi, { konu: s.konu_adi, dogru: 0, toplam: 0 });
      const o = map.get(s.konu_adi)!;
      o.toplam++;
      if (s.durum === "dogru") o.dogru++;
    }
    return Array.from(map.values()).map((o) => ({
      name: o.konu,
      pct: o.toplam === 0 ? 0 : Math.round((o.dogru / o.toplam) * 100),
    })).sort((a, b) => a.pct - b.pct);
  }, [sonuclar]);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  if (hata) {
    return (
      <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 className="page-title">Analiz</h1>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Deneme performansı grafikleri</p>
        </div>
        <div className="card" role="alert" style={{ borderLeft: "4px solid #C4503A" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#C4503A", marginBottom: 6 }}>
            Analiz verileri yüklenemedi.
          </p>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", marginBottom: 14 }}>
            Bağlantını kontrol edip tekrar deneyebilirsin. Mevcut verilerin korunur.
          </p>
          <button className="btn btn-primary" type="button" onClick={() => void verileriYukle()}>
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Analiz</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Deneme performansı grafikleri</p>
      </div>

      {sonuclar.length === 0 ? (
        <Card>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)", fontStyle: "italic" }}>
            Henüz sonuç girilmemiş — öğretmenin sonuç girince analizler burada görünecek.
          </p>
        </Card>
      ) : (
        <>
          <Card className="tape-accent">
            <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Net Grafiği</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={netTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip {...tt} />
                <Line type="monotone" dataKey="net" name="Net" stroke={GOLD} strokeWidth={2.5} dot={{ r: 4, fill: GOLD, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} animationDuration={700} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Ders Bazlı D/Y/B</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dersBazli} barSize={20} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" />
                <XAxis dataKey="ders" tick={{ fontSize: 10, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="dogru" name="Doğru" fill={TEAL} radius={[2, 2, 0, 0]} animationDuration={700} />
                <Bar dataKey="yanlis" name="Yanlış" fill={RUST} radius={[2, 2, 0, 0]} animationDuration={700} />
                <Bar dataKey="bos" name="Boş" fill={BOS} radius={[2, 2, 0, 0]} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>En Çok Yanlış/Boş Yapılan Konular</h3>
            {yanlisKonuDagilimi.length === 0 ? (
              <p style={{ fontSize: 13, color: "#2A9D8F", fontWeight: 500 }}>Yanlış/boş soru yok, bravo! 🎉</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yanlisKonuDagilimi} layout="vertical" barSize={14} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#0F1B2D" }} axisLine={false} tickLine={false} />
                  <Tooltip {...tt} />
                  <Bar dataKey="yanlis" name="Yanlış" fill={RUST} radius={[0, 2, 2, 0]} animationDuration={700} />
                  <Bar dataKey="bos" name="Boş" fill={BOS} radius={[0, 2, 2, 0]} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Konu Bazlı Başarı Yüzdesi</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {konuBazli.map((k) => (
                <div key={k.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 80, fontSize: 12, fontWeight: 500, color: k.pct < 55 ? RUST : "#0F1B2D" }}>{k.name}</span>
                  <div style={{ flex: 1, height: 8, background: "rgba(15,27,45,0.07)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${k.pct}%`, background: k.pct < 55 ? RUST : TEAL, borderRadius: 4, transition: "width 700ms ease" }} />
                  </div>
                  <span className="tabular" style={{ fontSize: 13, fontWeight: 600, width: 40, textAlign: "right", color: k.pct < 55 ? RUST : TEAL }}>{k.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
