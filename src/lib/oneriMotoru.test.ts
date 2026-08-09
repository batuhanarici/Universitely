import { describe, it, expect } from "vitest";
import { onerileriUret, bugunIso, gunEkle, type MotorVerisi } from "./oneriMotoru";

function bosVeri(): MotorVerisi {
  return {
    calismalar: [],
    gorevler: [],
    kitaplar: [],
    yanlislar: [],
    planlar: [],
    sonuclar: [],
    profil: null,
  };
}

describe("onerileriUret — zayıf konu tespiti", () => {
  it("%55 altındaki konuyu 'Konu Eksikleri' olarak işaretler", () => {
    const v = bosVeri();
    // Matematik: 2/10 doğru -> %20 (zayıf)
    v.sonuclar = [
      ...Array.from({ length: 2 }, () => ({ deneme_id: "d1", konu_adi: "Matematik", durum: "dogru" } as any)),
      ...Array.from({ length: 8 }, () => ({ deneme_id: "d1", konu_adi: "Matematik", durum: "yanlis" } as any)),
    ];
    const oneriler = onerileriUret(v);
    const konuOnerisi = oneriler.find((o) => o.kategori === "Konu Eksikleri");
    expect(konuOnerisi).toBeDefined();
    expect(konuOnerisi?.oncelik).toBe("yuksek");
    expect(konuOnerisi?.baslik).toContain("Matematik");
  });

  it("%55 ve üzerindeki konuyu zayıf konu olarak işaretlemez", () => {
    const v = bosVeri();
    // Fizik: 6/10 doğru -> %60 (zayıf değil, eşiğin üstünde)
    v.sonuclar = [
      ...Array.from({ length: 6 }, () => ({ deneme_id: "d1", konu_adi: "Fizik", durum: "dogru" } as any)),
      ...Array.from({ length: 4 }, () => ({ deneme_id: "d1", konu_adi: "Fizik", durum: "yanlis" } as any)),
    ];
    const oneriler = onerileriUret(v);
    expect(oneriler.find((o) => o.kategori === "Konu Eksikleri")).toBeUndefined();
  });

  it("%50 başarı eşiğin (%55) altında kaldığı için zayıf konu sayılır", () => {
    const v = bosVeri();
    // Kimya: 5/10 doğru -> %50 (55 eşiğinin altında, zayıf sayılmalı)
    v.sonuclar = [
      ...Array.from({ length: 5 }, () => ({ deneme_id: "d1", konu_adi: "Kimya", durum: "dogru" } as any)),
      ...Array.from({ length: 5 }, () => ({ deneme_id: "d1", konu_adi: "Kimya", durum: "yanlis" } as any)),
    ];
    const oneriler = onerileriUret(v);
    expect(oneriler.find((o) => o.kategori === "Konu Eksikleri")?.baslik).toContain("Kimya");
  });

  it("en fazla 3 zayıf konu önerir", () => {
    const v = bosVeri();
    const konular = ["A", "B", "C", "D", "E"];
    v.sonuclar = konular.flatMap((k) => [
      { deneme_id: "d1", konu_adi: k, durum: "yanlis" } as any,
      { deneme_id: "d1", konu_adi: k, durum: "yanlis" } as any,
    ]);
    const oneriler = onerileriUret(v);
    const konuOnerisi = oneriler.find((o) => o.kategori === "Konu Eksikleri");
    // başlıkta virgülle ayrılmış en fazla 3 konu adı olmalı
    const konuSayisi = konuOnerisi?.baslik.split(",").length ?? 0;
    expect(konuSayisi).toBeLessThanOrEqual(3);
  });
});

describe("onerileriUret — çözülmemiş yanlış ve tekrar planı", () => {
  it("çözülmemiş yanlış varsa 'Yanlış Arşivi' önerisi üretir", () => {
    const v = bosVeri();
    v.yanlislar = [{ cozuldu: false } as any, { cozuldu: true } as any];
    const oneriler = onerileriUret(v);
    const oneri = oneriler.find((o) => o.kategori === "Yanlış Arşivi");
    expect(oneri).toBeDefined();
    expect(oneri?.baslik).toContain("1");
  });

  it("çözülmemiş yanlış yoksa 'Yanlış Arşivi' önerisi üretmez", () => {
    const v = bosVeri();
    v.yanlislar = [{ cozuldu: true } as any];
    const oneriler = onerileriUret(v);
    expect(oneriler.find((o) => o.kategori === "Yanlış Arşivi")).toBeUndefined();
  });

  it("bugüne ait yapılmamış tekrar varsa 'Tekrar Planı' önerisi üretir", () => {
    const v = bosVeri();
    const bugun = bugunIso();
    v.planlar = [{ plan_tarihi: bugun, yapildi: false } as any, { plan_tarihi: bugun, yapildi: true } as any];
    const oneriler = onerileriUret(v);
    expect(oneriler.find((o) => o.kategori === "Tekrar Planı")?.baslik).toContain("1");
  });
});

describe("onerileriUret — hedef net karşılaştırması", () => {
  it("ortalama net hedefin altındaysa öncelik farkla orantılı belirlenir", () => {
    const v = bosVeri();
    v.profil = { hedef_net: 90 } as any;
    // ortalama net: 5/10 doğru = net 5 (10 fark > 10 -> yuksek öncelik)
    v.sonuclar = [
      ...Array.from({ length: 5 }, () => ({ deneme_id: "d1", konu_adi: "X", durum: "dogru" } as any)),
      ...Array.from({ length: 5 }, () => ({ deneme_id: "d1", konu_adi: "X", durum: "yanlis" } as any)),
    ];
    const oneriler = onerileriUret(v);
    const hedefOnerisi = oneriler.find((o) => o.kategori === "Hedef");
    expect(hedefOnerisi?.oncelik).toBe("yuksek");
    expect(hedefOnerisi?.baslik).toContain("kaldı");
  });

  it("ortalama net hedefi geçtiyse tebrik mesajı üretir, öncelik düşük olur", () => {
    const v = bosVeri();
    v.profil = { hedef_net: 3 } as any;
    v.sonuclar = Array.from({ length: 10 }, () => ({ deneme_id: "d1", konu_adi: "X", durum: "dogru" } as any));
    const oneriler = onerileriUret(v);
    const hedefOnerisi = oneriler.find((o) => o.kategori === "Hedef");
    expect(hedefOnerisi?.oncelik).toBe("dusuk");
    expect(hedefOnerisi?.baslik).toContain("geçtin");
  });

  it("profil veya sonuç yoksa 'Hedef' önerisi hiç üretilmez", () => {
    const v = bosVeri();
    const oneriler = onerileriUret(v);
    expect(oneriler.find((o) => o.kategori === "Hedef")).toBeUndefined();
  });
});

describe("onerileriUret — çalışma temposu", () => {
  it("son 7 günde 3.5 saatten az çalışma 'orta' öncelikli uyarı üretir", () => {
    const v = bosVeri();
    const bugun = bugunIso();
    v.calismalar = [{ tarih: bugun, sure_dk: 60 } as any];
    const oneriler = onerileriUret(v);
    const tempo = oneriler.find((o) => o.kategori === "Çalışma Temposu");
    expect(tempo?.oncelik).toBe("orta");
  });

  it("son 7 günde 3.5 saat ve üzeri çalışma 'dusuk' öncelikli olumlu mesaj üretir", () => {
    const v = bosVeri();
    const bugun = bugunIso();
    v.calismalar = [{ tarih: bugun, sure_dk: 300 } as any];
    const oneriler = onerileriUret(v);
    const tempo = oneriler.find((o) => o.kategori === "Çalışma Temposu");
    expect(tempo?.oncelik).toBe("dusuk");
  });

  it("7 günden eski çalışma kayıtları tempo hesabına dahil edilmez", () => {
    const v = bosVeri();
    const bugun = bugunIso();
    v.calismalar = [{ tarih: gunEkle(bugun, -10), sure_dk: 600 } as any];
    const oneriler = onerileriUret(v);
    const tempo = oneriler.find((o) => o.kategori === "Çalışma Temposu");
    // eski kayıt sayılmadığı için düşük tempo uyarısı (orta öncelik) gelmeli
    expect(tempo?.oncelik).toBe("orta");
  });
});

describe("onerileriUret — sıralama", () => {
  it("öneriler öncelik sırasına göre (yüksek, orta, düşük) sıralanır", () => {
    const v = bosVeri();
    const bugun = bugunIso();
    v.yanlislar = [{ cozuldu: false } as any]; // yüksek
    v.gorevler = [{ tarih: bugun, tamamlandi: false } as any]; // orta
    v.calismalar = [{ tarih: bugun, sure_dk: 300 } as any]; // dusuk (tempo iyi)
    const oneriler = onerileriUret(v);
    const oncelikSirasi: Record<string, number> = { yuksek: 0, orta: 1, dusuk: 2 };
    for (let i = 1; i < oneriler.length; i++) {
      expect(oncelikSirasi[oneriler[i].oncelik]).toBeGreaterThanOrEqual(oncelikSirasi[oneriler[i - 1].oncelik]);
    }
  });

  it("hiç veri yokken bile en az bir öneri döner (deneme girilmemiş uyarısı)", () => {
    const oneriler = onerileriUret(bosVeri());
    expect(oneriler.length).toBeGreaterThan(0);
    expect(oneriler.find((o) => o.kategori === "Deneme")).toBeDefined();
  });
});
