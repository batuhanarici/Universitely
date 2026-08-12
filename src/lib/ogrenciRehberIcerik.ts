import type { RehberGrup, RehberGiris } from "./rehberTipleri";

export const ogrenciRehberGiris: RehberGiris = {
  baslik: "Universitely'e Hoş Geldin",
  aciklama:
    "Öğrenci panelini birkaç ekranda kısaca tanıtalım. İstediğin zaman bu turu Yardım menüsünden tekrar açabilirsin.",
};

export const ogrenciRehberGruplari: RehberGrup[] = [
  {
    baslik: "Genel",
    ozet: "Güne buradan başla — günlük özet burada.",
    hedefGrup: "Genel",
    sayfalar: [
      { label: "Günlük", aciklama: "Bugünkü görevlerin ve genel durumun bir bakışta." },
    ],
  },
  {
    baslik: "Çalışma",
    ozet: "Ders çalışırken kullanacağın araçlar burada.",
    hedefGrup: "Çalışma",
    sayfalar: [
      { label: "Çalışma", aciklama: "Ders çalışma sürelerini kaydedersin." },
      { label: "Konular", aciklama: "Hangi konuda ne kadar iyi olduğunu görürsün." },
      { label: "Kaynaklar", aciklama: "Koçunun sana atadığı kitap/kaynakları takip edersin." },
      { label: "Görevler", aciklama: "Koçunun verdiği görevleri buradan tamamlarsın." },
      { label: "Takvim", aciklama: "Haftalık çalışma programını görürsün." },
    ],
  },
  {
    baslik: "Ölçme",
    ozet: "Deneme sonuçların ve performans analizin burada.",
    hedefGrup: "Ölçme",
    sayfalar: [
      { label: "Denemeler", aciklama: "Girdiğin tüm deneme sonuçlarının listesi." },
      { label: "Analiz", aciklama: "Konu bazlı güçlü/zayıf yönlerini gösterir." },
      { label: "Yanlışlar", aciklama: "Yaptığın yanlışları biriktirip tekrar çalışırsın." },
      { label: "Tekrar Planı", aciklama: "Ne zaman ne tekrar edeceğini planlar." },
      { label: "Karşılaştırma", aciklama: "Denemelerini birbiriyle kıyaslarsın." },
    ],
  },
  {
    baslik: "Koç & Sistem",
    ozet: "Koçunla iletişim ve motivasyon araçların burada.",
    hedefGrup: "Koç & Sistem",
    sayfalar: [
      { label: "AI Koçum", aciklama: "Sana özel otomatik öneriler sunar." },
      { label: "Haftalık Rapor", aciklama: "Haftalık ilerlemenin özetini görürsün." },
      { label: "Motivasyon", aciklama: "Motive edici içerikler ve rozetler." },
      { label: "Mesajlar", aciklama: "Koçunla birebir mesajlaşırsın." },
      { label: "Bildirimler", aciklama: "Sistem bildirimlerini görürsün." },
    ],
  },
];

export const ogrenciRehberKapanis: RehberGiris = {
  baslik: "Hazırsın!",
  aciklama:
    "Bunu istediğin zaman profil menüsündeki Yardım'dan tekrar açabilirsin. Bol şans!",
};
