// Koç paneli tanıtım turu (OnboardingTuru) ve kalıcı Yardım sayfası (YardimSayfasi)
// aynı içeriği buradan okur — tek kaynaktan yönetilir.

export interface RehberSayfa {
  label: string;
  aciklama: string;
}

export interface RehberGrup {
  baslik: string;
  ozet: string;
  sayfalar: RehberSayfa[];
}

export const kocRehberGiris = {
  baslik: "Universitely'e Hoş Geldin",
  aciklama:
    "Koç panelini birkaç ekranda kısaca tanıtalım. İstediğin zaman bu turu Yardım menüsünden tekrar açabilirsin.",
};

export const kocRehberGruplari: RehberGrup[] = [
  {
    baslik: "Genel",
    ozet: "Güne buradan başla — öğrencilerinin genel durumu ve ödeme takibi burada.",
    sayfalar: [
      { label: "Koç Paneli", aciklama: "Tüm öğrencilerinin özet görünümü, günlük genel bakış." },
      { label: "AI Risk", aciklama: "Hangi öğrencinin desteğe ihtiyacı olduğunu otomatik işaretler." },
      { label: "Muhasebe", aciklama: "Ödeme takibi — kim ödedi, kimin ödemesi gecikti." },
    ],
  },
  {
    baslik: "Sınıf",
    ozet: "Sınıfının genel performansını ve öğrenci listesini buradan yönetirsin.",
    sayfalar: [
      { label: "Sınıf Genel", aciklama: "Öğrenci sıralaması ve sınıf çapında genel durum." },
      { label: "Sınıf Analiz", aciklama: "Sınıfın hangi konularda zayıf olduğunu gösterir." },
      { label: "Öğrenciler", aciklama: "Öğrenci listesi ve her öğrencinin detay sayfası." },
      { label: "Haftalık Program", aciklama: "Öğrencilere haftalık çalışma programı oluşturursun." },
    ],
  },
  {
    baslik: "Atama",
    ozet: "Öğrencilere görev, kaynak ve konu atadığın yer.",
    sayfalar: [
      { label: "Görev Yönetimi", aciklama: "Öğrencilere yapılacak görevler ver, takip et." },
      { label: "Kaynak Ata", aciklama: "Kitap/kaynak önerir ve öğrenciye atarsın." },
      { label: "Konu Ata", aciklama: "Çalışılacak konuları öğrenciye ataman." },
      { label: "Ders / Konu", aciklama: "Sistemdeki ders ve konu tanımlarını yönetirsin." },
    ],
  },
  {
    baslik: "Denemeler",
    ozet: "Deneme şablonu oluşturma ve sonuç girişi burada.",
    sayfalar: [
      { label: "Deneme Şablonu", aciklama: "Soru no aralığını konulara eşleştirerek şablon oluşturursun." },
      { label: "Deneme Oluştur", aciklama: "Şablondan yeni bir deneme sınavı oluşturursun." },
      { label: "Sonuç Gir", aciklama: "Tek öğrencinin deneme sonucunu (D/Y/B) girersin." },
      { label: "Toplu Sonuç", aciklama: "Birden fazla öğrencinin sonucunu tek seferde girersin." },
    ],
  },
  {
    baslik: "İletişim",
    ozet: "Öğrenci ve velilerle iletişimin, notların ve raporların burada.",
    sayfalar: [
      { label: "Mesajlar", aciklama: "Öğrencilerinle birebir mesajlaşırsın." },
      { label: "Bildirimler", aciklama: "Sistem bildirimlerini görürsün." },
      { label: "Koç Notları", aciklama: "Öğrenciler hakkında özel notlar tutarsın." },
      { label: "Görüşmeler", aciklama: "Veli/öğrenci görüşmelerini planlar, takip edersin." },
      { label: "Toplu Bildirim", aciklama: "Birden fazla öğrenci/veliye aynı anda bildirim gönderirsin." },
      { label: "Sınıf Raporu", aciklama: "Sınıfın genel durumunu özetleyen rapor oluşturursun." },
    ],
  },
];

export const kocRehberKapanis = {
  baslik: "Hazırsın!",
  aciklama:
    "Bunu istediğin zaman profil menüsündeki Yardım'dan tekrar açabilirsin. İyi çalışmalar!",
};
