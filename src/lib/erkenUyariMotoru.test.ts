import { describe, expect, it } from "vitest";
import { erkenUyarilariHesapla } from "./erkenUyariMotoru";
import type { KocAnalizVerisi } from "./aiMotoru";

function veri(): KocAnalizVerisi {
  return {
    ogrenciler: [{ id: "ogrenci-1", ad_soyad: "Ayşe Yılmaz", aktif: true, davet_kodu: null, sube_id: null, sube_adi: null }],
    sonuclar: [],
    calismalar: [],
    gorevler: [],
    kitaplar: [],
    yanlislar: [],
    planlar: [],
    profiller: [],
  };
}

describe("erkenUyariMotoru", () => {
  it("yedi günden uzun etkileşimsizliği sinyal olarak üretir", () => {
    const uyarilar = erkenUyarilariHesapla(veri(), "2026-08-17");
    expect(uyarilar.some((uyari) => uyari.tur === "etkilesimsizlik")).toBe(true);
  });

  it("iki gecikmiş görevi iletişim adımıyla bildirir", () => {
    const v = veri();
    v.calismalar = [{ id: "calisma-1", ogrenci_id: "ogrenci-1", tarih: "2026-08-15", sure_dk: 30, soru_sayisi: null, konu_id: null, not: null }];
    v.gorevler = [
      { id: "gorev-1", ogrenci_id: "ogrenci-1", baslik: "Görev 1", tarih: "2026-08-10", tip: "koc", tamamlandi: false, kontrol_edildi: false, geri_bildirim: null },
      { id: "gorev-2", ogrenci_id: "ogrenci-1", baslik: "Görev 2", tarih: "2026-08-11", tip: "koc", tamamlandi: false, kontrol_edildi: false, geri_bildirim: null },
    ];
    const uyari = erkenUyarilariHesapla(v, "2026-08-17").find((kayit) => kayit.tur === "gorev_gecikmesi");
    expect(uyari?.aciklama).toContain("2");
    expect(uyari?.onerilen_aksiyon).toContain("kritik");
  });

  it("son iki denemede aynı konuda tekrarlanan yanlışları yakalar", () => {
    const v = veri();
    v.calismalar = [{ id: "calisma-1", ogrenci_id: "ogrenci-1", tarih: "2026-08-16", sure_dk: 45, soru_sayisi: null, konu_id: null, not: null }];
    v.sonuclar = [
      { id: "s1", deneme_id: "d1", ogrenci_id: "ogrenci-1", soru_no: 1, durum: "yanlis", deneme_adi: "Deneme 1", tarih: "2026-08-10", ad_soyad: "Ayşe Yılmaz", konu_adi: "Fonksiyonlar", ders_adi: "Matematik" },
      { id: "s2", deneme_id: "d2", ogrenci_id: "ogrenci-1", soru_no: 1, durum: "bos", deneme_adi: "Deneme 2", tarih: "2026-08-16", ad_soyad: "Ayşe Yılmaz", konu_adi: "Fonksiyonlar", ders_adi: "Matematik" },
    ];
    expect(erkenUyarilariHesapla(v, "2026-08-17").some((uyari) => uyari.tur === "tekrarlanan_konu")).toBe(true);
  });

  it("üç netlik düşüşünde yargılayıcı olmayan net sinyali üretir", () => {
    const v = veri();
    v.sonuclar = [
      ...Array.from({ length: 10 }, (_, i) => ({ id: `s1-${i}`, deneme_id: "d1", ogrenci_id: "ogrenci-1", soru_no: i + 1, durum: "dogru" as const, deneme_adi: "Deneme 1", tarih: "2026-08-10", ad_soyad: "Ayşe Yılmaz", konu_adi: "Problemler", ders_adi: "Matematik" })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: `s2-${i}`, deneme_id: "d2", ogrenci_id: "ogrenci-1", soru_no: i + 1, durum: i < 4 ? "dogru" as const : "yanlis" as const, deneme_adi: "Deneme 2", tarih: "2026-08-16", ad_soyad: "Ayşe Yılmaz", konu_adi: "Problemler", ders_adi: "Matematik" })),
    ];
    const uyari = erkenUyarilariHesapla(v, "2026-08-17").find((kayit) => kayit.tur === "net_dususu");
    expect(uyari?.aciklama).toContain("kesin");
  });
});
