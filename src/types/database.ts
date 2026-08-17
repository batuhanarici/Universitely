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
  sube_id?: string | null;
  sube_adi?: string | null;
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
  okul?: string | null;
  sinif?: string | null;
  avatar_url?: string | null;
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
  sube_id?: string | null;
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
  tur: string;
}

export type BildirimTuru = "mesaj" | "hatirlatma" | "uyari" | "toplu" | "talep";

export interface Bildirim {
  id: string;
  alici_id: string;
  tur: BildirimTuru;
  baslik: string;
  detay: string | null;
  gonderici_id: string | null;
  gonderici_adi: string | null;
  ilgili_id: string | null;
  hedef: string | null;
  okundu: boolean;
  arsivlendi: boolean;
  kaynak: string | null;
  created_at: string;
}

export interface HesapSilmeTalebi {
  id: string;
  kullanici_id: string;
  durum: "bekliyor" | "onaylandi" | "reddedildi";
  onaylayan_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface KocNot {
  id: string;
  ogrenci_id: string;
  not_metni: string;
  onem: string;
  created_at: string;
  updated_at: string;
}

export type GorusmeTuru = "gorusme" | "ders";

export interface Gorusme {
  id: string;
  ogrenci_id: string;
  katilimci: string;
  baslik: string;
  tarih: string;
  durum: string;
  notlar: string | null;
  created_at: string;
  tur: GorusmeTuru;
}

export interface OkulDersProgrami {
  id: string;
  ogrenci_id: string;
  gun: number;
  baslangic: string;
  bitis: string;
  ders_adi: string;
  created_at: string;
}

export type GorevDosyaTuru = "kaynak" | "teslim";

export interface OgrenciHedefi {
  id: string;
  ogrenci_id: string;
  tur: "lisans" | "onlisans";
  universite_kodu: string;
  universite_adi: string;
  program_kodu: string;
  program_adi: string;
  program_url: string | null;
  created_at: string;
}

export interface GorevDosyasi {
  id: string;
  gorev_id: string;
  ogrenci_id: string;
  yukleyen_id: string;
  tur: GorevDosyaTuru;
  dosya_adi: string;
  storage_path: string;
  mime_type: string | null;
  boyut: number | null;
  created_at: string;
}

export interface Odeme {
  id: string;
  ogrenci_id: string;
  tutar: number;
  aciklama: string | null;
  tarih: string;
  odendi: boolean;
  created_at: string;
}

export interface VeliAlici {
  id: string;
  ad_soyad: string;
  ogrenci_id: string;
  ogrenci_adi: string;
}

export interface KocSonucSatiri {
  id: string;
  deneme_id: string;
  ogrenci_id: string;
  soru_no: number;
  durum: string;
  deneme_adi: string;
  tarih: string;
  ad_soyad: string;
  konu_adi: string | null;
  ders_adi: string;
}
