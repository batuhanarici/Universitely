import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { sinifSonuclariniGetir, type SinifSonucSatiri } from "../../lib/sinifQueries";
import { denemeleriGetir } from "../../lib/denemeQueries";
import { kocOgrencileri } from "../../lib/ogrenciYonetimQueries";
import type { Deneme, DenemeTuru } from "../../types/database";
import { subeleriGetir, type Sube } from "../../lib/subeQueries";
import { Card, Select, Label, FormGroup, ProgressBar, Badge } from "../../components/ui";

type DenemeDetayli = Deneme & { sablon_adi: string };

const tt = { contentStyle: { background: '#0F1B2D', border: 'none', borderRadius: 8, color: '#F4EFE4', fontSize: 12 } };
const colors = ['#E4BB60', '#2A9D8F', '#C4503A', '#9A9FA8', '#0F1B2D'];

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
  const [subeler, setSubeler] = useState<Sube[]>([]);
  const [subeHaritasi, setSubeHaritasi] = useState<Map<string, string | null>>(new Map());
  const [subeFiltre, setSubeFiltre] = useState<string>("tumu");
  const [turFiltre, setTurFiltre] = useState<string>("tumu");
  const [dersFiltre, setDersFiltre] = useState<string>("tumu");
  const [denemeFiltre, setDenemeFiltre] = useState<string>("tumu");
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([sinifSonuclariniGetir(), denemeleriGetir(), subeleriGetir(), kocOgrencileri()])
      .then(([s, d, sb, ko]) => {
        setSatirlar(s);
        setDenemeler(d);
        setSubeler(sb);
        setSubeHaritasi(new Map(ko.map((k) => [k.id, k.sube_id])));
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
      if (subeFiltre !== "tumu" && subeHaritasi.get(s.ogrenci_id) !== subeFiltre) return false;
      return true;
    });
  }, [satirlar, denemeFiltre, turFiltre, dersFiltre, subeFiltre, denemeTurHaritasi, subeHaritasi]);

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
        pct: o.dogru + o.yanlis + o.bos === 0 ? 0 : Math.round((o.dogru / (o.dogru + o.yanlis + o.bos)) * 100),
      }))
      .sort((a, b) => a.pct - b.pct);
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
  const ogrenciSatirlari = Array.from(ogrenciHaritasi.entries());

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Sınıf Analizi</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Filtrelenebilir çoklu grafik analizi</p>
      </div>

      <Card style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          {subeler.length > 0 && (
            <FormGroup style={{ minWidth: 140 }}>
              <Label>Şube</Label>
              <Select value={subeFiltre} onChange={(e) => setSubeFiltre(e.target.value)}>
                <option value="tumu">Tüm Şubeler</option>
                {subeler.map((s) => (
                  <option key={s.id} value={s.id}>{s.ad}</option>
                ))}
              </Select>
            </FormGroup>
          )}
          <FormGroup style={{ minWidth: 120 }}>
            <Label>Tür</Label>
            <Select value={turFiltre} onChange={(e) => setTurFiltre(e.target.value)}>
              <option value="tumu">Tümü</option>
              <option value="tyt">TYT</option>
              <option value="ayt">AYT</option>
              <option value="brans">Branş</option>
            </Select>
          </FormGroup>
          <FormGroup style={{ minWidth: 140 }}>
            <Label>Ders</Label>
            <Select value={dersFiltre} onChange={(e) => setDersFiltre(e.target.value)}>
              <option value="tumu">Tümü</option>
              {dersler.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup style={{ minWidth: 180 }}>
            <Label>Deneme</Label>
            <Select value={denemeFiltre} onChange={(e) => setDenemeFiltre(e.target.value)}>
              <option value="tumu">Tüm Denemeler</option>
              {denemeler.map((d) => (
                <option key={d.id} value={d.id}>{d.ad}</option>
              ))}
            </Select>
          </FormGroup>
        </div>
      </Card>

      {filtreliSatirlar.length === 0 ? (
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Bu filtrelerle sonuç bulunamadı.</p>
        </Card>
      ) : (
        <>
          <Card className="tape-accent">
            <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Net Trendi</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" />
                <XAxis dataKey="ad" tick={{ fontSize: 11, fill: 'rgba(15,27,45,0.4)' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(15,27,45,0.4)' }} axisLine={false} tickLine={false} />
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {ogrenciSatirlari.map(([id, ad], i) => (
                  <Line key={id} type="monotone" dataKey={ad} name={ad} stroke={colors[i % colors.length]} strokeWidth={1.5} dot={false} />
                ))}
                <Line type="monotone" dataKey="Sınıf ort." stroke={colors[0]} strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid-2">
            <Card>
              <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Öğrenci Sıralaması</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ogrenciOzetleri.map((s, i) => (
                  <div key={s.ad} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "rgba(15,27,45,0.2)", minWidth: 24 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{s.ad}</span>
                    <div style={{ width: 80 }}><ProgressBar pct={maxNet === 0 ? 0 : (s.net / maxNet) * 100} color="#E4BB60" /></div>
                    <span className="tabular" style={{ fontSize: 14, fontWeight: 700, minWidth: 40 }}>{s.net}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Ders Başarı Analizi</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dersAnalizi.map((s) => (
                  <div key={s.ders}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        {s.ders}
                        {s.pct < 55 && <Badge variant="brick">Zayıf</Badge>}
                      </span>
                      <span className="tabular" style={{ fontSize: 12, fontWeight: 700, color: s.pct < 55 ? '#C4503A' : '#2A9D8F' }}>{s.pct}%</span>
                    </div>
                    <ProgressBar pct={s.pct} color={s.pct < 55 ? '#C4503A' : '#2A9D8F'} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Öğrenci Net Karşılaştırma</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={karsilastirma} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" />
                <XAxis dataKey="ad" tick={{ fontSize: 11, fill: 'rgba(15,27,45,0.4)' }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(15,27,45,0.4)' }} axisLine={false} tickLine={false} />
                <Tooltip {...tt} />
                <Bar dataKey="net" fill="#0F1B2D" radius={[3, 3, 0, 0]} />
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
