# Universitely — Emsal Analizi Sonrası Ürün Yol Haritası

## Önceliklendirme yöntemi

Aşağıdaki skorlar pazar ölçümü değildir; mevcut ürün stratejisi için uzman önceliklendirmesidir. Kullanıcı değeri, farklılaşma ve aciliyet 1–5 arasında; teknik zorluk da 1–5 arasında puanlanmıştır. Öncelik skoru şu basit formülle hesaplanmıştır:

> **Öncelik skoru = (kullanıcı değeri × 2 + farklılaşma + aciliyet) / teknik zorluk**

Kullanıcı değerine iki kat ağırlık verilmesinin nedeni, Universitely’nin önce koç ve öğrencinin düzenli kullanımını doğrulama hedefidir. Skor, tek başına karar vermek için değil, tartışmayı somutlaştırmak için kullanılmalıdır.

## Faz A — Çekirdek koçluk döngüsünü kapat

Bu fazın amacı yeni bir içerik ekosistemi kurmak değil, mevcut veriyi davranışa ve koç kararına dönüştürmektir. Öğrenci her gün ne yapacağını görmeli; koç hangi öğrencinin müdahale istediğini anlamalı; veli ise haftalık gelişimi gereksiz ayrıntıya boğulmadan okuyabilmelidir.

| Sıra | Özellik | Skor | Neden şimdi? | İlk sürüm kabul ölçütü |
|---:|---|---:|---|---|
| 1 | Koç seans notu ve takip maddeleri | 9,50 | Dersin çıktısını kalıcı hâle getirir; görevleri seans kararına bağlar. | Ders kapanırken özet, hedef, takip maddesi ve sonraki görüşme gündemi kaydedilir. |
| 2 | Veli haftalık özet ve destek önerisi | 8,00 | Üçüncü rolün somut değerini artırır; koçun veli iletişim yükünü azaltır. | Veli yalnızca koçun paylaşmayı seçtiği özet, tamamlanma eğilimi ve destek önerisini görür. |
| 3 | Günlük akıllı çalışma planı | 6,67 | Mevcut görev/takvim/veri altyapısını günlük eyleme çevirir. | Öğrenci okul ve koç programına göre günlük görev bloklarını görür; erteleme yeniden planlanır. |
| 4 | Deneme sonrası aksiyon motoru | 6,67 | Deneme sonucu yalnızca rapor olmaktan çıkar; 7 günlük telafiye dönüşür. | En önemli üç bulgu, tekrarlanan konu hataları ve önerilen görevler üretilir. |
| 5 | Öğrenci ilerleme ve erken uyarı panosu | 6,33 | Koçun tüm öğrencileri manuel taramasını önler. | 7 gün etkileşimsizlik, artan gecikme, tekrar eden yanlış ve net düşüşü açıklamalı sinyale dönüşür. |

**Faz A teknik sırası:** Önce seans notu ve takip maddeleri, ardından günlük plan; daha sonra deneme aksiyon motoru ve erken uyarı; son olarak veli özeti. Veli raporu, önceki dört özelliğin ürettiği veriye dayanacağı için başa alınmamalıdır.

## Faz B — Kontrollü kişiselleştirme ve büyüme

Faz B’de amaç, çekirdek döngü çalıştıktan sonra öğrencinin geri dönüşünü ve koçun ölçeklenebilirliğini artırmaktır. AI kontrollü öneri olarak kullanılmalı; yüksek etkili kararlar koç onayı olmadan otomatikleştirilmemelidir.

| Özellik | Skor | Önerilen yaklaşım |
|---|---:|---|
| Öğrenci alışkanlıkları ve hafif oyunlaştırma | 7,00 | Günlük hedef, kişisel seri, haftalık ritim ve koç rozeti. Genel öğrenci sıralaması ve bağımlılık yaratabilecek rekabet yok. |
| Tercih sepeti ve koşul kontrolü | 4,33 | Tercih listesi, sürükle-bırak sıra, burs/dil/şehir/özel kontenjan filtreleri, veri güncelleme tarihi ve Excel/PDF çıktı. Tercih sezonundan önce tamamlanmalı. |
| AI koç yardımcısı ve PDF mini test | 4,00 | Deneme özeti, görev taslağı ve yüklenen PDF’den mini test. Her öneride gerekçe, kullanılan veri ve koç onayı görünür. |
| Koç kapasite ve işletme analitiği | 4,00 | Öğrenci yükü, yaklaşan ders, bekleyen teslim, gecikme ve etkileşimsiz öğrenci panosu. Koç sayısı arttığında önceliği yükselir. |
| PWA/mobil deneyim ve bildirim izinleri | 3,75 | Önce web uygulamasını installable PWA ve güvenilir bildirim izinleriyle güçlendir; native mobil uygulamayı kullanım verisi oluşmadan başlatma. |

## Faz C — Ertelenmesi veya koşula bağlanması gerekenler

Geniş soru bankası, yüksek hacimli video içerik, topluluk ve sosyal rekabet; içerik, telif, moderasyon ve operasyon maliyeti yüksek alanlardır. Universitely’nin şu anki stratejik avantajı bu alanlarda büyük platformlarla yarışmak değil, koçluk bağlamını iyi işlemektir. Bu özellikler ancak pilot öğrencilerin tekrarlı kullanım verisi ve sürdürülebilir içerik/gelir modeli oluştuğunda değerlendirilmelidir.

| Özellik | Karar | Gerekçe |
|---|---|---|
| Geniş soru bankası ve video kütüphanesi | Ertele | Yüksek içerik maliyeti ve telif/kalite yükü. İlk aşamada koçun yüklediği kaynak + seçilmiş açık içerik yeterli. |
| Topluluk ve sosyal rekabet | Ertele | Moderasyon, güvenlik ve dikkat dağınıklığı maliyeti yüksek. Önce kişisel ilerleme oyunlaştırması. |
| Ödeme/abonelik/komisyon | Ücretli model başlayınca | Kullanıcı değerini ve pilot kullanımını doğrulamadan ödeme karmaşıklığı ekleme. |
| Görüşme kaydı ve AI moderasyon | KVKK tasarımı olmadan yapma | Açık rıza, saklama süresi, erişim, silme ve çocukların verileri için ayrı tasarım gerekir. |

## Başarı ölçütleri

Roadmap’in başarısı özellik sayısıyla değil, davranış döngüsüyle ölçülmelidir. Faz A için haftalık aktif öğrenci oranı, planlanan görevin tamamlanma oranı, geciken görev oranı, koçun erken uyarıya müdahale süresi, seans sonrası takip maddesi oluşturma oranı ve veli haftalık raporunun okunma oranı izlenmelidir. Bu metrikler ürünün gerçekten koç ve öğrenci arasındaki işi kolaylaştırıp kolaylaştırmadığını gösterir.

| Metrik | Neyi gösterir? | İlk hedef yaklaşımı |
|---|---|---|
| Haftalık aktif öğrenci | Öğrencinin uygulamaya geri dönüp dönmediği | Öğrencilerin çoğunun haftada en az birkaç ayrı günde görünür eylem yapması |
| Görev tamamlanma oranı | Koç planının uygulanabilirliği | Görevlerin yalnızca atanması değil teslim/öz değerlendirme ile kapanması |
| Geciken görev oranı | Planın öğrenci kapasitesine uygunluğu | Gecikme arttığında sistemin yeni plan önermesi |
| Seans takip maddesi oranı | Koç görüşmesinin davranışa dönüşmesi | Her tamamlanan dersin en az bir karar veya takip maddesi üretmesi |
| Erken uyarı müdahale süresi | Koçun risk sinyalini kullanması | Uyarının görünür ve eyleme dönük olması |
| Veli raporu okunma oranı | Üçüncü rolün gerçek değer üretmesi | Ham bildirim yerine kısa ve anlaşılır rapor okunması |

## Son karar önerisi

Bir sonraki geliştirme paketi olarak **“Koçluk Döngüsü 1.0”** adında tek bir faz öneriyorum: seans notu + takip maddeleri, günlük çalışma planı, deneme sonrası 7 günlük aksiyon motoru, erken uyarı panosu ve veli haftalık özeti. Bu beş parça ayrı özellikler gibi görünse de aslında aynı veri döngüsünün parçalarıdır. Bu nedenle birbirinden kopuk beş mini özellik yerine tek bir ürün fazı olarak tasarlanmalıdır.

Bu faz tamamlandıktan sonra pilot koçlarla iki–dört haftalık kullanım gözlemi yapılmalı; ancak gerçek kullanım verisi olumluysa AI mini test, hafif oyunlaştırma, tercih sepeti ve PWA katmanına geçilmelidir.
