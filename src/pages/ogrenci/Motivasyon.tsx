import { useEffect, useMemo, useState } from "react";
import { motorVerisiniGetir, bugunIso, gunEkle, type MotorVerisi } from "../../lib/oneriMotoru";
import { denemeleriGetir } from "../../lib/denemeQueries";
import { Card, Badge, AnimatedNumber, ProgressBar } from "../../components/ui";

interface Rozet {
  id: string;
  ikon: string;
  ad: string;
  aciklama: string;
  eldeEdildiMi: boolean;
  ilerleme?: [number, number];
}

const SEEN_KEY = "universitely_rozetler_seen";

function streakHesapla(tarihler: string[]): number {
  const set = new Set(tarihler);
  let gun = bugunIso();
  if (!set.has(gun)) gun = gunEkle(gun, -1);
  let seri = 0;
  while (set.has(gun)) {
    seri++;
    gun = gunEkle(gun, -1);
  }
  return seri;
}

export default function Motivasyon() {
  const [veri, setVeri] = useState<MotorVerisi | null>(null);
  const [denemeSayisi, setDenemeSayisi] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yeniIdler, setYeniIdler] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([motorVerisiniGetir(), denemeleriGetir()])
      .then(([v, d]) => {
        setVeri(v);
        setDenemeSayisi(d.length);
      })
      .catch(() => setVeri(null))
      .finally(() => setYukleniyor(false));
  }, []);

  const rozetler = useMemo<Rozet[]>(() => {
    if (!veri) return [];
    const streak = streakHesapla(veri.calismalar.map((c) => c.tarih));
    const toplamDk = veri.calismalar.reduce((a, c) => a + c.sure_dk, 0);
    const cozulenYanlis = veri.yanlislar.filter((y) => y.cozuldu).length;
    const tamamlananTekrar = veri.planlar.filter((p) => p.yapildi).length;
    const ort = (() => {
      const map = new Map<string, { dogru: number; yanlis: number }>();
      for (const s of veri.sonuclar) {
        if (!map.has(s.deneme_id)) map.set(s.deneme_id, { dogru: 0, yanlis: 0 });
        const o = map.get(s.deneme_id)!;
        if (s.durum === "dogru") o.dogru++;
        else if (s.durum === "yanlis") o.yanlis++;
      }
      if (map.size === 0) return null;
      let toplam = 0;
      for (const o of map.values()) toplam += o.dogru - o.yanlis / 4;
      return toplam / map.size;
    })();

    const liste: Rozet[] = [
      { id: "ilk_adim", ikon: "👣", ad: "İlk Adım", aciklama: "İlk çalışma kaydını oluştur", eldeEdildiMi: veri.calismalar.length >= 1, ilerleme: [Math.min(veri.calismalar.length, 1), 1] },
      { id: "seri_3", ikon: "🔥", ad: "3 Gün Seri", aciklama: "Arka arkaya 3 gün çalış", eldeEdildiMi: streak >= 3, ilerleme: [Math.min(streak, 3), 3] },
      { id: "seri_7", ikon: "⚡", ad: "Bir Haftalık Rutin", aciklama: "7 günlük seri yakala", eldeEdildiMi: streak >= 7, ilerleme: [Math.min(streak, 7), 7] },
      { id: "seri_14", ikon: "🏛️", ad: "İki Hafta Kararlılık", aciklama: "14 günlük seri yakala", eldeEdildiMi: streak >= 14, ilerleme: [Math.min(streak, 14), 14] },
      { id: "saat_10", ikon: "⏰", ad: "10 Saat", aciklama: "Toplam 10 saat çalış", eldeEdildiMi: toplamDk >= 600, ilerleme: [Math.min(Math.round(toplamDk / 60), 10), 10] },
      { id: "saat_50", ikon: "🚀", ad: "50 Saat", aciklama: "Toplam 50 saat çalış", eldeEdildiMi: toplamDk >= 3000, ilerleme: [Math.min(Math.round(toplamDk / 60), 50), 50] },
      { id: "ilk_deneme", ikon: "🗓️", ad: "İlk Deneme", aciklama: "İlk denemene gir", eldeEdildiMi: denemeSayisi >= 1, ilerleme: [Math.min(denemeSayisi, 1), 1] },
      { id: "deneme_5", ikon: "📚", ad: "5 Deneme", aciklama: "5 denemeye gir", eldeEdildiMi: denemeSayisi >= 5, ilerleme: [Math.min(denemeSayisi, 5), 5] },
      { id: "kaynak_bitti", ikon: "📖", ad: "Kaynak Bitti", aciklama: "Bir kaynağı baştan sona bitir", eldeEdildiMi: veri.kitaplar.some((k) => k.toplam > 0 && k.ilerleme >= k.toplam) },
      { id: "yanlis_50", ikon: "🎯", ad: "Yanlış Avcısı", aciklama: "50 yanlışı çöz", eldeEdildiMi: cozulenYanlis >= 50, ilerleme: [Math.min(cozulenYanlis, 50), 50] },
      { id: "tekrar_10", ikon: "🔁", ad: "Tekrar Ustası", aciklama: "10 tekrarı tamamla", eldeEdildiMi: tamamlananTekrar >= 10, ilerleme: [Math.min(tamamlananTekrar, 10), 10] },
      { id: "hedefi_astin", ikon: "👑", ad: "Hedefini Aştın", aciklama: "Ortalaman hedef netini geçsin", eldeEdildiMi: ort !== null && veri.profil?.hedef_net != null && ort >= veri.profil.hedef_net },
    ];
    return liste;
  }, [veri, denemeSayisi]);

  useEffect(() => {
    if (rozetler.length === 0) return;
    try {
      const onceki = new Set<string>(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[]);
      const yeni = rozetler.filter((r) => r.eldeEdildiMi && !onceki.has(r.id)).map((r) => r.id);
      if (yeni.length > 0) {
        setYeniIdler(yeni);
        onceki.clear();
        for (const r of rozetler) if (r.eldeEdildiMi) onceki.add(r.id);
        localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(onceki)));
      }
    } catch {}
  }, [rozetler]);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;
  if (!veri) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Veri yüklenemedi.</p>;

  const streak = streakHesapla(veri.calismalar.map((c) => c.tarih));
  const toplamDk = veri.calismalar.reduce((a, c) => a + c.sure_dk, 0);
  const kazanilan = rozetler.filter((r) => r.eldeEdildiMi).length;
  const mesaj =
    streak >= 7
      ? `${streak} gündür aralıksız çalışıyorsun — bu rutin sınavda en büyük avantajın. Devam!`
      : streak >= 3
      ? `${streak} günlük serin var, ritmine oturdun. Bugünü de ekleyerek devamını getir.`
      : toplamDk > 0
      ? "Çalışmaya başlamış olman en önemli adım. Günde 2 Pomodoro ile seriyi yakalayabilirsin."
      : "Henüz çalışma kaydın yok. İlk Pomodoro'yu başlat, seri bugün başlasın!";

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Motivasyon</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Seriler ve başarı rozetleri</p>
      </div>

      <div className="grid-3">
        <Card className="tape-accent" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 10 }}>Günlük Seri</p>
          <p style={{ fontSize: 56, fontWeight: 800, color: "#E4BB60", lineHeight: 1 }}>
            <AnimatedNumber value={streak} />
          </p>
          <p style={{ fontSize: 12, color: "rgba(15,27,45,0.5)", marginTop: 8, lineHeight: 1.5 }}>{mesaj}</p>
        </Card>
        <Card style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 10 }}>Toplam Çalışma</p>
          <p style={{ fontSize: 40, fontWeight: 700, color: "#0F1B2D", lineHeight: 1 }}>
            <AnimatedNumber value={Math.round(toplamDk / 60)} />
            <span style={{ fontSize: 20, fontWeight: 600, color: "rgba(15,27,45,0.45)" }}> saat</span>
          </p>
        </Card>
        <Card style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 10 }}>Kazanılan Rozet</p>
          <p style={{ fontSize: 40, fontWeight: 700, color: "#E4BB60", lineHeight: 1 }}>
            <AnimatedNumber value={kazanilan} />
            <span style={{ fontSize: 20, fontWeight: 600, color: "rgba(15,27,45,0.45)" }}>/{rozetler.length}</span>
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Rozetlerim</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {rozetler.map((r) => {
            const pct = r.ilerleme ? Math.min(100, Math.round((r.ilerleme[0] / r.ilerleme[1]) * 100)) : 0;
            return (
              <div
                key={r.id}
                style={{
                  position: "relative",
                  padding: 14,
                  borderRadius: 16,
                  border: r.eldeEdildiMi ? "1px solid rgba(228,187,96,0.55)" : "1px solid rgba(15,27,45,0.08)",
                  background: r.eldeEdildiMi ? "rgba(228,187,96,0.07)" : "#FAFAFA",
                  boxShadow: yeniIdler.includes(r.id) ? "0 0 0 2px rgba(228,187,96,0.5)" : "none",
                }}
              >
                {yeniIdler.includes(r.id) && (
                  <span style={{ position: "absolute", top: 8, right: 8 }}>
                    <Badge variant="brick">YENİ</Badge>
                  </span>
                )}
                <div style={{ fontSize: 28, marginBottom: 8, minHeight: 34 }}>{r.eldeEdildiMi ? r.ikon : "🔒"}</div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0F1B2D", marginBottom: 3 }}>{r.ad}</p>
                <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.55)", lineHeight: 1.5, marginBottom: r.ilerleme ? 10 : 0 }}>{r.aciklama}</p>
                {r.ilerleme && (
                  <div>
                    <ProgressBar pct={pct} color={r.eldeEdildiMi ? "#E4BB60" : "#D9D9D9"} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <span className="tabular" style={{ fontSize: 10, fontWeight: 700, color: "rgba(15,27,45,0.5)" }}>{pct}%</span>
                      <span className="tabular" style={{ fontSize: 10, fontWeight: 700, color: "rgba(15,27,45,0.4)" }}>{r.ilerleme[0]}/{r.ilerleme[1]}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
