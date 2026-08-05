export interface Ders {
  id: string;
  ad: string;
}

export interface Konu {
  id: string;
  ders_id: string;
  ad: string;
}

export interface Ogrenci {
  id: string;
  ad_soyad: string;
}

export interface DenemeSablonu {
  id: string;
  ad: string;
  ders_id: string | null;
}

export interface SablonSorusu {
  id: string;
  sablon_id: string;
  soru_no: number;
  konu_id: string | null;
}

export interface Deneme {
  id: string;
  sablon_id: string | null;
  ad: string;
  tarih: string;
  tur: DenemeTuru | null;
}

export type DenemeTuru = "tyt" | "ayt" | "brans";

export type SoruDurumu = "dogru" | "yanlis" | "bos";

export interface Sonuc {
  id: string;
  deneme_id: string;
  ogrenci_id: string;
  soru_no: number;
  durum: SoruDurumu;
}

export interface TekrarDurumu {
  sonuc_id: string;
  cozuldu: boolean;
}

export type SinavTuru = "tyt" | "ayt" | "her_ikisi";

export interface OgrenciProfili {
  ogrenci_id: string;
  hedef_universite: string | null;
  hedef_bolum: string | null;
  sinav_turu: SinavTuru;
  hedef_net: number | null;
  email_bildirim: boolean;
}

export interface CalismaKaydi {
  id: string;
  ogrenci_id: string;
  tarih: string;
  sure_dk: number;
  soru_sayisi: number | null;
  konu_id: string | null;
  not: string | null;
}

export type GorevTipi = "gunluk" | "haftalik" | "koc";

export interface Gorev {
  id: string;
  ogrenci_id: string;
  tarih: string;
  baslik: string;
  tip: GorevTipi;
  tamamlandi: boolean;
  kontrol_edildi: boolean;
  geri_bildirim: string | null;
}

export interface KonuIlerleme {
  id: string;
  ogrenci_id: string;
  konu_id: string;
  tamamlandi: boolean;
  tamamlanma_tarihi: string | null;
}

export type KaynakTuru = "kitap" | "soru_bankasi" | "deneme" | "video";

export interface Kitap {
  id: string;
  ogrenci_id: string;
  ad: string;
  kaynak_turu: KaynakTuru;
  toplam: number;
  ilerleme: number;
  baslangic_tarihi: string | null;
  bitis_hedefi: string | null;
}

export interface YanlisArsivi {
  id: string;
  ogrenci_id: string;
  konu_id: string | null;
  kaynak_adi: string | null;
  sayfa_no: number | null;
  soru_no: number | null;
  aciklama: string | null;
  cozuldu: boolean;
  eklenme_tarihi: string;
}

export interface TekrarPlan {
  id: string;
  ogrenci_id: string;
  aciklama: string;
  yanlis_id: string | null;
  plan_tarihi: string;
  yapildi: boolean;
}

export interface Mesaj {
  id: string;
  gonderici_id: string;
  alici_id: string;
  icerik: string;
  tarih: string;
  okundu: boolean;
}
