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
