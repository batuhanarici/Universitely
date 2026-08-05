import { calismalariGetir, type CalismaKaydiDetayli } from "./calismaQueries";
import { gorevleriGetir } from "./gorevQueries";
import { kitaplariGetir } from "./kaynakQueries";
import { yanlislariGetir } from "./yanlisQueries";
import { tekrarPlanlariniGetir } from "./tekrarPlanQueries";
import { kendiSonuclariniGetir, type SonucDetay } from "./ogrenciQueries";
import { profiliGetir } from "./profilQueries";
import type { Gorev, Kitap, OgrenciProfili, TekrarPlan, YanlisArsivi } from "../types/database";

export type Oncelik = "yuksek" | "orta" | "dusuk";

export interface Oneri {
  ikon: string;
  kategori: string;
  oncelik: Oncelik;
  baslik: string;
  detay: string;
}

export interface MotorVerisi {
  calismalar: CalismaKaydiDetayli[];
  gorevler: Gorev[];
  kitaplar: Kitap[];
  yanlislar: YanlisArsivi[];
  planlar: TekrarPlan[];
  sonuclar: SonucDetay[];
  profil: OgrenciProfili | null;
}

export async function motorVerisiniGetir(): Promise<MotorVerisi> {
  const [calismalar, gorevler, kitaplar, yanlislar, planlar, sonuclar, profil] = await Promise.all([
    calismalariGetir(),
    gorevleriGetir(),
    kitaplariGetir(),
    yanlislariGetir(),
    tekrarPlanlariniGetir(),
    kendiSonuclariniGetir(),
    profiliGetir(),
  ]);
  return { calismalar, gorevler, kitaplar, yanlislar, planlar, sonuclar, profil };
}

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function bugunIso(): string {
  return isoOf(new Date());
}

export function gunEkle(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return isoOf(d);
}

function sonNGundur(iso: string, bugun: string, n: number): boolean {
  return iso >= gunEkle(bugun, -(n - 1)) && iso <= bugun;
}

function ortalamaNet(sonuclar: SonucDetay[]): number | null {
  const map = new Map<string, { dogru: number; yanlis: number }>();
  for (const s of sonuclar) {
    if (!map.has(s.deneme_id)) map.set(s.deneme_id, { dogru: 0, yanlis: 0 });
    const o = map.get(s.deneme_id)!;
    if (s.durum === "dogru") o.dogru++;
    else if (s.durum === "yanlis") o.yanlis++;
  }
  if (map.size === 0) return null;
  let toplam = 0;
  for (const o of map.values()) toplam += o.dogru - o.yanlis / 4;
  return toplam / map.size;
}

interface KonuBasari {
  konu: string;
  yuzde: number;
}

function konuBasarilari(sonuclar: SonucDetay[]): KonuBasari[] {
  const map = new Map<string, { dogru: number; toplam: number }>();
  for (const s of sonuclar) {
    if (!map.has(s.konu_adi)) map.set(s.konu_adi, { dogru: 0, toplam: 0 });
    const o = map.get(s.konu_adi)!;
    o.toplam++;
    if (s.durum === "dogru") o.dogru++;
  }
  return Array.from(map.entries())
    .map(([konu, o]) => ({ konu, yuzde: o.toplam === 0 ? 0 : Math.round((o.dogru / o.toplam) * 100) }))
    .sort((a, b) => a.yuzde - b.yuzde);
}

const SIRA: Record<Oncelik, number> = { yuksek: 0, orta: 1, dusuk: 2 };

export function onerileriUret(v: MotorVerisi): Oneri[] {
  const o: Oneri[] = [];
  const bugun = bugunIso();

  const konuBasariListesi = konuBasarilari(v.sonuclar);
  const zayifKonular = konuBasariListesi.filter((k) => k.yuzde < 55).slice(0, 3);
  if (zayifKonular.length > 0) {
    o.push({
      ikon: "📚",
      kategori: "Konu Eksikleri",
      oncelik: "yuksek",
      baslik: "Zayıf konuların: " + zayifKonular.map((k) => k.konu).join(", "),
      detay:
        "Bu konulardaki başarın %" +
        zayifKonular.map((k) => `${k.konu}: %${k.yuzde}`).join(", ") +
        ". Netlerini yükseltmenin en hızlı yolu bu eksikleri kapatmak.",
    });
  }

  const cozulmemisYanlis = v.yanlislar.filter((y) => !y.cozuldu).length;
  if (cozulmemisYanlis > 0) {
    o.push({
      ikon: "❌",
      kategori: "Yanlış Arşivi",
      oncelik: "yuksek",
      baslik: `${cozulmemisYanlis} çözülmemiş yanlışın var`,
      detay: "Yanlış arşivindeki soruları çözmeden tekrarına geçme — aynı hatayı yapma riskin çok yüksek.",
    });
  }

  const bugunTekrar = v.planlar.filter((p) => p.plan_tarihi === bugun && !p.yapildi).length;
  if (bugunTekrar > 0) {
    o.push({
      ikon: "🔁",
      kategori: "Tekrar Planı",
      oncelik: "yuksek",
      baslik: `Bugün ${bugunTekrar} tekrar seni bekliyor`,
      detay: "Tekrar Planı sekmesinden bugünkü tekrarları işaretlemeyi unutma. Aralıklı tekrar en kalıcı öğrenme yöntemidir.",
    });
  }

  const hedef = v.profil?.hedef_net ?? null;
  const ort = ortalamaNet(v.sonuclar);
  if (hedef !== null && ort !== null) {
    const fark = Math.round((hedef - ort) * 10) / 10;
    if (fark > 0) {
      o.push({
        ikon: "🎯",
        kategori: "Hedef",
        oncelik: fark > 10 ? "yuksek" : "orta",
        baslik: `Hedefine ${fark} net kaldı`,
        detay: `Hedefin ${hedef} net, ortalaman ${ort} net. Zayıf konuları kapatıp deneme sıklığını artırınca fark hızla kapanır.`,
      });
    } else {
      o.push({
        ikon: "🎯",
        kategori: "Hedef",
        oncelik: "dusuk",
        baslik: "Hedef netini geçtin, harika!",
        detay: `Hedefin ${hedef} net, ortalaman ${ort} net. Şimdi hedefi yükseltme zamanı — Profil sekmesinden güncelleyebilirsin.`,
      });
    }
  }

  const gecikenKaynaklar = v.kitaplar.filter((k) => k.bitis_hedefi && k.bitis_hedefi < bugun && k.ilerleme < k.toplam);
  if (gecikenKaynaklar.length > 0) {
    o.push({
      ikon: "📖",
      kategori: "Kaynaklar",
      oncelik: "orta",
      baslik: "Bitiş hedefi geçen kaynak(lar) var",
      detay:
        gecikenKaynaklar
          .slice(0, 3)
          .map((k) => {
            const kalan = k.toplam - k.ilerleme;
            return `${k.ad} (%${Math.round((k.ilerleme / Math.max(1, k.toplam)) * 100)}, kalan ${kalan})`;
          })
          .join(" · "),
    });
  }

  const bugunGorev = v.gorevler.filter((g) => g.tarih === bugun && !g.tamamlandi).length;
  if (bugunGorev > 0) {
    o.push({
      ikon: "✅",
      kategori: "Görevler",
      oncelik: "orta",
      baslik: `Bugün ${bugunGorev} tamamlanmamış görevin var`,
      detay: "Görevleri küçük parçalara böl; bir Pomodoro ile başlamak en zor kısmı atlatmanı sağlar.",
    });
  }

  const son7Gun = v.calismalar.filter((c) => sonNGundur(c.tarih, bugun, 7));
  const son7Dakika = son7Gun.reduce((a, c) => a + c.sure_dk, 0);
  const son7Saat = Math.round((son7Dakika / 60) * 10) / 10;
  if (son7Saat < 3.5) {
    o.push({
      ikon: "⏱️",
      kategori: "Çalışma Temposu",
      oncelik: "orta",
      baslik: `Son 7 günde ${son7Saat} saat çalıştın`,
      detay:
        "Günde ortalama " +
        Math.round(son7Dakika / Math.max(1, son7Gun.length)) +
        " dk ediyor. Günde en az 2 Pomodoro (50 dk) hedefleyerek tempoyu oturtabilirsin.",
    });
  } else {
    o.push({
      ikon: "⏱️",
      kategori: "Çalışma Temposu",
      oncelik: "dusuk",
      baslik: `Son 7 günde ${son7Saat} saat çalıştın`,
      detay: "Tempo iyi görünüyor. Tutarlılığını koru — sınav başarısı yoğunluktan çok devamlılıkla gelir.",
    });
  }

  if (v.sonuclar.length === 0) {
    o.push({
      ikon: "🗓️",
      kategori: "Deneme",
      oncelik: "orta",
      baslik: "Henüz deneme sonucun girilmemiş",
      detay: "Öğretmenin sonuçları girdikçe net trendini ve konu bazlı eksiklerini burada görüp yönlendireceğim.",
    });
  }

  const gucluKonu = konuBasariListesi.filter((k) => k.yuzde >= 80)[0];
  if (gucluKonu) {
    o.push({
      ikon: "⭐",
      kategori: "Güçlü Yön",
      oncelik: "dusuk",
      baslik: `Güçlü konun: ${gucluKonu.konu} (%${gucluKonu.yuzde})`,
      detay: "Bu konudaki başarını korumak için zaman zaman kısa tekrarlar yapman yeterli. Enerjini zayıf konulara ayır.",
    });
  }

  return o.sort((a, b) => SIRA[a.oncelik] - SIRA[b.oncelik]);
}
