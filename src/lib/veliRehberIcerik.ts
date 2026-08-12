import type { RehberGrup, RehberGiris } from "./rehberTipleri";

export const veliRehberGiris: RehberGiris = {
  baslik: "Universitely'e Hoş Geldiniz",
  aciklama:
    "Veli panelini birkaç ekranda kısaca tanıtalım. İstediğiniz zaman bu turu Yardım menüsünden tekrar açabilirsiniz.",
};

// Veli panelinde sidebar'da teknik olarak tek grup var ("Çocuğum"), bu yüzden
// tur burada tek nav grubuna değil, birden fazla ardışık sidebar öğesini
// (hedefOgeler) birleştirerek kendi mantıksal kümelerine ayrılıyor.
export const veliRehberGruplari: RehberGrup[] = [
  {
    baslik: "Genel Bakış",
    ozet: "Çocuğunuzun genel durumunu ve performans grafiklerini buradan takip edersiniz.",
    hedefOgeler: ["Genel Durum", "Grafikler"],
    sayfalar: [
      { label: "Genel Durum", aciklama: "Çocuğunuzun özet görünümü, son deneme sonuçları." },
      { label: "Grafikler", aciklama: "Zaman içindeki net değişimini grafiklerle görürsünüz." },
    ],
  },
  {
    baslik: "Planlama & Bildirimler",
    ozet: "Haftalık program ve sistem bildirimleri burada.",
    hedefOgeler: ["Takvim", "Bildirimler"],
    sayfalar: [
      { label: "Takvim", aciklama: "Çocuğunuzun haftalık çalışma programını görürsünüz." },
      { label: "Bildirimler", aciklama: "Sistemden gelen bildirimleri buradan takip edersiniz." },
    ],
  },
  {
    baslik: "Rapor & İletişim",
    ozet: "Detaylı raporlar, AI özet ve koçla iletişim burada.",
    hedefOgeler: ["Rapor", "AI Özet", "Koça Mesaj"],
    sayfalar: [
      { label: "Rapor", aciklama: "Çocuğunuzun detaylı performans raporu." },
      { label: "AI Özet", aciklama: "Otomatik olarak hazırlanan kısa durum özeti." },
      { label: "Koça Mesaj", aciklama: "Çocuğunuzun koçuyla doğrudan mesajlaşırsınız." },
    ],
  },
];

export const veliRehberKapanis: RehberGiris = {
  baslik: "Hazırsınız!",
  aciklama:
    "Bunu istediğiniz zaman profil menüsündeki Yardım'dan tekrar açabilirsiniz.",
};
