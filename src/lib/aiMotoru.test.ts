import { describe, it, expect } from "vitest";
import { kocRiskleriniHesapla, bugunIso, gunEkle, type KocAnalizVerisi } from "./aiMotoru";
import type { KocOgrencisi } from "./ogrenciYonetimQueries";

function ogrenci(id: string, ad = "Test Öğrenci"): KocOgrencisi {
  return { id, ad_soyad: ad, aktif: true } as KocOgrencisi;
}

function bosVeri(ogrenciler: KocOgrencisi[]): KocAnalizVerisi {
  return {
    ogrenciler,
    sonuclar: [],
    calismalar: [],
    gorevler: [],
    kitaplar: [],
    yanlislar: [],
    planlar: [],
    profiller: [],
  };
}

describe("gunEkle / bugunIso", () => {
  it("gunEkle pozitif gün ekler", () => {
    expect(gunEkle("2026-01-01", 5)).toBe("2026-01-06");
  });

  it("gunEkle negatif gün çıkarır", () => {
    expect(gunEkle("2026-01-10", -3)).toBe("2026-01-07");
  });

  it("gunEkle ay sınırını doğru geçer", () => {
    expect(gunEkle("2026-01-30", 3)).toBe("2026-02-02");
  });

  it("bugunIso geçerli bir YYYY-MM-DD formatı döner", () => {
    expect(bugunIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("kocRiskleriniHesapla — hiç veri yokken", () => {
  it("veri olmayan öğrenci için düşük risk döner (yüksek risk değil)", () => {
    const v = bosVeri([ogrenci("o1")]);
    const [risk] = kocRiskleriniHesapla(v);
    expect(risk.ogrenci_id).toBe("o1");
    expect(risk.seviye).toBe("dusuk");
    expect(risk.ortalamaNet).toBeNull();
  });

  it("öğrenci listesi boşsa boş dizi döner", () => {
    expect(kocRiskleriniHesapla(bosVeri([]))).toEqual([]);
  });
});

describe("kocRiskleriniHesapla — net düşüşü", () => {
  it("son deneme öncekinden düşükse risk puanı artar", () => {
    const bugun = bugunIso();
    const v = bosVeri([ogrenci("o1")]);
    v.sonuclar = [
      // Deneme 1: 10 doğru, 0 yanlış -> net 10
      { ogrenci_id: "o1", deneme_id: "d1", deneme_adi: "Deneme 1", tarih: gunEkle(bugun, -14), durum: "dogru" } as any,
      // Deneme 2: 2 doğru, 8 yanlış -> net 0
      { ogrenci_id: "o1", deneme_id: "d2", deneme_adi: "Deneme 2", tarih: gunEkle(bugun, -7), durum: "yanlis" } as any,
    ];
    // Deneme 1 için 10 doğru satırı üretelim
    v.sonuclar = [
      ...Array.from({ length: 10 }, () => ({ ogrenci_id: "o1", deneme_id: "d1", deneme_adi: "Deneme 1", tarih: gunEkle(bugun, -14), durum: "dogru" } as any)),
      ...Array.from({ length: 8 }, () => ({ ogrenci_id: "o1", deneme_id: "d2", deneme_adi: "Deneme 2", tarih: gunEkle(bugun, -7), durum: "yanlis" } as any)),
    ];
    const [risk] = kocRiskleriniHesapla(v);
    const netFaktor = risk.faktorler.find((f) => f.id === "net")!;
    expect(netFaktor.puan).toBeGreaterThan(0);
  });

  it("net yükseliyorsa net düşüşü faktörü 0 puan verir", () => {
    const bugun = bugunIso();
    const v = bosVeri([ogrenci("o1")]);
    v.sonuclar = [
      ...Array.from({ length: 5 }, () => ({ ogrenci_id: "o1", deneme_id: "d1", deneme_adi: "Deneme 1", tarih: gunEkle(bugun, -14), durum: "dogru" } as any)),
      ...Array.from({ length: 10 }, () => ({ ogrenci_id: "o1", deneme_id: "d2", deneme_adi: "Deneme 2", tarih: gunEkle(bugun, -7), durum: "dogru" } as any)),
    ];
    const [risk] = kocRiskleriniHesapla(v);
    const netFaktor = risk.faktorler.find((f) => f.id === "net")!;
    expect(netFaktor.puan).toBe(0);
  });
});

describe("kocRiskleriniHesapla — gecikmiş görev ve çözülmemiş yanlış", () => {
  it("gecikmiş görevler risk puanını yükseltir", () => {
    const bugun = bugunIso();
    const v = bosVeri([ogrenci("o1")]);
    v.gorevler = [
      { ogrenci_id: "o1", tamamlandi: false, tarih: gunEkle(bugun, -2) } as any,
      { ogrenci_id: "o1", tamamlandi: false, tarih: gunEkle(bugun, -1) } as any,
    ];
    const [risk] = kocRiskleriniHesapla(v);
    const gorevFaktor = risk.faktorler.find((f) => f.id === "gorev")!;
    expect(gorevFaktor.puan).toBe(50); // 2 gecikmiş * 25
  });

  it("tamamlanmış görevler risk puanına dahil edilmez", () => {
    const bugun = bugunIso();
    const v = bosVeri([ogrenci("o1")]);
    v.gorevler = [{ ogrenci_id: "o1", tamamlandi: true, tarih: gunEkle(bugun, -2) } as any];
    const [risk] = kocRiskleriniHesapla(v);
    const gorevFaktor = risk.faktorler.find((f) => f.id === "gorev")!;
    expect(gorevFaktor.puan).toBe(0);
  });

  it("çözülmemiş yanlışlar risk puanına dahil edilir, çözülenler edilmez", () => {
    const v = bosVeri([ogrenci("o1")]);
    v.yanlislar = [
      { ogrenci_id: "o1", cozuldu: false } as any,
      { ogrenci_id: "o1", cozuldu: false } as any,
      { ogrenci_id: "o1", cozuldu: true } as any,
    ];
    const [risk] = kocRiskleriniHesapla(v);
    const yanlisFaktor = risk.faktorler.find((f) => f.id === "yanlis")!;
    expect(yanlisFaktor.puan).toBe(20); // 2 çözülmemiş * 10
  });
});

describe("kocRiskleriniHesapla — risk seviyesi eşikleri", () => {
  it("riskSkoru >= 55 ise seviye 'yuksek' olur", () => {
    const bugun = bugunIso();
    const v = bosVeri([ogrenci("o1")]);
    // Tüm faktörleri maksimuma yakın tetikleyelim: çok gecikmiş görev + çok yanlış + geciken kaynak + düşük tempo
    v.gorevler = Array.from({ length: 5 }, () => ({ ogrenci_id: "o1", tamamlandi: false, tarih: gunEkle(bugun, -1) } as any));
    v.yanlislar = Array.from({ length: 15 }, () => ({ ogrenci_id: "o1", cozuldu: false } as any));
    v.kitaplar = [{ ogrenci_id: "o1", ad: "Kitap", bitis_hedefi: gunEkle(bugun, -5), ilerleme: 1, toplam: 10 } as any];
    const [risk] = kocRiskleriniHesapla(v);
    expect(risk.seviye).toBe("yuksek");
    expect(risk.riskSkoru).toBeGreaterThanOrEqual(55);
  });

  it("hiçbir risk faktörü tetiklenmezse seviye 'dusuk' olur", () => {
    const bugun = bugunIso();
    const v = bosVeri([ogrenci("o1")]);
    // Yeterli çalışma temposu ile hiçbir faktör tetiklenmesin
    v.calismalar = [{ ogrenci_id: "o1", tarih: bugun, sure_dk: 300 } as any];
    const [risk] = kocRiskleriniHesapla(v);
    expect(risk.seviye).toBe("dusuk");
    expect(risk.riskSkoru).toBeLessThan(25);
  });
});

describe("kocRiskleriniHesapla — sıralama", () => {
  it("öğrenciler risk skoruna göre azalan sırada döner", () => {
    const bugun = bugunIso();
    const v = bosVeri([ogrenci("dusukRisk"), ogrenci("yuksekRisk")]);
    v.gorevler = Array.from({ length: 5 }, () => ({ ogrenci_id: "yuksekRisk", tamamlandi: false, tarih: gunEkle(bugun, -1) } as any));
    v.yanlislar = Array.from({ length: 10 }, () => ({ ogrenci_id: "yuksekRisk", cozuldu: false } as any));
    const sonuc = kocRiskleriniHesapla(v);
    expect(sonuc[0].ogrenci_id).toBe("yuksekRisk");
    expect(sonuc[1].ogrenci_id).toBe("dusukRisk");
  });

  it("hedefNet, profil kaydından öğrenciye doğru eşleşir", () => {
    const v = bosVeri([ogrenci("o1"), ogrenci("o2")]);
    v.profiller = [
      { ogrenci_id: "o1", hedef_net: 90 } as any,
      { ogrenci_id: "o2", hedef_net: 60 } as any,
    ];
    const sonuc = kocRiskleriniHesapla(v);
    expect(sonuc.find((r) => r.ogrenci_id === "o1")?.hedefNet).toBe(90);
    expect(sonuc.find((r) => r.ogrenci_id === "o2")?.hedefNet).toBe(60);
  });
});
