import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { sinifSonuclariniGetir, type SinifSonucSatiri } from "../../lib/sinifQueries";
import { denemeleriGetir } from "../../lib/denemeQueries";
import type { Deneme, DenemeTuru } from "../../types/database";
import { Card, Select, ProgressBar, Badge } from "../../components/ui";

type DenemeDetayli = Deneme & { sablon_adi: string };

const TEAL = "#2A9D8F";
const RUST = "#C4503A";
const BOS = "#B8B2A6";
const GOLD = "#E4BB60";
const INK = "#0F1B2D";

function net(dogru: number, yanlis: number): number {
  return Math.round((dogru - yanlis / 4) * 10) / 10;
}

interface OgrenciOzeti {
  ad: string;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
}

export default function SinifAnaliz() {
  const [satirlar, setSatirlar] = useState<SinifSonucSatiri[]>([]);
  const [denemeler, setDenemeler] = useState<DenemeDetayli[]>([]);
  const [turFiltre, setTurFiltre] = useState<string>("tumu");
  const [dersFiltre, setDersFiltre] = useState<string>("tumu");
  const [denemeFiltre, setDenemeFiltre] = useState<string>("tumu");
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([sinifSonuclariniGetir(), denemeleriGetir()])
      .then(([s, d]) => {
        setSatirlar(s);
        setDenemeler(d);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const denemeTurHaritasi = useMemo(() => {
    const map = new Map<string, DenemeTuru | null>();
    for (const d of denemeler) map.set(d.id, d.tur);
    return map;
  }, [denemeler]);

  const dersler = useMemo(() => {
    const set = new Set<string>();
    for (const s of satirlar) if (s.ders_adi) set.add(s.ders_adi);
    return Array.from(set).sort();
  }, [satirlar]);

  const filtreliSatirlar = useMemo(() => {
    return satirlar.filter((s) => {
      if (denemeFiltre !== "tumu" && s.deneme_id !== denemeFiltre) return false;
      if (turFiltre !== "tumu" && denemeTurHaritasi.get(s.deneme_id) !== turFiltre) return false;
      if (dersFiltre !== "tumu" && s.ders_adi !== dersFiltre) return false;
      return true;
    });
  }, [satirlar, denemeFiltre, turFiltre, dersFiltre, denemeTurHaritasi]);

  const ogrenciHaritasi = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of satirlar) map.set(s.ogrenci_id, s.ad_soyad);
    return map;
  }, [satirlar]);

  const ogrenciOzetleri = useMemo<OgrenciOzeti[]>(() => {
    const map = new Map<string, { ad: string; dogru: number; yanlis: number; bos: number }>();
    for (const s of filtreliSatirlar) {
      const o = map.get(s.ogrenci_id) ?? { ad: s.ad_soyad, dogru: 0, yanlis: 0, bos: 0 };
      if (s.durum === "dogru") o.dogru++;
      else if (s.durum === "yanlis") o.yanlis++;
      else o.bos++;
      map.set(s.ogrenci_id, o);
    }
    return Array.from(map.values())
      .map((o) => ({ ...o, net: net(o.dogru, o.yanlis) }))
      .sort((a, b) => b.net - a.net);
  }, [filtreliSatirlar]);

  const trend = useMemo(() => {
    const denemeList: { deneme_id: string; ad: string; tarih: string }[] = [];
    const denemeSet = new Set<string>();
    for (const s of filtreliSatirlar) {
      if (!denemeSet.has(s.deneme_id)) {
        denemeSet.add(s.deneme_id);
        denemeList.push({ deneme_id: s.deneme_id, ad: s.deneme_adi, tarih: s.tarih });
      }
    }
    denemeList.sort((a, b) => a.tarih.localeCompare(b.tarih));

    const ogrNetler = new Map<string, Map<string, { dogru: number; yanlis: number }>>();
    for (const s of filtreliSatirlar) {
      if (!ogrNetler.has(s.ogrenci_id)) ogrNetler.set(s.ogrenci_id, new Map());
      const denemelerOgr = ogrNetler.get(s.ogrenci_id)!;
      const d = denemelerOgr.get(s.deneme_id) ?? { dogru: 0, yanlis: 0 };
      if (s.durum === "dogru") d.dogru++;
      else if (s.durum === "yanlis") d.yanlis++;
      denemelerOgr.set(s.deneme_id, d);
    }

    return denemeList.map((d) => {
      const satir: Record<string, string | number | null> = { ad: d.ad, tarih: d.tarih };
      let toplam = 0;
      let adet = 0;
      for (const [ogrId, o] of ogrNetler) {
        const veri = o.get(d.deneme_id);
        if (!veri) {
          satir[ogrenciHaritasi.get(ogrId) ?? ogrId] = null;
          continue;
        }
        const n = net(veri.dogru, veri.yanlis);
        satir[ogrenciHaritasi.get(ogrId) ?? ogrId] = n;
        toplam += n;
        adet++;
      }
      satir["Sınıf ort."] = adet === 0 ? null : Math.round((toplam / adet) * 10) / 10;
      return satir;
    });
  }, [filtreliSatirlar, ogrenciHaritasi]);

  const dersAnalizi = useMemo(() => {
    const map = new Map<string, { dogru: number; yanlis: number; bos: number }>();
    for (const s of filtreliSatirlar) {
      const ad = s.ders_adi || "Diğer";
      const o = map.get(ad) ?? { dogru: 0, yanlis: 0, bos: 0 };
      if (s.durum === "dogru") o.dogru++;
      else if (s.durum === "yanlis") o.yanlis++;
      else o.bos++;
      map.set(ad, o);
    }
    return Array.from(map.entries())
      .map(([ders, o]) => ({
        ders,
        dogru: o.dogru,
        yanlis: o.yanlis,
        bos: o.bos,
        oran: o.dogru + o.yanlis + o.bos === 0 ? 0 : Math.round((o.dogru / (o.dogru + o.yanlis + o.bos)) * 100),
      }))
      .sort((a, b) => a.oran - b.oran);
  }, [filtreliSatirlar]);

  const karsilastirma = useMemo(() => {
    if (denemeFiltre !== "tumu") {
      return ogrenciOzetleri.map((o) => ({ ad: o.ad, net: o.net }));
    }
    const map = new Map<string, { ad: string; toplamNet: number; adet: number }>();
    for (const s of filtreliSatirlar) {
      if (s.durum === "bos") continue;
      const o = map.get(s.ogrenci_id) ?? { ad: s.ad_soyad, toplamNet: 0, adet: 0 };
      if (s.durum === "dogru") o.toplamNet += 1;
      else if (s.durum === "yanlis") o.toplamNet -= 0.25;
      map.set(s.ogrenci_id, o);
    }
    return Array.from(map.values())
      .map((o) => ({ ad: o.ad, net: o.adet === 0 ? 0 : Math.round((o.toplamNet / o.adet) * 10) / 10 }))
      .sort((a, b) => b.net - a.net);
  }, [filtreliSatirlar, denemeFiltre, ogrenciOzetleri]);

  const maxNet = Math.max(...karsilastirma.map((k) => k.net), 0);

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div>
        <h1 className="page-title">Sınıf Analiz</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Net trendi, sıralama ve ders bazlı başarı analizi</p>
      </div>

      <Card style={{ marginTop: 20 }}>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Filtreler</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Select style={{ flex: 1, minWidth: 140 }} value={turFiltre} onChange={(e) => setTurFiltre(e.target.value)}>
            <option value="tumu">Tüm türler</option>
            <option value="tyt">TYT</option>
            <option value="ayt">AYT</option>
            <option value="brans">Branş</option>
          </Select>
          <Select style={{ flex: 1, minWidth: 140 }} value={dersFiltre} onChange={(e) => setDersFiltre(e.target.value)}>
            <option value="tumu">Tüm dersler</option>
            {dersler.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Select style={{ flex: 1, minWidth: 160 }} value={denemeFiltre} onChange={(e) => setDenemeFiltre(e.target.value)}>
            <option value="tumu">Tüm denemeler</option>
            {denemeler.map((d) => (
              <option key={d.id} value={d.id}>{d.ad}</option>
            ))}
          </Select>
        </div>
      </Card>

      {filtreliSatirlar.length === 0 ? (
        <Card style={{ marginTop: 16 }}>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Bu filtrelerle sonuç bulunamadı.</p>
        </Card>
      ) : (
        <>
          <Card style={{ marginTop: 16 }}>
            <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Net Trendi</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="ad" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip formatter={(v: any) => `${v} net`} />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                {Object.keys(ogrenciHaritasi).length > 0 && (
                  Array.from(ogrenciHaritasi.entries()).map(([id, ad]) => (
                    <Line key={id} type="monotone" dataKey={ad} name={ad} stroke="#cfd6e0" strokeWidth={1.2} dot={false} animationDuration={600} />
                  ))
                )}
                <Line type="monotone" dataKey="Sınıf ort." stroke={GOLD} strokeWidth={3} dot={{ r: 3, fill: GOLD }} animationDuration={700} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Öğrenci Sıralaması</h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ogrenciOzetleri.map((o, i) => (
                <div key={o.ad} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                  <span className="tabular" style={{ width: 26, fontSize: 13, color: i === 0 ? "#A07C20" : "rgba(15,27,45,0.5)", fontWeight: 700 }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600 }}>{o.ad}</p>
                    <p className="tabular" style={{ fontSize: 11, color: "rgba(15,27,45,0.5)" }}>{o.dogru}D {o.yanlis}Y {o.bos}B</p>
                  </div>
                  <div style={{ width: 120 }}><ProgressBar pct={maxNet === 0 ? 0 : Math.max(0, (o.net / maxNet) * 100)} color={GOLD} /></div>
                  <span className="tabular" style={{ width: 54, textAlign: "right", fontSize: 15, fontWeight: 700 }}>{o.net}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Ders Başarı Analizi</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dersAnalizi}>
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
            <div style={{ marginTop: 10 }}>
              {dersAnalizi.map((d) => (
                <div key={d.ders} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                  <span style={{ width: 140, fontSize: 12.5, fontWeight: 500 }}>{d.ders}</span>
                  <div style={{ flex: 1 }}><ProgressBar pct={d.oran} color={d.oran < 55 ? RUST : d.oran >= 80 ? TEAL : GOLD} /></div>
                  <span className="tabular" style={{ width: 44, textAlign: "right", fontSize: 12, color: "rgba(15,27,45,0.5)" }}>{d.oran}%</span>
                  {d.oran < 55 && <Badge variant="brick">zayıf</Badge>}
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Öğrenci Karşılaştırma (net)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={karsilastirma}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="ad" tick={{ fontSize: 10.5 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => `${v} net`} />
                <Bar dataKey="net" name="Net" fill={INK} radius={[4, 4, 0, 0]} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)", marginTop: 6 }}>
              {denemeFiltre === "tumu" ? "Ortalama net (filtrelenen denemelerde sonucu olanlardan)" : "Seçilen denemedeki net"}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
