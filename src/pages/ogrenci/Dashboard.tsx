import { useCallback, useEffect, useMemo, useState } from "react";
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
import { gorevleriGetir, gorevTamamla } from "../../lib/gorevQueries";
import type { Gorev } from "../../types/database";
import { AnimatedNumber, ProgressBar, Badge, Card, Checkbox, EmptyState, ErrorState, LoadingState, useToast } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";

const TEAL = "#2A9D8F";
const RUST = "#C4503A";
const BOS = "#9A9FA8";
const GOLD = "#E4BB60";

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

function tesvik(kalanTekrar: number, zayifKonular: KonuOzet[]): string {
  const zayif = zayifKonular[0];
  if (kalanTekrar >= 5) return `Tekrar havuzunda <strong>${kalanTekrar} soru</strong> bekliyor. Bugün onları eritebilirsin.`;
  if (zayif) return `Tekrar havuzunda <strong>${kalanTekrar} soru</strong> bekliyor. ${zayif.konu_adi}'ya ağırlık ver.`;
  return "Tekrar havuzunda <strong>0 soru</strong> bekliyor. Güzel gidiyorsun, bugünü de bitir!";
}

function tarihSatiiri(): string {
  const d = new Date();
  const gun = d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const hafta = d.toLocaleDateString("tr-TR", { weekday: "long" });
  const buyuk = hafta.charAt(0).toUpperCase() + hafta.slice(1);
  return `${gun} · ${buyuk}`;
}

export default function Dashboard() {
  const { session } = useAuth();
  const { toast, show } = useToast();
  const [sonuclar, setSonuclar] = useState<SonucDetay[]>([]);
  const [havuz, setHavuz] = useState<TekrarKaydi[]>([]);
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);
  const [bekleyenIslemler, setBekleyenIslemler] = useState<Set<string>>(() => new Set());

  const verileriYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata(false);
    try {
      const [s, h, g] = await Promise.all([kendiSonuclariniGetir(), kendiTekrarHavuzunuGetir(), gorevleriGetir()]);
      setSonuclar(s);
      setHavuz(h);
      setGorevler(g);
    } catch {
      setHata(true);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void verileriYukle();
  }, [verileriYukle]);

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

  const sonDeneme = denemeBazliOzet[denemeBazliOzet.length - 1];

  const bugun = bugunIso();
  const haftaBasi = haftaBasiIso();
  const bugunkuGorevler = useMemo(() => gorevler.filter((g) => g.tarih === bugun), [gorevler, bugun]);
  const haftalikGorevler = useMemo(
    () => gorevler.filter((g) => g.tarih >= haftaBasi && g.tarih <= bugun),
    [gorevler, haftaBasi, bugun]
  );

  const tamamlananBugun = bugunkuGorevler.filter((g) => g.tamamlandi).length;
  const bugunYuzde = bugunkuGorevler.length === 0
    ? 0
    : Math.round((tamamlananBugun / bugunkuGorevler.length) * 100);
  const haftalikTamamlanan = haftalikGorevler.filter((g) => g.tamamlandi).length;
  const haftalikYuzde = haftalikGorevler.length === 0
    ? 0
    : Math.round((haftalikTamamlanan / haftalikGorevler.length) * 100);

  async function toggleGorev(g: Gorev) {
    const islemId = `gorev:${g.id}`;
    if (bekleyenIslemler.has(islemId)) return;
    setBekleyenIslemler((ids) => new Set(ids).add(islemId));
    const oncekiDurum = g.tamamlandi;
    const yeniDurum = !oncekiDurum;
    setGorevler((gs) => gs.map((x) => (x.id === g.id ? { ...x, tamamlandi: yeniDurum } : x)));
    try {
      await gorevTamamla(g.id, yeniDurum);
      show(yeniDurum ? "Görev tamamlandı ✓" : "Görev yeniden açıldı ✓");
    } catch {
      setGorevler((gs) => gs.map((x) => (x.id === g.id ? { ...x, tamamlandi: oncekiDurum } : x)));
      show("Görev güncellenemedi. Değişiklik geri alındı.");
    } finally {
      setBekleyenIslemler((ids) => {
        const sonraki = new Set(ids);
        sonraki.delete(islemId);
        return sonraki;
      });
    }
  }

  async function toggleCozuldu(kayit: TekrarKaydi) {
    const islemId = `tekrar:${kayit.sonuc_id}`;
    if (bekleyenIslemler.has(islemId)) return;
    setBekleyenIslemler((ids) => new Set(ids).add(islemId));
    const oncekiDurum = kayit.cozuldu;
    const yeniDurum = !oncekiDurum;
    setHavuz((h) => h.map((k) => (k.sonuc_id === kayit.sonuc_id ? { ...k, cozuldu: yeniDurum } : k)));
    try {
      await tekrarCozulduIsaretle(kayit.sonuc_id, yeniDurum);
      show("Tekrar kaydedildi ✓");
    } catch {
      setHavuz((h) => h.map((k) => (k.sonuc_id === kayit.sonuc_id ? { ...k, cozuldu: oncekiDurum } : k)));
      show("Tekrar güncellenemedi. Değişiklik geri alındı.");
    } finally {
      setBekleyenIslemler((ids) => {
        const sonraki = new Set(ids);
        sonraki.delete(islemId);
        return sonraki;
      });
    }
  }

  if (yukleniyor) return <LoadingState className="page-loading" />;

  if (hata) {
    return (
      <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 className="page-title">Öğrenci Paneli</h1>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Bugünkü çalışma görünümün</p>
        </div>
        <ErrorState
          title="Panel verileri yüklenemedi."
          description="Bağlantını kontrol edip tekrar deneyebilirsin. Mevcut verilerin korunur."
          onRetry={() => void verileriYukle()}
        />
      </div>
    );
  }

  const kalanTekrar = havuz.filter((h) => !h.cozuldu).length;
  const ad = (session?.user.user_metadata?.ad_soyad as string | undefined)?.split(" ")[0];
  const netDiff = oncekiNet !== null ? +(sonNet - oncekiNet).toFixed(1) : null;
  const chartData = denemeBazliOzet.map((o) => ({
    name: o.deneme_adi,
    dogru: o.dogru,
    yanlis: o.yanlis,
    bos: o.bos,
  }));

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}

      <div>
        <h1 className="page-title">Günaydın{ad ? `, ${ad}` : ""} 👋</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>{tarihSatiiri()}</p>
      </div>

      <div className="card tape-accent" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 8 }}>
            Son Net {sonDeneme ? `· ${sonDeneme.deneme_adi}` : ""}
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span className="metric-value" style={{ fontSize: 56, fontWeight: 700, color: "#0F1B2D", lineHeight: 1 }}>
              <AnimatedNumber value={sonNet} decimals={1} />
            </span>
            {netDiff !== null && (
              <span style={{ fontSize: 20, fontWeight: 600, color: netDiff >= 0 ? TEAL : RUST, display: "flex", alignItems: "center", gap: 4 }}>
                {netDiff >= 0 ? "↑" : "↓"} {Math.abs(netDiff).toFixed(1)}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.5)", marginTop: 6 }} dangerouslySetInnerHTML={{ __html: tesvik(kalanTekrar, zayifKonular) }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", border: `3px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700 }}>D/Y/B</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0F1B2D" }}>
              {sonDeneme ? `${sonDeneme.dogru}/${sonDeneme.yanlis}/${sonDeneme.bos}` : "0/0/0"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Bugünün Yapılacakları</h3>
            <Badge variant="ink">{tamamlananBugun}/{bugunkuGorevler.length}</Badge>
          </div>
          {bugunkuGorevler.length === 0 ? (
            <p style={{ fontSize: 13, color: "rgba(15,27,45,0.4)", fontStyle: "italic" }}>Bugün için görev yok.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bugunkuGorevler.slice(0, 5).map((g) => (
                <label key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <Checkbox checked={g.tamamlandi} disabled={bekleyenIslemler.has(`gorev:${g.id}`)} onChange={() => void toggleGorev(g)} />
                  <span style={{ fontSize: 13, textDecoration: g.tamamlandi ? "line-through" : "none", color: g.tamamlandi ? "rgba(15,27,45,0.35)" : "#0F1B2D" }}>{g.baslik}</span>
                </label>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="section-title" style={{ marginBottom: 4, fontSize: 16 }}>Bugünkü Tamamlanma</h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <span className="metric-value" style={{ fontSize: 40, fontWeight: 700, color: bugunYuzde >= 70 ? TEAL : GOLD }}>
              <AnimatedNumber value={bugunYuzde} />%
            </span>
          </div>
          <ProgressBar pct={bugunYuzde} color={bugunYuzde >= 70 ? TEAL : GOLD} />
          <p style={{ fontSize: 12, color: "rgba(15,27,45,0.45)", marginTop: 10 }}>
            Bu hafta ortalama tamamlanma: <strong style={{ color: "#0F1B2D" }}>{haftalikYuzde}%</strong>
          </p>
        </Card>
      </div>

      {sonuclar.length === 0 ? (
        <Card>
          <EmptyState
            icon="📊"
            title="Henüz deneme sonucun yok"
            desc="Öğretmenin sonuçlarını girdiğinde net, grafik ve tekrar analizlerin burada görünecek."
          />
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Deneme Bazlı D/Y/B</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={28} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0F1B2D", border: "none", borderRadius: 8, color: "#F4EFE4", fontSize: 12 }} />
                <Bar dataKey="dogru" name="Doğru" fill={TEAL} radius={[2, 2, 0, 0]} animationDuration={800} />
                <Bar dataKey="yanlis" name="Yanlış" fill={RUST} radius={[2, 2, 0, 0]} animationDuration={800} />
                <Bar dataKey="bos" name="Boş" fill={BOS} radius={[2, 2, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Konu Bazlı Performans</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {konuOzetleri.map((o) => {
                const oran = oranHesapla(o);
                const zayif = oran < 55;
                return (
                  <div key={o.konu_adi}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                        {o.konu_adi}
                        {zayif && <Badge variant="brick">Ağırlık ver</Badge>}
                      </span>
                      <span className="tabular" style={{ fontSize: 13, fontWeight: 600, color: zayif ? RUST : TEAL }}>{oran}%</span>
                    </div>
                    <ProgressBar pct={oran} color={zayif ? RUST : TEAL} />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Tekrar Havuzu</h3>
              <span className="metric-value" style={{ fontSize: 28, fontWeight: 700, color: GOLD }}>
                <AnimatedNumber value={kalanTekrar} />
              </span>
            </div>
            {kalanTekrar === 0 ? (
              <p style={{ fontSize: 13, color: TEAL, fontWeight: 500 }}>Harika! Tüm tekrarlarını tamamladın. 🎉</p>
            ) : (
              <div className="rule-lines" style={{ borderRadius: 8, overflow: "hidden" }}>
                {havuz.map((k) => (
                  <label key={k.sonuc_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", cursor: "pointer" }}>
                    <Checkbox checked={k.cozuldu} disabled={bekleyenIslemler.has(`tekrar:${k.sonuc_id}`)} onChange={() => void toggleCozuldu(k)} />
                    <span style={{ flex: 1, fontSize: 13, textDecoration: k.cozuldu ? "line-through" : "none", color: k.cozuldu ? "rgba(15,27,45,0.35)" : "#0F1B2D" }}>
                      {k.deneme_adi} — Soru {k.soru_no}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(15,27,45,0.4)" }}>{k.tarih}</span>
                  </label>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
