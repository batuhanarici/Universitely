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

const TEAL = "#2E7D6B";
const RUST = "#B5482A";
const AMBER = "#C98A2B";

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
    const anahtar = s.konu_adi;
    if (!map.has(anahtar)) {
      map.set(anahtar, { konu_adi: s.konu_adi, ders_adi: s.ders_adi, dogru: 0, yanlis: 0, bos: 0 });
    }
    const ozet = map.get(anahtar)!;
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

export default function OgrenciPaneli() {
  const [sonuclar, setSonuclar] = useState<SonucDetay[]>([]);
  const [havuz, setHavuz] = useState<TekrarKaydi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([kendiSonuclariniGetir(), kendiTekrarHavuzunuGetir()])
      .then(([s, h]) => {
        setSonuclar(s);
        setHavuz(h);
      })
      .finally(() => setYukleniyor(false));
  }, []);

  const konuOzetleri = useMemo(() => konulariOzetle(sonuclar), [sonuclar]);

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

  async function toggleCozuldu(kayit: TekrarKaydi) {
    const yeniDurum = !kayit.cozuldu;
    setHavuz((h) => h.map((k) => (k.sonuc_id === kayit.sonuc_id ? { ...k, cozuldu: yeniDurum } : k)));
    await tekrarCozulduIsaretle(kayit.sonuc_id, yeniDurum);
  }

  if (yukleniyor) return <p style={{ textAlign: "center", marginTop: 80 }}>Yükleniyor…</p>;

  if (sonuclar.length === 0) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 20 }}>Öğrenci Paneli</h1>
        <p style={{ color: "#777", marginTop: 8 }}>Henüz sana ait bir deneme sonucu girilmemiş.</p>
      </div>
    );
  }

  const kalanTekrar = havuz.filter((h) => !h.cozuldu).length;

  return (
    <div style={{ maxWidth: 640, margin: "24px auto", fontFamily: "system-ui, sans-serif", padding: "0 16px" }}>
      <h1 style={{ fontSize: 20 }}>Sonuçlarım</h1>

      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 10, padding: 16, marginTop: 16 }}>
        <h2 style={{ fontSize: 15, color: "#555", marginBottom: 8 }}>Deneme Bazlı Doğru / Yanlış / Boş</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={denemeBazliOzet}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="deneme_adi" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="dogru" name="Doğru" stackId="a" fill={TEAL} />
            <Bar dataKey="yanlis" name="Yanlış" stackId="a" fill={RUST} />
            <Bar dataKey="bos" name="Boş" stackId="a" fill="#D9D4C7" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 10, padding: 16, marginTop: 16 }}>
        <h2 style={{ fontSize: 15, color: "#555", marginBottom: 8 }}>Konu Bazlı Performans</h2>
        {konuOzetleri.map((o) => {
          const oran = oranHesapla(o);
          const zayif = oran < 55;
          const renk = zayif ? RUST : oran >= 80 ? TEAL : AMBER;
          return (
            <div key={o.konu_adi} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2" }}>
              <div style={{ width: 110, fontSize: 13, color: "#333" }}>{o.konu_adi}</div>
              <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#f0f0f0", overflow: "hidden" }}>
                <div style={{ width: `${oran}%`, height: "100%", background: renk }} />
              </div>
              <div style={{ width: 40, textAlign: "right", fontSize: 13, color: "#666" }}>{oran}%</div>
              {zayif && (
                <span style={{ fontSize: 11, fontWeight: 600, color: RUST, background: "#FBEAE3", padding: "3px 8px", borderRadius: 999 }}>
                  Ağırlık ver
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 10, padding: 16, margin: "16px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ fontSize: 15, color: "#555" }}>Tekrar Havuzu</h2>
          <span style={{ fontSize: 12, color: "#999" }}>{kalanTekrar} soru bekliyor</span>
        </div>
        {havuz.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Tekrar edilecek soru yok.</p>}
        {havuz.map((k) => (
          <div key={k.sonuc_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2" }}>
            <input type="checkbox" checked={k.cozuldu} onChange={() => toggleCozuldu(k)} />
            <div style={{ flex: 1, opacity: k.cozuldu ? 0.4 : 1, textDecoration: k.cozuldu ? "line-through" : "none" }}>
              <p style={{ fontSize: 13 }}>{k.deneme_adi} — Soru {k.soru_no}</p>
              <p style={{ fontSize: 11, color: "#999" }}>{k.konu_adi} · {k.tarih}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
