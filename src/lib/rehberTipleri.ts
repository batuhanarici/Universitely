// Onboarding turu ve Yardım sayfalarının paylaştığı ortak tipler.
// Her panelin (koç/öğrenci/veli) kendi içerik dosyası bu tipleri kullanır.

export interface RehberSayfa {
  label: string;
  aciklama: string;
}

export interface RehberGrup {
  baslik: string;
  ozet: string;
  sayfalar: RehberSayfa[];
  /** Sidebar'da 1:1 eşleşen tek bir nav grubu varsa (data-tur-grup değeri). */
  hedefGrup?: string;
  /** Birden fazla sidebar öğesini tek bir kutuda birleştirmek için (data-tur-oge değerleri).
   *  Öğeler sidebar'da ARDIŞIK olmalı, aksi halde aradaki alakasız öğeler de kutuya girer. */
  hedefOgeler?: string[];
}

export interface RehberGiris {
  baslik: string;
  aciklama: string;
}
