import { describe, expect, it } from "vitest";
import { yanlisKonuDagiliminiHesapla } from "./analizHesaplari";
import type { SonucDetay } from "./ogrenciQueries";

function sonuc(konu_adi: string, durum: "dogru" | "yanlis" | "bos"): SonucDetay {
  return {
    id: `${konu_adi}-${durum}`,
    deneme_id: "deneme-1",
    ogrenci_id: "ogrenci-1",
    soru_no: 1,
    durum,
    deneme_adi: "TYT Deneme",
    tarih: "2026-08-17",
    konu_id: null,
    konu_adi,
    ders_adi: "Matematik",
  };
}

describe("yanlisKonuDagiliminiHesapla", () => {
  it("en çok yanlış ve boş yapılan konuları önce sıralar", () => {
    const sonuclar = [
      sonuc("Paragraf", "yanlis"),
      sonuc("Paragraf", "bos"),
      sonuc("Paragraf", "bos"),
      sonuc("Problemler", "yanlis"),
      sonuc("Problemler", "yanlis"),
      sonuc("Fonksiyonlar", "bos"),
      sonuc("Fonksiyonlar", "dogru"),
    ];

    expect(yanlisKonuDagiliminiHesapla(sonuclar)).toEqual([
      { name: "Paragraf", yanlis: 1, bos: 2 },
      { name: "Problemler", yanlis: 2, bos: 0 },
      { name: "Fonksiyonlar", yanlis: 0, bos: 1 },
    ]);
  });

  it("eşit toplamda yanlış sayısını, sonra konu adını kullanır", () => {
    const sonuclar = [
      sonuc("Zarf", "bos"),
      sonuc("Zarf", "bos"),
      sonuc("Analiz", "yanlis"),
      sonuc("Analiz", "bos"),
      sonuc("Bölünebilme", "yanlis"),
      sonuc("Bölünebilme", "bos"),
    ];

    expect(yanlisKonuDagiliminiHesapla(sonuclar).map((o) => o.name)).toEqual([
      "Analiz",
      "Bölünebilme",
      "Zarf",
    ]);
  });

  it("doğru soruları dışarıda bırakır ve limit uygular", () => {
    const sonuclar = [
      sonuc("A", "dogru"),
      sonuc("B", "yanlis"),
      sonuc("C", "bos"),
      sonuc("D", "yanlis"),
    ];

    expect(yanlisKonuDagiliminiHesapla(sonuclar, 2)).toEqual([
      { name: "B", yanlis: 1, bos: 0 },
      { name: "D", yanlis: 1, bos: 0 },
    ]);
  });
});
