import type { SonucDetay } from "./ogrenciQueries";

export interface KonuYanlisOzeti {
  konu_adi: string;
  yanlis: number;
  bos: number;
}

export interface KonuYanlisGrafikVerisi {
  name: string;
  yanlis: number;
  bos: number;
}

/**
 * Yanlış ve boş soruları konu bazında toplar.
 * En yüksek toplam problem sayısı ilk sırada olacak şekilde sıralar.
 * Eşitlikte yanlış sayısı, ardından konu adı deterministik ikinci ölçüttür.
 */
export function yanlisKonuDagiliminiHesapla(
  sonuclar: SonucDetay[],
  limit = 10,
): KonuYanlisGrafikVerisi[] {
  const map = new Map<string, KonuYanlisOzeti>();

  for (const sonuc of sonuclar) {
    if (sonuc.durum === "dogru") continue;

    if (!map.has(sonuc.konu_adi)) {
      map.set(sonuc.konu_adi, { konu_adi: sonuc.konu_adi, yanlis: 0, bos: 0 });
    }

    const ozet = map.get(sonuc.konu_adi)!;
    if (sonuc.durum === "yanlis") ozet.yanlis++;
    else ozet.bos++;
  }

  return Array.from(map.values())
    .sort((a, b) => {
      const toplamFarki = b.yanlis + b.bos - (a.yanlis + a.bos);
      if (toplamFarki !== 0) return toplamFarki;

      const yanlisFarki = b.yanlis - a.yanlis;
      if (yanlisFarki !== 0) return yanlisFarki;

      return a.konu_adi.localeCompare(b.konu_adi, "tr");
    })
    .slice(0, limit)
    .map((o) => ({ name: o.konu_adi, yanlis: o.yanlis, bos: o.bos }));
}
