import type { KocAnalizVerisi, RiskSeviye } from "./aiMotoru";

export type ErkenUyariTuru = "etkilesimsizlik" | "gorev_gecikmesi" | "tekrarlanan_konu" | "net_dususu" | "yogunluk";

export interface ErkenUyari {
  id: string;
  ogrenci_id: string;
  ad_soyad: string;
  tur: ErkenUyariTuru;
  seviye: RiskSeviye;
  baslik: string;
  aciklama: string;
  kaynak_tarihi: string;
  kaynak_etiketi: string;
  onerilen_aksiyon: string;
}

function isoOf(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function gunEkle(iso: string, gun: number) {
  const tarih = new Date(`${iso}T12:00:00`);
  tarih.setDate(tarih.getDate() + gun);
  return isoOf(tarih);
}

function enYeniTarih(tarihler: string[], varsayilan: string) {
  return tarihler.sort((a, b) => b.localeCompare(a))[0] ?? varsayilan;
}

function tarihFarki(sonTarih: string, bugun: string) {
  const son = new Date(`${sonTarih}T12:00:00`).getTime();
  const bugunMs = new Date(`${bugun}T12:00:00`).getTime();
  return Math.floor((bugunMs - son) / 86400000);
}

function uyariEkle(liste: ErkenUyari[], uyari: Omit<ErkenUyari, "id">) {
  liste.push({ ...uyari, id: `${uyari.ogrenci_id}:${uyari.tur}:${uyari.kaynak_tarihi}` });
}

function tekrarlananKonuSinyali(veri: KocAnalizVerisi, ogrenciId: string, bugun: string) {
  const satirlar = veri.sonuclar.filter((s) => s.ogrenci_id === ogrenciId);
  const denemeTarihleri = Array.from(new Map(satirlar.map((s) => [s.deneme_id, s.tarih])).entries())
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 3)
    .map(([id]) => id);
  if (denemeTarihleri.length < 2) return null;

  const konuMap = new Map<string, { ad: string; sonIki: number; yanlisBos: number; tarih: string }>();
  for (const satir of satirlar.filter((s) => denemeTarihleri.includes(s.deneme_id))) {
    const anahtar = satir.konu_adi ?? "Konu belirtilmemiş";
    const mevcut = konuMap.get(anahtar) ?? { ad: anahtar, sonIki: 0, yanlisBos: 0, tarih: satir.tarih };
    if (satir.durum !== "dogru") mevcut.yanlisBos++;
    mevcut.tarih = satir.tarih > mevcut.tarih ? satir.tarih : mevcut.tarih;
    konuMap.set(anahtar, mevcut);
  }

  const aday = Array.from(konuMap.values())
    .filter((konu) => konu.yanlisBos >= 2)
    .sort((a, b) => b.yanlisBos - a.yanlisBos || b.tarih.localeCompare(a.tarih))[0];
  if (!aday) return null;
  return {
    konu: aday.ad,
    yanlisBos: aday.yanlisBos,
    kaynakTarihi: aday.tarih,
    bugun,
  };
}

export function erkenUyarilariHesapla(veri: KocAnalizVerisi, bugun = isoOf(new Date())): ErkenUyari[] {
  const liste: ErkenUyari[] = [];
  for (const ogrenci of veri.ogrenciler.filter((o) => o.aktif)) {
    const calismalar = veri.calismalar.filter((c) => c.ogrenci_id === ogrenci.id).sort((a, b) => b.tarih.localeCompare(a.tarih));
    const gorevler = veri.gorevler.filter((g) => g.ogrenci_id === ogrenci.id);
    const sonCalisma = calismalar[0]?.tarih ?? null;
    const etkilesimGun = sonCalisma ? tarihFarki(sonCalisma, bugun) : 30;
    if (etkilesimGun >= 7) {
      uyariEkle(liste, {
        ogrenci_id: ogrenci.id,
        ad_soyad: ogrenci.ad_soyad,
        tur: "etkilesimsizlik",
        seviye: etkilesimGun >= 14 ? "yuksek" : "orta",
        baslik: etkilesimGun >= 14 ? "Uzun süredir görünür çalışma yok" : "Çalışma etkileşimi azaldı",
        aciklama: sonCalisma ? `Son kayıt ${etkilesimGun} gün önce (${sonCalisma}). Bu sinyal öğrencinin motivasyonu veya planın uygulanabilirliği hakkında kısa bir kontrol gerektirir.` : "Henüz kayıtlı bir çalışma görünmüyor. Önce öğrencinin haftalık planını ve erişim durumunu kontrol edin.",
        kaynak_tarihi: sonCalisma ?? gunEkle(bugun, -30),
        kaynak_etiketi: sonCalisma ? `Son çalışma kaydı: ${sonCalisma}` : "Çalışma kaydı bulunamadı",
        onerilen_aksiyon: "Kısa ve yargılayıcı olmayan bir mesaj gönderin; planı küçültüp ilk uygulanabilir bloğu birlikte belirleyin.",
      });
    }

    const geciken = gorevler.filter((g) => !g.tamamlandi && g.tarih < bugun);
    if (geciken.length >= 2) {
      const kaynakTarihi = enYeniTarih(geciken.map((g) => g.tarih), bugun);
      uyariEkle(liste, {
        ogrenci_id: ogrenci.id,
        ad_soyad: ogrenci.ad_soyad,
        tur: "gorev_gecikmesi",
        seviye: geciken.length >= 4 ? "yuksek" : "orta",
        baslik: `${geciken.length} görev gecikmiş görünüyor`,
        aciklama: `Tamamlanmamış görevlerin son tarihi ${kaynakTarihi} tarihinden beri birikiyor. Sinyal, öğrencinin kapasitesine göre görev yoğunluğunu yeniden ayarlama ihtiyacını gösterir.`,
        kaynak_tarihi: kaynakTarihi,
        kaynak_etiketi: `${geciken.length} gecikmiş görev · en yakın son tarih ${kaynakTarihi}`,
        onerilen_aksiyon: "En kritik tek görevi seçin, kalanları parçalara bölün veya tarihlerini öğrenciyle birlikte yeniden planlayın.",
      });
    }

    const tekrar = tekrarlananKonuSinyali(veri, ogrenci.id, bugun);
    if (tekrar) {
      uyariEkle(liste, {
        ogrenci_id: ogrenci.id,
        ad_soyad: ogrenci.ad_soyad,
        tur: "tekrarlanan_konu",
        seviye: tekrar.yanlisBos >= 4 ? "yuksek" : "orta",
        baslik: `${tekrar.konu} konusunda tekrar eden zorlanma`,
        aciklama: `Son denemelerde ${tekrar.konu} konusunda ${tekrar.yanlisBos} yanlış/boş kayıt var. Bu veri tanı koymaz; yalnızca koçun konu çalışma sürecini gözden geçirmesine yardımcı olur.`,
        kaynak_tarihi: tekrar.kaynakTarihi,
        kaynak_etiketi: `${tekrar.konu} · son deneme tarihi ${tekrar.kaynakTarihi}`,
        onerilen_aksiyon: "Bir sonraki seans için öğrenciden hatanın nedenini açıklamasını isteyin ve küçük bir tekrar görevi belirleyin.",
      });
    }

    const netler = new Map<string, { tarih: string; dogru: number; yanlis: number }>();
    for (const satir of veri.sonuclar.filter((s) => s.ogrenci_id === ogrenci.id)) {
      const mevcut = netler.get(satir.deneme_id) ?? { tarih: satir.tarih, dogru: 0, yanlis: 0 };
      if (satir.durum === "dogru") mevcut.dogru++;
      if (satir.durum === "yanlis") mevcut.yanlis++;
      netler.set(satir.deneme_id, mevcut);
    }
    const siraliNetler = Array.from(netler.values()).sort((a, b) => a.tarih.localeCompare(b.tarih));
    if (siraliNetler.length >= 2) {
      const son = siraliNetler[siraliNetler.length - 1];
      const onceki = siraliNetler[siraliNetler.length - 2];
      const sonNet = son.dogru - son.yanlis / 4;
      const oncekiNet = onceki.dogru - onceki.yanlis / 4;
      const fark = Math.round((sonNet - oncekiNet) * 10) / 10;
      if (fark <= -3) {
        uyariEkle(liste, {
          ogrenci_id: ogrenci.id,
          ad_soyad: ogrenci.ad_soyad,
          tur: "net_dususu",
          seviye: fark <= -6 ? "yuksek" : "orta",
          baslik: `Son denemede ${Math.abs(fark)} net düşüşü`,
          aciklama: `Son deneme ${Math.round(sonNet * 10) / 10} net, önceki deneme ${Math.round(oncekiNet * 10) / 10} net. Sonuç tek başına kesin bir akademik hüküm değildir; deneme koşullarını ve konu dağılımını birlikte inceleyin.`,
          kaynak_tarihi: son.tarih,
          kaynak_etiketi: `Deneme karşılaştırması · ${onceki.tarih} → ${son.tarih}`,
          onerilen_aksiyon: "Önce sınav koşullarını ve süre kullanımını sorup ardından en büyük konu kaybı için tek bir aksiyon seçin.",
        });
      }
    }

    const yakinGorevler = gorevler.filter((g) => !g.tamamlandi && g.tarih >= bugun && g.tarih <= gunEkle(bugun, 2));
    if (yakinGorevler.length >= 4) {
      uyariEkle(liste, {
        ogrenci_id: ogrenci.id,
        ad_soyad: ogrenci.ad_soyad,
        tur: "yogunluk",
        seviye: "orta",
        baslik: "Önümüzdeki üç gün görev yoğunluğu yüksek",
        aciklama: `Önümüzdeki üç günde ${yakinGorevler.length} tamamlanmamış görev var. Sinyal, hedeflerin öğrencinin gerçek müsaitliğiyle birlikte gözden geçirilmesini önerir.`,
        kaynak_tarihi: bugun,
        kaynak_etiketi: `Yaklaşan 3 gün · ${yakinGorevler.length} görev`,
        onerilen_aksiyon: "Görevleri önem sırasına koyun; kritik olmayanları erteleyip günlük planda çakışmayı önleyin.",
      });
    }
  }
  return liste.sort((a, b) => (a.seviye === "yuksek" ? 0 : 1) - (b.seviye === "yuksek" ? 0 : 1) || b.kaynak_tarihi.localeCompare(a.kaynak_tarihi));
}
