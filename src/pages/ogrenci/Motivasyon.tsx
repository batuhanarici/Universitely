import { useEffect, useMemo, useState } from "react";
import { motorVerisiniGetir, bugunIso, gunEkle, type MotorVerisi } from "../../lib/oneriMotoru";
import { denemeleriGetir } from "../../lib/denemeQueries";
import AnimatedNumber from "../../components/AnimatedNumber";

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

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;
  if (!veri) return <p className="mono" style={{ color: "var(--muted)" }}>Veri yüklenemedi.</p>;

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
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Motivasyon</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s", textAlign: "center", borderLeft: "4px solid var(--gold)" }}>
        <div style={{ fontSize: 40, lineHeight: 1 }}>🔥</div>
        <p style={{ fontSize: 34, fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>
          <AnimatedNumber value={streak} />
        </p>
        <p className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>GÜNLÜK ÇALIŞMA SERİSİ</p>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{mesaj}</p>
      </div>

      <div className="stagger-item" style={{ display: "flex", gap: 12, marginTop: 16, animationDelay: "0.1s" }}>
        <div className="card" style={{ marginTop: 0, flex: 1, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--gold-dim)" }}><AnimatedNumber value={Math.round(toplamDk / 60)} suffix="s" /></p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>toplam çalışma</p>
        </div>
        <div className="card" style={{ marginTop: 0, flex: 1, textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--gold-dim)" }}><AnimatedNumber value={kazanilan} suffix={`/${rozetler.length}`} /></p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>kazanılan rozet</p>
        </div>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
        <h2 className="card-title">Rozetler</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
          {rozetler.map((r, i) => (
            <div
              key={r.id}
              className="stagger-item"
              style={{
                padding: 12, borderRadius: 12, border: "1px solid #eee",
                background: r.eldeEdildiMi ? "rgba(228,187,96,0.10)" : "#fafafa",
                opacity: r.eldeEdildiMi ? 1 : 0.55,
                animationDelay: `${0.2 + i * 0.03}s`,
                boxShadow: yeniIdler.includes(r.id) ? "0 0 0 2px var(--gold)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 26, filter: r.eldeEdildiMi ? "none" : "grayscale(1)" }}>{r.eldeEdildiMi ? r.ikon : "🔒"}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
                    {r.ad}
                    {yeniIdler.includes(r.id) && <span style={{ marginLeft: 6, fontSize: 10.5, background: "var(--gold)", color: "#fff", padding: "1px 6px", borderRadius: 999 }}>YENİ</span>}
                  </p>
                  <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{r.aciklama}</p>
                  {r.ilerleme && (
                    <div className="progress-track" style={{ marginTop: 6 }}>
                      <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((r.ilerleme[0] / r.ilerleme[1]) * 100))}%`, background: r.eldeEdildiMi ? "var(--gold-dim)" : "#d9d9d9" }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
