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
}

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
}

export interface KonuIlerleme {
  id: string;
  ogrenci_id: string;
  konu_id: string;
  tamamlandi: boolean;
  tamamlanma_tarihi: string | null;
}
