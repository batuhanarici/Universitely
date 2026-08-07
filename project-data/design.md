# Universitely — Uygulama Fonksiyonel Tanımı (design.md)

Bu doküman, **Universitely** uygulamasındaki **tüm sayfaların ve özelliklerin eksiksiz fonksiyonel tanımını** içerir. Amacı, uygulamanın UI'ını yeniden tasarlayacak bir tasarımcı/AI modeline doğru ve tam bir girdi sağlamaktır.

**Kurallar:**
- Bu dosya yalnızca **işlevi** (hangi bilgi, hangi veri, hangi kullanıcı eylemi) tanımlar; **hiçbir tasarım stili** (renk, tipografi, düzen, bileşen görünümü) belirtmez. Görsel tercihler tamamen tasarımcıya bırakılmıştır.
- Her sayfanın adı, amacı, bölümleri, kullanıcı eylemleri, boş/yükleme durumları ve yaptığı hesaplamalar listelenmiştir.
- "N" işaretleri dinamik sayaçları temsil eder (ör. "Görevler (5)").
- Tüm metin/etiketler Türkçedir.

---

## 1. Genel Mimari ve Roller

Uygulama üç farklı rol için üç ayrı panel içerir. Kullanıcı, giriş sonrası rolüne göre ilgili panele yönlendirilir.

| Rol | Panel | Not |
|---|---|---|
| **Öğrenci** | Öğrenci Paneli | 17 ayrı sayfa (sekme) |
| **Koç (Öğretmen)** | Koç Paneli | 21 ayrı sayfa (sekme) |
| **Veli** | Veli Paneli | 7 ayrı sayfa (sekme) |

Rol tespiti: kullanıcı metadata'sındaki `rol` alanı (`veli`/`ogretmen`) ve `ogrenciler` tablosunda kayıtlı olup olmadığına göre yapılır. Öğrenci/veli kaydı sırasında girilen davet/bağlantı kodu otomatik olarak ilgili koça/çocuğa bağlanır.

**Tüm panellerde ortak olanlar:**
- Yan menü (sidebar) ile sayfalar arasında geçiş; her panelin kendi menüsü vardır.
- Her sayfanın altında bir "Çıkış Yap" eylemi.
- Her sayfa veri yüklenirken "Yükleniyor…" göstergesi gösterir.
- Tüm sayfalar oturum açılmadan kullanılamaz; yapılandırma eksikse uygulama kurulum ekranını gösterir.

---

## 2. Kimlik ve Giriş Ekranları

### 2.1. Kurulum Ekranı
- **Amaç:** Supabase ortam değişkenleri tanımlanmamışsa görüntülenen uyarı ekranı.
- Kök dizine `.env` dosyasına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değişkenlerinin eklenmesi gerektiğini anlatan metin ve örnek kod bloğu gösterilir. Başka etkileşim yoktur.

### 2.2. Giriş / Kayıt Ekranı
- **Amaç:** Kullanıcının giriş yapması veya öğrenci/veli olarak kayıt olması.
- Uygulama logosu/ismi ve alt başlık gösterilir.
- Üç sekme içerir:
  1. **Giriş Yap** — e-posta + şifre ile oturum açma.
  2. **Öğrenci Kaydı** — ad soyad, e-posta, şifre ve **davet kodu** (koçtan alınır) alanları. Kod önce doğrulanır; geçersizse hata gösterilir ve kayıt engellenir. Başarılı kayıtta "kayıt oluşturuldu, koçuna otomatik bağlanacaksın" bilgisi gösterilir ve Giriş sekmesine dönülür.
  3. **Veli Kaydı** — ad soyad, e-posta, şifre ve **bağlantı kodu** (koçtan veya çocuğun hesabından alınır) alanları. Başarılı kayıtta "çocuğunun hesabına bağlanacaksın" bilgisi gösterilir.
- Gönder butonu: işlem sırasında "Gönderiliyor…" olur ve devre dışı kalır. Hata ve bilgi mesajları ayrı renklerde görünür.

---

## 3. Öğrenci Paneli (17 Sayfa)

Menü grupları: **Genel** (Günlük, Profil), **Çalışma** (Çalışma, Konular, Kaynaklar, Görevler, Takvim), **Ölçme** (Denemeler, Analiz, Yanlışlar, Tekrar Planı, Karşılaştırma), **Koç & Sistem** (AI Koçum, Haftalık Rapor, Motivasyon, Mesajlar, Bildirimler).

### 3.1. Günlük (Dashboard)
- **Amaç:** Öğrencinin günlük durumunu özetleyen ana ekran.
- **Üst bölüm:** "Son Net" göstergesi (en son denemedeki net) ve önceki denemeye göre yükseliş/düşüş yön göstergesi.
- **Motivasyon mesajı:** Bekleyen tekrar sayısı, zayıf konular, net düşüşü gibi verilere göre kural tabanlı üretilen cesaretlendirici cümle.
- **Bugünün Yapılacakları kartı:** Bugüne ait görevler listelenir; tamamlananlar işaretlenir/çizilir. Boşsa "Bugün için görev yok."
- **Tekrar Havuzu kartı:** Tekrar edilmeyi bekleyen soru sayısı büyük rakamla; havuz boşsa olumlu mesaj.
- **Bugünkü Tamamlanma kartı:** Bugünkü görevlerin tamamlanma yüzdesi + ilerleme çubuğu + haftalık tamamlama özeti.
- **Deneme Bazlı Doğru/Yanlış/Boş grafiği:** Her deneme için D/Y/B sayılarını gösteren yığılmış çubuk grafik (deneme bazında).
- **Konu Bazlı Performans kartı:** Her konu için doğru oranı yüzdesi, ilerleme çubuğu; %55 altındakiler "Ağırlık ver" rozeti alır.
- **Tekrar Havuzu listesi:** Deneme adı + soru no + konu + tarih gösteren, çözüldü/çözülmedi işaretlenebilen (checkbox) liste. İşaretleme anında kaydedilir.
- Deneme verisi yoksa grafiklerin yerine bilgilendirme kartı gösterilir.
- **Hesaplamalar:** Net = doğru − (yanlış / 4); konu başarısı = doğru / (doğru+yanlış+boş) × 100; zayıf konu eşiği %55; günlük/haftalık görev tamamlama yüzdeleri.

### 3.2. Profil
- **Amaç:** Öğrencinin hedef ve tercih bilgilerini girip kaydetmesi.
- Form alanları: **Hedef Üniversite** (serbest metin), **Hedef Bölüm** (serbest metin), **Sınav Türü** (TYT / AYT / TYT+AYT seçim çipleri), **Hedef Net** (sayı), **E-posta hatırlatmaları** (açık/kapalı onay kutusu; açıklama: her sabah görev, tekrar ve çözülmemiş yanlış özeti e-postası).
- **Kaydet** butonu; kaydetme sonucu başarı/hata mesajı gösterilir.
- Kaydedilmiş hedef varsa **Hedef Özeti** kartı: üniversite, bölüm, sınav türü ve hedef net rozetleriyle görüntülenir.

### 3.3. Çalışma
- **Amaç:** Pomodoro zamanlayıcı ile çalışmayı kaydetme ve çalışma geçmişini görüntüleme.
- **Pomodoro kartı:** 25 dakikalık dairesel geri sayım halkası (dakika:saniye). Çalışıyor/hazır durum etiketi. Butonlar: **Başlat / Tekrar Başlat**, **Duraklat**, **Sıfırla**. Süre bittiğinde 25 dakikalık çalışma kaydı otomatik eklenir ve durum mesajı gösterilir.
- **Çalışma Ekle kartı:** **Süre (dk)** (zorunlu), **Çözülen Soru Sayısı** (opsiyonel), **Not** (opsiyonel) alanları + **Kaydet** butonu.
- **Son 7 Gün kartı:** Son 7 günün toplam dakika ve soru sayacı + günlük çubuk grafik (Pzt–Paz).
- **Kayıtlar kartı:** Her kayıt: süre, soru sayısı, tarih, konu adı, not. Her satırda **Sil** eylemi (onay sormadan).
- **Hesaplamalar:** Haftalık toplam süre/soru; geri sayım ilerlemesi.

### 3.4. Konular
- **Amaç:** Konuları tamamlandı olarak işaretleme, zayıf/eksik konuları görme.
- Üstte toplam tamamlanan konu sayacı ve yüzde.
- **Eksik / Ağırlık Verilmesi Gerekenler kartı:** Tamamlanmamış veya zayıf konular listelenir; "Zayıf" rozeti olanlar vurgulanır. Tamamlama onay kutuları ile yapılır.
- **Ders bazlı konu kartları:** Her ders için konular; tamamlananlar işaretlenir/çizilir, "✓" ile gösterilir.
- Konu yoksa "Henüz konu tanımlanmamış" bilgisi.
- **Hesaplamalar:** Zayıf konu = en az 1 cevabı olup doğru oranı %55'in altında olan konu; genel ilerleme = tamamlanan/toplam × 100.

### 3.5. Kaynaklar
- **Amaç:** Kitap/soru bankası/deneme/video kaynaklarını takip etme.
- **Kaynak Ekle kartı:** **Kaynak adı**, **Tür** (Kitap, Soru Bankası, Deneme, Video), **Toplam sayfa/soru**, **Bitiş hedefi** (tarih). Başlangıç tarihi otomatik bugün.
- **Genel İlerleme kartı:** Tüm kaynakların toplam ilerleme sayacı ve yüzdesi + ilerleme çubuğu.
- **Kaynaklarım kartı:** Her kaynak: ad, tür, kalan gün/geçen gün bilgisi, günlük hedef bilgisi, ilerleme/toplam, **+/−** butonları ile ilerleme artırma/azaltma (0 ile toplam arasında sınırlı), yüzde, **Sil**. Hedef tarihi geçmişse kırmızı, %80+ ise yeşil vurgu.
- **Hesaplamalar:** Yüzde = ilerleme/toplam × 100; kalan gün; günlük ilerleme hedefi = kalan iş / kalan gün.

### 3.6. Görevler
- **Amaç:** Kişisel günlük/haftalık görev oluşturma ve koçun atadığı görevleri görüp tamamlama.
- **Yeni Görev kartı:** **Görev başlığı**, **Tarih** (varsayılan bugün), **Tip** (Günlük / Haftalık hedef), **Ekle** butonu.
- **Koçtan Görevler kartı:** Koçun atadığı görevler; tamamlanınca "✓ koçun onayladı" veya "Koçun onayı bekleniyor" durumu; koç geri bildirim bıraktıysa "💬 Koçundan: …" balonu. Silme yok (sadece tamamlama).
- **Bugün kartı:** Bugünkü günlük görevler + tamamlanma yüzdesi + Sil.
- **Tüm Günlük Görevler kartı:** Bugün dışındaki günlük görevler + Sil.
- **Haftalık Hedefler kartı:** Haftalık görevler + Sil.
- Tarih etiketleri göreceli ("Bugün", "Yarın", "Dün", aksi halde tarih).

### 3.7. Takvim
- **Amaç:** Haftalık görünümde görevleri ve tekrar planlarını birleştirip gösterme.
- Hafta boyunca (Paz–Cmt) sütunlar halinde takvim. Bugün sütunu vurgulanır.
- Her gün sütununda o güne ait görevler (tamamlandı işaretiyle) ve tekrar planları ("Tekrar: …", kırmızı işaret) listelenir; boş günlerde "—" gösterilir.
- Onay kutuları canlıdır: görev tamamlama ve tekrar yapıldı işareti anında kaydedilir.
- Alt açıklama satırı: koç ataması ve tekrar işaretlerinin anlamı.

### 3.8. Denemeler
- **Amaç:** Öğrencinin tüm deneme sonuçlarını listeleme ve dışa aktarma.
- **Tür filtresi çipleri:** Tümü / TYT / AYT / Branş (yalnızca veride olan türler gösterilir).
- **Deneme listesi:** Her deneme: ad, tür rozeti, ders, tarih, D/Y/B sayıları, büyük **net** değeri. Tarihe göre azalan sıralı.
- **CSV indir** butonu: "Deneme, Ders, Tarih, Doğru, Yanlış, Boş, Net" sütunlarında dosya indirir.
- **Hesaplamalar:** Net = doğru − yanlış/4.

### 3.9. Analiz
- **Amaç:** Deneme performansını grafiklerle analiz etme.
- **Net grafiği:** Denemelerin net değerleri zaman içinde çizgi grafik.
- **Ders bazlı başarı:** Derslere göre doğru/yanlış/boş oranları (yığılmış veya çubuk) + yüzde çubukları.
- **Yanlış konu dağılımı:** En çok yanlış/boş yapılan ilk 10 konu.
- **Konu bazlı başarı:** Konuların doğru yüzdeleri, düşükten yükseğe sıralı.
- **Hesaplamalar:** Net formülü; konu başarı yüzdeleri; yanlış dağılımı sayımları.

### 3.10. Yanlışlar
- **Amaç:** Yanlış soru arşivi oluşturma, çözülenleri işaretleme, tekrar planına ekleme.
- **Yanlış Soru Ekle kartı:** **Açıklama**, **Konu** (liste, opsiyonel), **Kaynak**, **Sayfa no**, **Soru no**, **Ekle**.
- **Çözülmeyen kartı:** Çözülmemiş yanlışlar; işaretleme (checkbox), **Tekrarına ekle** (tekrar planına otomatik öğe ekler), **Sil**.
- **Çözülen kartı:** Çözülmüş yanlışlar (yalnızca varsa gösterilir).
- **Hesaplamalar:** Çözülmemiş sayısı; tekrar eklemede açıklama otomatik üretilir.

### 3.11. Tekrar Planı
- **Amaç:** Aralıklı tekrar planı oluşturma ve tamamlama.
- **Yeni Tekrar Ekle kartı:** **Konu/soru açıklaması**, **Tarih** (varsayılan bugün), **Ekle**.
- **Bugün kartı:** Bugüne planlanmış ve yapılmamış tekrarlar; işaretleme + Sil.
- **Gelecek Tekrarlar kartı:** Bugün dışındaki yapılmamış tekrarlar.
- **Tamamlananlar kartı:** Tamamlanmış tekrarlar (yalnızca varsa).

### 3.12. Karşılaştırma
- **Amaç:** Aynı şablondan yapılan denemeleri ders bazında net karşılaştırma.
- Aynı şablondan en az 2 deneme gereklidir; yoksa açıklayıcı bilgi gösterilir.
- Her şablon grubu için karşılaştırma tablosu: satırlar dersler, sütunlar denemeler (tarih sıralı). Her hücrede o dersteki net; eksik veri "—". En iyi toplam nete sahip deneme sütunu vurgulanır; "Toplam Net" satırında en iyi deneme madalyayla işaretlenir.
- **CSV indir** butonu: "Şablon, Deneme, Tarih, Ders, Net" sütunlarında dosya.
- **Hesaplamalar:** Ders neti = doğru − yanlış/4; en yüksek toplam nete göre vurgu.

### 3.13. AI Koçum (Öneriler)
- **Amaç:** Verilere dayalı kural tabanlı çalışma önerileri üretme.
- **Yenile** butonu: önerileri yeniden hesaplar.
- Her öneri kartı: kategori etiketi, öncelik rozeti (**Öncelikli** / **Dikkat** / **İyi Gidiyorsun**), başlık, açıklama metni, ikon.
- Veri yoksa açıklayıcı boş durum mesajı.
- **Öneri motoru:** Öğrencinin deneme sonuçları, çalışma kayıtları, görevleri, kaynakları, yanlış arşivi, tekrar planları ve profili girdi alınır; zayıf konular, düşük tempo, gecikmiş görev, çözülmemiş yanlış, net düşüşü gibi durumlara göre öncelikli öneriler üretilir.

### 3.14. Haftalık Rapor
- **Amaç:** Haftalık özet raporu görüntüleme, kopyalama ve PDF indirme.
- **Özet kartı:** Doğal dilde yazılmış haftalık özet paragrafı.
- **Günlük çalışma süresi grafiği:** Son 7 günün dakikaları (CSS çubukları).
- **KPI kartları:** Toplam çalışma (saat + günlük ort.), görev tamamlama, deneme ortalaması (net), kaynak ilerlemesi (%).
- **En çok çalıştığın konular:** İlk 3 konu ve dakika gösterimi.
- **Alt istatistikler:** Çözülen yanlış sayısı ve yapılan tekrar sayısı.
- **Raporu Kopyala** butonu (metni panoya kopyalar, kısa "Kopyalandı ✓" geri bildirimi) ve **PDF** butonu (tablo içeren yazdırılabilir PDF).
- **Hesaplamalar:** Son 7 günlük pencere; günlük toplamlar; deneme ortalaması; kaynak yüzdesi; konu odağı.

### 3.15. Motivasyon
- **Amaç:** Çalışma serisi ve rozetlerle oyunlaştırılmış motivasyon ekranı.
- **Seri kartı:** Günlük çalışma serisi sayısı (istikrarlı gün sayısı) ve seviyeye göre değişen motive edici mesaj.
- **İstatistik kartları:** Toplam çalışma saati, kazanılan rozet sayısı.
- **Rozetler kartı:** 12 rozet (ilk çalışma, 3/7/14 gün seri, 10/50 saat, ilk deneme, 5 deneme, kaynak bitirme, 50 çözülmüş yanlış, 10 tekrar, hedef neti aşma). Kazanılanlar aktif, kazanılmayanlar kilitli görünür; ilerleme çubukları vardır. Yeni kazanılan rozet "YENİ" etiketiyle vurgulanır.
- **Hesaplamalar:** Seri (bugün veya dünden başlayarak kesintisiz çalışma günleri); rozet koşulları; ortalama net; toplam dakika.

### 3.16. Mesajlar
- **Amaç:** Öğrencinin koçuyla birebir sohbet etmesi.
- **Konuşma alanı:** Mesaj balonları (kendi mesajları sağda, koçun solda). Her balonda gönderen etiketi ve saat/dakika damgası. Gelen mesajlar otomatik okundu işaretlenir.
- **Yazma alanı:** Mesaj kutusu + **Gönder** butonu; Enter ile gönderim. Koç bulunamazsa sessizce bırakılır.

### 3.17. Bildirimler
- **Amaç:** Bekleyen hatırlatmaları listeleme.
- Kural tabanlı hatırlatmalar (öncelikli/ normal):
  - Tekrar havuzunda bekleyen sorular.
  - Bugün tamamlanmamış görevler.
  - Bugünkü tekrar planları.
  - Çözülmemiş yanlış arşivi.
  - Düşük performanslı konular (%55 altı).
- Hatırlatma yoksa "Her şey yolunda!" mesajı.

---

## 4. Koç (Öğretmen) Paneli (21 Sayfa)

### 4.1. Koç Paneli (Dashboard)
- **Amaç:** Koçun sınıfını tek bakışta gördüğü ana ekran.
- **KPI kartları (4):** toplam öğrenci, aktif öğrenci, pasif öğrenci, bugün bekleyen görev sayısı.
- **Riskli Öğrenciler kartı:** En riskli 5 öğrenci (durum noktası, risk puanı çubuğu, seviye rozeti: yüksek/orta/düşük) + Detay'a gitme.
- **Öğrencilerim kartı:** Tüm öğrenciler; aktif/pasif durumu, ortalama net, en zayıf konu bilgisi, Detay butonu.
- **Yaklaşan Görüşmeler kartı:** Planlanmış ve gelecek tarihli görüşmeler (öğrenci, katılımcı, tarih/saat).
- **Bugünün Görevleri kartı:** Bugüne atanmış görevler; tamamlama ve onay durumları.
- Tüm kartlar yalnızca okuma amaçlıdır; tek eylem Detay'a gitmektir.

### 4.2. AI Risk Analizi
- **Amaç:** Tüm öğrenciler için AI destekli risk skorlarını gösterme ve öncelik sıralaması sunma.
- **Dağılım özeti (3 kart):** yüksek riskli, orta riskli, düşük riskli öğrenci sayıları.
- **Bileşik Öncelik Sıralaması:** Risk skoruna göre sıralı öğrenci listesi. Her satır: sıra, ad, risk seviyesi rozeti, ortalama net, risk puan çubuğu, **Detay** butonu.
- Her öğrenci için genişletilebilir **Analiz** paneli:
  - **Risk faktörü kartları:** 5 faktörün her biri için faktör adı, puanı, mini ilerleme çubuğu, açıklama metni.
  - **AI Önerileri:** maddeler halinde öneriler.
- **Risk motoru (kural tabanlı):** Beş ağırlıklı faktör:
  1. **Net Düşüşü** (ağırlık 30): Son deneme ile önceki deneme net farkı. 5 net düşüş ≈ 100 puan.
  2. **Bitmemiş Görev** (ağırlık 20): Bugüne kadar tarihi geçmiş/günü gelmiş tamamlanmamış görevler. Her geciken görev 25 puan (maks 100).
  3. **Çözülmemiş Yanlış** (ağırlık 20): Çözülmemiş yanlış arşivi. Her yanlış 10 puan (maks 100).
  4. **Kaynak Gecikmesi** (ağırlık 15): Hedef tarihi geçmiş ve bitmemiş kaynaklar. Her geciken kaynak 50 puan (maks 100).
  5. **Düşük Tempo** (ağırlık 15): Son 7 gündeki toplam çalışma süresi; hedef haftada 3,5 saat (210 dk). Altında kaldıkça puan artar.
  - **Bileşik skor:** Ağırlıklı ortalama (0–100).
  - **Seviye eşikleri:** ≥55 yüksek, ≥25 orta, diğerleri düşük.
  - **Öneriler:** Pozitif faktörlerin her biri için koç aksiyon önerisi (görüşme, hatırlatma, tekrar planına ekleme, kaynak hedefi güncelleme, çalışma hedefi belirleme vb.); skor düşükse "mevcut ilerlemeyi koruyun" önerisi.
  - Sıralama: risk skoru azalan, eşitlikte ortalama net artan.

### 4.3. Muhasebe
- **Amaç:** Öğrenci ödemelerinin tam takibi.
- **KPI kartları (4):** toplam tahsilat, ödenen, bekleniyor, gecikmiş (tutar).
- **Yeni Ödeme kartı:** Öğrenci seçimi, **Tutar (₺)**, **Tarih** (varsayılan bugün), **Açıklama**, **Ödemeyi Kaydet**.
- **Ödemeler kartı:** Öğrenci filtresi + durum filtreleri (**Hepsi / Ödendi / Bekleniyor / Gecikti**). Her satır: ödendi onay kutusu, öğrenci, tutar, tarih, açıklama, durum rozeti, **Sil**.
- **Hesaplamalar:** Ödenen = ödendi=true toplamı; gecikmiş = ödenmemiş ve tarihi bugünden önce; bekleyen = ödenmemiş ve tarihi bugün veya ileri.

### 4.4. Sınıf Genel Durumu
- **Amaç:** Sınıfın genel özeti (statik, filtre yok).
- **Öğrenciler (nete göre sıralı) kartı:** Ad, en zayıf konu (oranıyla), net, D/Y/B sayıları.
- **Ağırlık Verilmesi Gereken Konular kartı:** Sınıf genelinde öğrenci başına zayıf oranı %55 altında olan öğrenci sayısına göre sıralanan konular; her konu için "n/toplam öğrenci" göstergesi.
- Veri yoksa bilgilendirme mesajı.

### 4.5. Sınıf Analiz
- **Amaç:** Filtrelenebilir çoklu grafik analiz ekranı.
- **Filtreler:** Tür (Tüm/TYT/AYT/Branş), Ders, Deneme (üçlü açılır menü).
- **Net Trendi grafiği:** Denemeler üzerinden her öğrencinin net çizgisi + sınıf ortalaması çizgisi.
- **Öğrenci Sıralaması:** Filtreye göre net sıralaması; D/Y/B, ilerleme çubuğu, net değeri.
- **Ders Başarı Analizi:** Ders bazlı yığılmış D/Y/B grafiği + doğru oranı çubukları + %55 altı "zayıf" rozeti.
- **Öğrenci Karşılaştırma (net):** Öğrencilerin net değerlerinin çubuk grafiği (tek deneme seçildiyse o deneme, değilse ortalama).
- **Hesaplamalar:** Net formülü; filtreli toplamlar; sınıf ortalaması; en zayıf dersler.

### 4.6. Öğrenciler
- **Amaç:** Davet kodu üretme ve öğrenci aktif/pasif yönetimi.
- **Yeni Öğrenci Davet Kodu kartı:** Öğrenci adı soyadı girilir, **Kod Üret** ile kod üretilir. Üretilen kod büyük ve kopyalanabilir (**Kopyala** butonu, kısa "Kopyalandı ✓" geri bildirimi). Kullanıcıya kodun öğrencinin kaydında kullanılacağı anlatılır.
- **Öğrenci Listesi kartı:** Her öğrenci: aktif/pasif noktası (tıklanınca durum değişir), ad, aktif/pasif etiketi, veli bağlantı kodu (varsa), **Detay** butonu.

### 4.7. Öğrenci Detayı
- **Amaç:** Tek öğrencinin tüm durumunu okuma amaçlı görüntüleme. Başlık öğrencinin adını taşır; **← Geri** butonu.
- **KPI kartları (4):** son net, toplam çalışma (saat), bekleyen görev sayısı, çözülmemiş yanlış sayısı.
- **Deneme Netleri kartı:** En son 8 deneme; ad, tarih, D/Y, net.
- **Görevler kartı:** Son 6 görev; tamamlama ve onay durumu.
- **Kaynaklar kartı:** İlk 5 kaynak; ilerleme/toplam ve ilerleme çubuğu.
- **Yanlış Arşivi kartı:** İlk 5 yanlış; çözüldü/çözülmedi durumu.
- **Son Çalışmalar kartı:** İlk 5 çalışma; not/konu, süre, tarih.
- **HEDEF kartı:** Profil varsa hedef üniversite, bölüm, hedef net.

### 4.8. Haftalık Program
- **Amaç:** Bir öğrencinin haftalık çalışma planını oluşturma (hafta bazlı görev atama).
- **Öğrenci & Hafta kartı:** Öğrenci seçimi + hafta seçimi (tarih girişi; pazartesi–pazar aralığı otomatik hesaplanır, aralık etikette gösterilir).
- **7 gün kartı (Pazartesi–Pazar):** Her gün için: başlık (Bugün/ tarih etiketi), tamamlama sayacı (tamamlanan/toplam), görev listesi (tamamlama + onay durumu, **Sil**), çok satırlı görev ekleme alanı (her satır ayrı bir görev olur) + **Ekle**.

### 4.9. Görev Yönetimi
- **Amaç:** Öğrenciye görev atama, onaylama, geri bildirim yazma.
- **Öğrenci kartı:** Öğrenci seçimi.
- **Görev Ata kartı:** Açıklama + tarih + **Ata**.
- **Görevler ve Kontrol kartı:** Görev listesi; her görev: başlık, tarih, tip rozeti, durum (**bekliyor / onay bekliyor / onaylandı**), **Sil**. Tamamlanmış görevlerde: **Onayla** onay kutusu, **Geri bildirim** kutusu, **Kaydet** butonu.

### 4.10. Kaynak Ata
- **Amaç:** Öğrenciye kaynak atama ve ilerleme takibi.
- **Öğrenci kartı:** Öğrenci seçimi.
- **Yeni Kaynak Atam kartı:** Kaynak adı, tür (Kitap/Soru Bankası/Deneme/Video), toplam sayfa/soru, bitiş hedefi, **Ata**.
- **Atanan Kaynaklar kartı:** Her kaynak: ad, tür, ilerleme/toplam (%), ilerleme çubuğu, **Kaldır**.

### 4.11. Konu Ata
- **Amaç:** Öğrenciye konu atama ve tamamlanma durumunu görme.
- **Öğrenci kartı:** Öğrenci seçimi.
- **Konu Atam kartı:** Ders seçimi → o dersin konu seçimi → **Ata**. Derste konu yoksa yönlendirme bilgisi.
- **Atanan Konular kartı:** Konu, ders, tamamlandı ("✓ tamamlandı" yeşil) veya "çalışılıyor" durumu + **Kaldır**.

### 4.12. Ders / Konu Yönetimi
- **Amaç:** Ders ve konu kataloğunu yönetme (yalnızca ekleme; silme/düzenleme yok).
- **Dersler kartı:** Ders ekleme (metin + **Ekle**), ders seçimi (tıklanabilir çipler).
- **Konular kartı:** Seçili dersin konu ekleme alanı + konu listesi.

### 4.13. Deneme Şablonu Oluştur
- **Amaç:** Soru no aralıklarını konulara eşleştirerek yeniden kullanılabilir deneme şablonu oluşturma.
- Form: şablon adı, ders seçimi, **Başlangıç no – Bitiş no** aralığı + konu seçimi + **Aralık Ekle**.
- **Soru tablosu:** Eklenen aralıklar açılmış haliyle listelenir (soru no / konu); her satır **sil** butonu; çakışan aralıklar üzerine yazılır.
- **Şablonu Kaydet (N soru)** butonu; başarı mesajı gösterilir.

### 4.14. Deneme Oluştur
- **Amaç:** Bir şablondan deneme kaydı oluşturma ve oluşturulan denemeleri listeleme.
- Form: deneme adı, şablon seçimi (ad + ders), tür (TYT/AYT/Branş), tarih, **Denemeyi Oluştur**.
- Şablon yoksa oluşturma formu gizlenir ve yönlendirme mesajı gösterilir.
- **Oluşturulan Denemeler kartı:** ad, şablon adı, tür rozeti, tarih.

### 4.15. Sonuç Gir
- **Amaç:** Tek öğrencinin tek deneme için soru bazlı D/Y/B sonucunu girme.
- Deneme + öğrenci seçimi. Sonuçlar zaten girilmişse uyarı gösterilir ve giriş engellenir.
- **Soru listesi:** Her soru: soru no, konu, **D / Y / B** seçim butonları.
- **Kaydet** butonu: tüm sorular işaretlenmeden etkin değil; buton etiketinde işaretlenme sayacı ("x/y soru işaretlendi"). Başarı mesajı gösterilir.

### 4.16. Toplu Sonuç Gir
- **Amaç:** Sınıfın tamamı için toplu D/Y/B girişi.
- Deneme seçimi + mod seçici: **Sınıf Grid** / **Kopyala-Yapıştır**.
- Şablonsuz denemede soru sayısı girişi.
- **Sınıf Grid modu:** Her satır bir öğrenci, her sütun bir soru; hücreye tıklayınca D→Y→B→(boş) döner. Satır başına dolu sayacı, **temizle** butonu. Öğrenci adları sabit sütun. Kayıtlı sonuçlar mevcutsa grid önceden doldurulur.
- **Kopyala-Yapıştır modu:** Talimat: her satır "Ad Soyad; DDYYBDD…" formatında. Metin kutusuna yapıştırılıp **Grid'e Aktar** ile parse edilir; eşleşmeyen satırlar hata olarak listelenir. Ardından grid kaydedilir.
- **Kaydet:** "N öğrenci kaydedildi" + eksik bırakılan öğrenciler listelenir.

### 4.17. Mesajlar
- **Amaç:** Öğrenciler ve velilerle birebir sohbet.
- Alıcı seçimi (öğrenci 🎓 / veli 👪) + mesaj kutusu + **Gönder**. Gelen mesajlar otomatik okundu işaretlenir.

### 4.18. Koç Notları
- **Amaç:** Öğrenciler hakkında özel not tutma.
- Öğrenci seçimi, not ekleme (metin alanı + önem derecesi: düşük/normal/yüksek), not listesi (önem rozeti, zaman damgası, **Sil**).

### 4.19. Görüşme & Ödeme
- **Amaç:** Görüşme planlama ve ödeme kaydı tutma — iki sekme.
- **Görüşmeler sekmesi:**
  - **Yeni Görüşme kartı:** öğrenci, katılımcı (Öğrenci/Veli), tarih-saat, konu, not + **Görüşmeyi Planla**.
  - **Görüşmeler kartı:** Liste; durum rozetleri (planlandı/tamamlandı/iptal), notlar, **Tamamlandı**, **İptal**, **Sil** eylemleri.
- **Ödemeler sekmesi:**
  - **Özet kartları:** toplam tahsilat, ödenen.
  - **Yeni Ödeme kartı:** öğrenci, tutar, tarih, açıklama.
  - **Ödemeler kartı:** ödendi onay kutusu, öğrenci, tutar, tarih, açıklama, **Sil**.

### 4.20. Toplu Bildirim
- **Amaç:** Seçili öğrenci/veli grubuna tek mesaj gönderme.
- **Alıcılar kartı:** Öğrenciler ve Veliler olmak üzere iki grup; her grupta tek tek seçim ve **Tümünü Seç / Temizle**.
- **Mesaj kartı:** Mesaj alanı + **Gönder** (seçili alıcı sayısı buton etiketinde); başarı "x/y alıcıya gönderildi" şeklinde.

### 4.21. Sınıf Raporu (Haftalık)
- **Amaç:** Son 7 günün sınıf raporunu gösterme ve dışa aktarma.
- **Dönem kartı:** "Son 7 gün · tarih → bugün" + haftada deneme yoksa bilgi; varsa KPI kartları (öğrenci, deneme sonucu, sınıf ortalaması).
- **Ders Bazlı Başarı kartı:** Haftalık ders başarı yüzdeleri.
- **Öğrenci Sıralaması kartı:** Haftalık ortalama nete göre sıralama; her öğrencinin deneme çipleri (deneme adı · net), ilerleme çubuğu, ortalama net.
- **PDF** (öğrenci, deneme sayısı, ortalama net tablosu) ve **CSV** (öğrenci, deneme adı, net) indirme butonları.
- **Hesaplamalar:** Haftalık pencere; öğrenci başına net ortalaması; sınıf ortalaması; ders bazlı doğru oranı.

---

## 5. Veli Paneli (7 Sayfa)

### 5.1. Genel Durum
- **Amaç:** Çocuğun genel durumunu özetleme.
- **Üst kartlar:** Ortalama net, toplam deneme sayısı.
- **Bugün kartları:** Bugünkü çalışma süresi (dk), bugünkü çözülen soru sayısı.
- **Haftalık Özet kartı:** 7 günün çalışma süresi, soru sayısı, tamamlanan görev oranı, yeni deneme sayısı.
- **Konu İlerlemesi kartı:** Tamamlanan konu yüzdesi + ilerleme çubuğu + "x/y konu tamamlanmış".
- **Son Denemeler kartı:** Deneme adı, tarih, D/Y, net.
- **Ders Bazlı Başarı kartı:** Derslerin başarı yüzdeleri.
- Çocuğa bağlanmamışsa/veri yoksa bilgilendirme kartı.

### 5.2. Grafikler
- **Amaç:** Çocuğun performansını grafiklerle görme.
- **Net Grafiği:** Denemelerin net değerleri (çizgi grafik).
- **Başarı Yüzdesi:** Ders bazlı başarı yüzdeleri (çubuk grafik).
- **Çalışma İstatistikleri:** Son 14 günün günlük çalışma süresi ve soru sayısı (çubuk grafik).

### 5.3. Takvim
- **Amaç:** Haftalık plan ve görüşme tarihlerini görme.
- **Haftalık Plan kartı:** Son 7 gün; her gün için çalışma süresi, soru sayısı, o günün görevleri (tamamlandı/bitmedi rozetleri).
- **Görüşme Tarihleri kartı:** Gelecek tarihli görüşmeler; başlık, tarih/saat, katılımcı türü, durum rozeti.

### 5.4. Bildirimler
- **Amaç:** Çocukla ilgili hatırlatmaları listeleme.
- Kural tabanlı hatırlatmalar:
  - Bugünün programı tamamlandı ("🎉") veya tamamlanmadı ("⏰").
  - Son 7 günde eklenen deneme sayısı.
  - Bugüne planlanmış yapılmamış tekrarlar.
  - Bitmemiş kaynaklar.
  - Bu hafta hiç çalışma kaydı yoksa uyarı.

### 5.5. Rapor
- **Amaç:** Haftalık ve aylık rapor hazırlama/indirme.
- **Haftalık PDF kartı:** Açıklama + **Haftalık Raporu PDF Yazdır** (7 günün süre/soru/görev tablosu).
- **Aylık Gelişim Raporu kartı:** 30 günlük özet KPI'ları (çalışma saati, soru, deneme sayısı, ortalama net) ekranda görünür + **Aylık Raporu PDF Yazdır** (özet metrikler + ders başarıları + deneme netleri tablosu).

### 5.6. AI Özet
- **Amaç:** Çocuğun gelişim özetini kural tabanlı metinlerle sunma.
- Özet kartları:
  - **Net trendi:** son deneme neti ve önceki ortalamaya göre yükseliş/düşüş yorumu.
  - **Çalışma temposu:** bu haftaki saat ve değerlendirme (düzenli/az).
  - **Güçlü/zayıf ders:** en güçlü ve en zayıf ders yüzdeleri + öneri.
  - **Hedefe uzaklık:** hedef net ile ortalama net farkı.
  - **Konu ilerlemesi:** tamamlanan konu yüzdesi.

### 5.7. Koç'a Mesaj
- **Amaç:** Veli ile koç arasında birebir sohbet.
- Mesaj balonları (sağda veli, solda koç) + yazma alanı + **Gönder**. Gelenler otomatik okundu işaretlenir.

---

## 6. Ortak Bileşenler ve Davranış Kuralları

Bu davranışlar tüm sayfalarda tutarlıdır ve tasarımda korunmalıdır:

- **Sayı animasyonu:** Büyük sayısal değerler (net, süre, yüzde, tutar) 0'dan başlayarak kısa sürede sayılarak gösterilir.
- **İlerleme çubuğu:** Yüzde veya oran gösterimlerinde animasyonlu dolan çubuk.
- **Yükleme durumu:** Her sayfada veri gelene kadar "Yükleniyor…" göstergesi.
- **Boş durum:** Her liste/kart için açıklayıcı boş durum mesajları (yukarıda her sayfada belirtildi).
- **Silme eylemleri:** Onay penceresi olmadan doğrudan siler (silmeden önce kullanıcıyı uyaran bir adım olması yeni tasarımda değerlendirilebilir).
- **Onay kutuları:** Tamamlama/çözüldü/ödendi işaretlerinde kullanılır; işaretlenen öğe çizilir ve soluklaşır.
- **Dışa aktarma:**
  - **CSV indir:** UTF-8, noktalı virgülle ayrılmış, ilk satır başlık.
  - **PDF yazdır:** Başlık, alt başlık (tarih), başlık satırlı tablo ve tarih dipnotu içeren, tarayıcının yazdırma penceresini açan çıktı.
- **Hata/bilgi mesajları:** Form işlemlerinde başarı (yeşil) ve hata (kırmızı) metinleri gösterilir.
- **Çok satırlı formlarda** Enter tuşuyla gönderim desteği (görev ekleme, mesaj, ders/konu ekleme vb.).

## 7. Veri Modeli Özeti (Sayfaların Dayandığı Ana Kavramlar)

- **Öğrenci:** koça bağlı, aktif/pasif, davet kodu.
- **Profil:** hedef üniversite/bölüm, sınav türü (TYT/AYT/TYT+AYT), hedef net, e-posta bildirim tercihi.
- **Çalışma kaydı:** tarih, süre (dk), soru sayısı, konu, not.
- **Görev:** tarih, başlık, tip (günlük/haftalık/koç), tamamlandı, onaylandı, geri bildirim.
- **Kaynak:** ad, tür (kitap/soru bankası/deneme/video), toplam, ilerleme, başlangıç/bitiş hedefi.
- **Konu ilerlemesi:** konu bazında tamamlandı bilgisi.
- **Ders / Konu:** sınav kataloğu.
- **Deneme şablonu:** soru no aralıklarının konu eşlemesi.
- **Deneme:** şablon, tür, tarih.
- **Sonuç:** deneme başına soru bazlı D/Y/B.
- **Yanlış arşivi:** açıklama, konu, kaynak, sayfa/soru no, çözüldü.
- **Tekrar planı:** açıklama, tarih, yapıldı.
- **Mesaj:** gönderen/alıcı, içerik, okundu.
- **Davet/bağlantı kodu:** öğrenci-koç ve veli-öğrenci bağlama.
- **Veli:** çocuğa bağlı, bağlantı kodu.
- **Koç notu:** öğrenci bazlı, önem derecesi.
- **Görüşme:** öğrenci, katılımcı (öğrenci/veli), tarih-saat, durum (planlandı/tamamlandı/iptal), not.
- **Ödeme:** öğrenci, tutar, tarih, açıklama, ödendi.

---

*Bu doküman uygulamanın tüm sayfalarını ve özelliklerini kapsar. Tasarım aşamasında her sayfa için yukarıdaki bölümler, veriler ve eylemler korunmalı; görsel sunum serbest bırakılmıştır.*
