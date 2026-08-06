import type { CalismaKaydi, Gorev, Kitap, OgrenciProfili, TekrarPlan, YanlisArsivi, KocSonucSatiri } from "../types/database";
import type { KocOgrencisi } from "./ogrenciYonetimQueries";

export interface KocAnalizVerisi {
  ogrenciler: KocOgrencisi[];
  sonuclar: KocSonucSatiri[];
  calismalar: CalismaKaydi[];
  gorevler: Gorev[];
  kitaplar: Kitap[];
  yanlislar: YanlisArsivi[];
  planlar: TekrarPlan[];
  profiller: OgrenciProfili[];
}

export type RiskSeviye = "dusuk" | "orta" | "yuksek";

export interface RiskFaktoru {
  id: string;
  ad: string;
  agirlik: number;
  puan: number;
  detay: string;
}

export interface OgrenciRiski {
  ogrenci_id: string;
  ad_soyad: string;
  aktif: boolean;
  riskSkoru: number;
  seviye: RiskSeviye;
  faktorler: RiskFaktoru[];
  oneriler: string[];
  ortalamaNet: number | null;
  hedefNet: number | null;
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

function netleriHesapla(sonuclar: KocSonucSatiri[]): { ad: string; tarih: string; net: number }[] {
  const map = new Map<string, { ad: string; tarih: string; dogru: number; yanlis: number }>();
  for (const s of sonuclar) {
    if (!map.has(s.deneme_id)) map.set(s.deneme_id, { ad: s.deneme_adi, tarih: s.tarih, dogru: 0, yanlis: 0 });
    const o = map.get(s.deneme_id)!;
    if (s.durum === "dogru") o.dogru++;
    else if (s.durum === "yanlis") o.yanlis++;
  }
  return Array.from(map.values())
    .map((o) => ({ ad: o.ad, tarih: o.tarih, net: Math.round((o.dogru - o.yanlis / 4) * 10) / 10 }))
    .sort((a, b) => a.tarih.localeCompare(b.tarih));
}

function netDususuFaktoru(netler: { ad: string; tarih: string; net: number }[]): RiskFaktoru {
  if (netler.length < 2) {
    return {
      id: "net",
      ad: "Net Düşüşü",
      agirlik: 30,
      puan: 0,
      detay: netler.length === 0 ? "Deneme sonucu girilmemiş" : "Düşüş için en az 2 deneme gerekli",
    };
  }
  const son = netler[netler.length - 1];
  const once = netler[netler.length - 2];
  const dusus = once.net - son.net;
  return {
    id: "net",
    ad: "Net Düşüşü",
    agirlik: 30,
    puan: dusus <= 0 ? 0 : Math.min(100, Math.round((dusus / 5) * 100)),
    detay: `Son deneme (${son.ad}): ${son.net} net · önceki deneme: ${once.net} net`,
  };
}

function gorevFaktoru(gorevler: Gorev[], bugun: string): RiskFaktoru {
  const geciken = gorevler.filter((g) => !g.tamamlandi && g.tarih <= bugun).length;
  return {
    id: "gorev",
    ad: "Bitmemiş Görev",
    agirlik: 20,
    puan: Math.min(100, geciken * 25),
    detay: `${geciken} gecikmiş / tamamlanmamış görev`,
  };
}

function yanlisFaktoru(yanlislar: YanlisArsivi[]): RiskFaktoru {
  const cozulmemis = yanlislar.filter((y) => !y.cozuldu).length;
  return {
    id: "yanlis",
    ad: "Çözülmemiş Yanlış",
    agirlik: 20,
    puan: Math.min(100, cozulmemis * 10),
    detay: `${cozulmemis} çözülmemiş yanlış`,
  };
}

function kaynakFaktoru(kitaplar: Kitap[], bugun: string): RiskFaktoru {
  const geciken = kitaplar.filter((k) => k.bitis_hedefi && k.bitis_hedefi < bugun && k.ilerleme < k.toplam);
  return {
    id: "kaynak",
    ad: "Kaynak Gecikmesi",
    agirlik: 15,
    puan: Math.min(100, geciken.length * 50),
    detay:
      geciken.length === 0
        ? "Geciken kaynak yok"
        : geciken.map((k) => `${k.ad} (%${Math.round((k.ilerleme / Math.max(1, k.toplam)) * 100)})`).join(" · "),
  };
}

function tempoFaktoru(calismalar: CalismaKaydi[], bugun: string): RiskFaktoru {
  const son7 = calismalar.filter((c) => c.tarih >= gunEkle(bugun, -6) && c.tarih <= bugun);
  const dk = son7.reduce((a, c) => a + c.sure_dk, 0);
  const saat = Math.round((dk / 60) * 10) / 10;
  return {
    id: "tempo",
    ad: "Düşük Tempo",
    agirlik: 15,
    puan: dk >= 210 ? 0 : Math.round((1 - dk / 210) * 100),
    detay: `Son 7 günde ${saat} saat çalışma (hedef ≥ 3.5 saat)`,
  };
}

function onerileriUret(faktorler: RiskFaktoru[], riskSkoru: number): string[] {
  const o: string[] = [];
  const p = (id: string) => faktorler.find((f) => f.id === id)?.puan ?? 0;
  if (p("net") > 0) o.push("Son denemelerde net düşüşü var — deneme analizi yapıp zayıf konuları belirleyin, öğrenciyle görüşün.");
  if (p("gorev") > 0) o.push("Gecikmiş görevleri tamamlaması için hatırlatın ve net bir süre tanıyın.");
  if (p("yanlis") > 0) o.push("Çözülmemiş yanlışları tekrar planına eklemesini isteyin.");
  if (p("kaynak") > 0) o.push("Kaynak bitiş hedefini güncelleyin veya haftalık planı yeniden ayarlayın.");
  if (p("tempo") > 0) o.push("Haftalık çalışma süresi düşük — günlük çalışma hedefi belirleyip takip edin.");
  if (riskSkoru < 35) o.push("Risk düşük — mevcut ilerlemeyi koruyun, düzenli takibe devam edin.");
  if (o.length === 0) o.push("Düzenli takip yeterli.");
  return o;
}

function seviyeAl(riskSkoru: number): RiskSeviye {
  if (riskSkoru >= 55) return "yuksek";
  if (riskSkoru >= 25) return "orta";
  return "dusuk";
}

export function kocRiskleriniHesapla(v: KocAnalizVerisi): OgrenciRiski[] {
  const bugun = bugunIso();
  const liste: OgrenciRiski[] = [];

  for (const o of v.ogrenciler) {
    const netler = netleriHesapla(v.sonuclar.filter((s) => s.ogrenci_id === o.id));
    const ortalamaNet = netler.length ? Math.round((netler.reduce((a, n) => a + n.net, 0) / netler.length) * 10) / 10 : null;

    const faktorler = [
      netDususuFaktoru(netler),
      gorevFaktoru(v.gorevler.filter((g) => g.ogrenci_id === o.id), bugun),
      yanlisFaktoru(v.yanlislar.filter((y) => y.ogrenci_id === o.id)),
      kaynakFaktoru(v.kitaplar.filter((k) => k.ogrenci_id === o.id), bugun),
      tempoFaktoru(v.calismalar.filter((c) => c.ogrenci_id === o.id), bugun),
    ];

    const toplamAgirlik = faktorler.reduce((a, f) => a + f.agirlik, 0);
    const riskSkoru = Math.round(faktorler.reduce((a, f) => a + f.puan * f.agirlik, 0) / toplamAgirlik);

    liste.push({
      ogrenci_id: o.id,
      ad_soyad: o.ad_soyad,
      aktif: o.aktif,
      riskSkoru,
      seviye: seviyeAl(riskSkoru),
      faktorler: [...faktorler].sort((a, b) => b.puan - a.puan),
      oneriler: onerileriUret(faktorler, riskSkoru),
      ortalamaNet,
      hedefNet: v.profiller.find((p) => p.ogrenci_id === o.id)?.hedef_net ?? null,
    });
  }

  return liste.sort(
    (a, b) => b.riskSkoru - a.riskSkoru || (a.ortalamaNet ?? 0) - (b.ortalamaNet ?? 0)
  );
}
