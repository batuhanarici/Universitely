# Universitely — Önceliklendirilmiş Uygulama Planı

## 1. Amaç ve stratejik karar

Bu planın amacı, Universitely’nin mevcut takvim, görev, deneme, dosya teslimi, bildirim, veli ve koç altyapısını tek bir davranış döngüsünde birleştirmektir. Öncelik, emsal uygulamalardaki bütün özellikleri kopyalamak değil; koçun öğrenciyi daha iyi tanımasını, öğrencinin her gün ne yapacağını bilmesini ve velinin doğru zamanda doğru bilgiyi almasını sağlamaktır.

> **Ana ürün yönü:** Universitely, genel bir soru bankası veya sosyal ağdan önce, koçun uzmanlığını öğrencinin günlük çalışma davranışına bağlayan **koç destekli adaptif çalışma işletim sistemi** olarak geliştirilecektir.

İlk uygulama paketi **Koçluk Döngüsü 1.0** adını taşıyacaktır. Bu paket beş birbirine bağlı modülden oluşur: koç seans notu ve takip maddeleri, günlük akıllı çalışma planı, deneme sonrası aksiyon motoru, öğrenci erken uyarı panosu ve veli haftalık özeti. Bu sıra, mevcut veri modelinin yeniden kullanılmasını ve her modülün bir sonraki modüle veri üretmesini sağlar.

## 2. Öncelik sırası

| Öncelik | Ürün paketi | Kullanıcı etkisi | Teknik zorluk | Uygulama kararı |
|---:|---|---|---:|---|
| 1 | Koç seans notu ve takip maddeleri | Çok yüksek | Orta-düşük | İlk geliştirilecek özellik |
| 2 | Günlük akıllı çalışma planı | Çok yüksek | Orta | Seans/görev verisinin üzerine kurulacak |
| 3 | Deneme sonrası 7 günlük aksiyon motoru | Çok yüksek | Orta | Mevcut deneme ve tekrar mantığı genişletilecek |
| 4 | Öğrenci ilerleme ve erken uyarı panosu | Çok yüksek | Orta | Koç panelindeki karar destek katmanı olacak |
| 5 | Veli haftalık özet ve destek önerisi | Yüksek | Orta-düşük | İlk dört modülün çıktılarıyla üretilecek |
| 6 | Öğrenci alışkanlıkları ve hafif oyunlaştırma | Orta-yüksek | Düşük-orta | Çekirdek döngü kullanım verisi görüldükten sonra |
| 7 | Tercih sepeti ve koşul kontrolü | Orta | Orta | Tercih sezonundan önce tamamlanacak |
| 8 | Kontrollü AI koç yardımcısı ve PDF mini test | Yüksek | Yüksek | Küçük pilot; koç onayı zorunlu |
| 9 | Koç kapasite ve işletme analitiği | Orta-yüksek | Orta-yüksek | Koç sayısı ve şube kullanımı arttığında |
| 10 | PWA/mobil deneyim ve bildirim izinleri | Orta-yüksek | Yüksek | Web kullanım verisi oluştuktan sonra |

Öncelik sırası yalnızca özellik önemine göre değil, **bağımlılık zincirine** göre belirlenmiştir. Örneğin veli özeti, günlük çalışma planı ve deneme aksiyonları oluşmadan güvenilir veri üretemez. AI yardımcısı da önceki modüllerin ürettiği kaliteli veriler olmadan yüzeysel öneriler vermeye başlar.

## 3. Faz 0 — Ölçüm ve veri sözleşmesi

İlk kodlama adımından önce mevcut tablolar, query katmanları ve RLS politikaları yeniden kontrol edilecek; yeni özelliklerin mevcut görev, deneme, tekrar, ders, bildirim ve veli ilişkilerini bozmaması sağlanacaktır. Yeni kavramlarda isim çakışmasını önlemek için “seans notu”, “takip maddesi”, “çalışma bloğu”, “aksiyon önerisi” ve “erken uyarı” terimleri kesinleştirilecektir.

Bu fazda ayrıca başlangıç ölçümleri tanımlanacaktır. Kullanım ölçümleri kişisel veri gerektirmeden; haftalık aktif öğrenci, görev tamamlama, teslim gecikmesi, seans sonrası takip maddesi oranı, erken uyarıya müdahale süresi ve veli raporu okunma oranı seviyelerinde tutulacaktır.

**Çıkış ölçütleri:** Veri modeli ve isimlendirme kararı yazılı hâle gelir; her yeni tablo için RLS taslağı hazırlanır; mevcut 40 testin başlangıç durumu korunur; ölçüm olaylarının hangi ekranlarda üretileceği belirlenir.

## 4. Faz A1 — Koç seans notu ve takip maddeleri

Her koçluk dersi tamamlandığında koç, kısa seans özeti, öğrencinin güçlü/zorlandığı noktalar, alınan karar, bir sonraki görüşme hedefi ve takip maddelerini kaydedebilecektir. Takip maddeleri görevlerden farklı olarak seans kararını temsil edecek; gerektiğinde göreve veya çalışma bloğuna dönüştürülebilecektir.

Öğrenci tarafında seans özeti ve kendisine açık takip maddeleri gösterilecek. Koçun özel notları öğrenciden ve veliden ayrı tutulacak. Veliye açılacak içerik, koçun açıkça paylaşmayı seçtiği bölümle sınırlı olacaktır.

**Kabul ölçütleri:** Koç dersini tamamlamadan veya tamamladıktan sonra not kaydedebilir; takip maddesi son tarih ve durum taşıyabilir; takip maddesi göreve dönüştürülebilir; öğrenci tamamlanma durumunu güncelleyebilir; veli yalnızca paylaşılabilir özeti görebilir; öğrenci/koç/veli erişimleri RLS ile ayrılır.

## 5. Faz A2 — Günlük akıllı çalışma planı

Mevcut okul ders programı, koçluk dersleri, görevler, takip maddeleri ve tekrar planları tek günlük görünümde birleştirilecektir. İlk sürümde yapay zekâ yerine açıklanabilir kural tabanlı planlama kullanılacaktır. Öğrencinin müsaitlik aralıkları, tahmini görev süresi, son tarih ve öncelik bilgisi dikkate alınacaktır.

Öğrenci “bugünün planı” ekranında çalışma bloklarını görecek; bloğu tamamlayabilecek, erteleyebilecek veya süreyi değiştirebilecektir. Erteleme, işi kaybetmek yerine yeni bir önerilen zaman oluşturacaktır. Koç isterse kritik takip maddesini kilitleyebilecektir.

**Kabul ölçütleri:** Aynı iş için çakışan çalışma bloğu oluşturulmaz; okul ve koçluk dersleri çalışma süresi hesabından düşülür; erteleme yeni plan önerir; görev tamamlanınca ilgili blok kapanır; planın neden o sırayla önerildiği öğrenciye anlaşılır biçimde gösterilir.

## 6. Faz A3 — Deneme sonrası 7 günlük aksiyon motoru

Deneme sonucu girildiğinde sistem yalnızca grafik üretmekle kalmayacak; öğrencinin anlayacağı en önemli üç bulguyu, koçun incelemesi gereken konuları ve sonraki yedi güne önerilen görev/tekrar aksiyonlarını oluşturacaktır. Aynı konuda tekrarlanan yanlışlar, net düşüşü ve süre kaynaklı kayıplar birbirinden ayrılacaktır.

Öneriler ilk sürümde kural tabanlı ve açıklanabilir olacaktır. Her önerinin hangi deneme, konu, yanlış türü veya süre verisine dayandığı gösterilecektir. Koç öneriyi onaylayabilir, değiştirebilir veya reddedebilir; öğrenciye yalnızca koç onaylı ya da güvenli otomatik öneriler gösterilecektir.

**Kabul ölçütleri:** Deneme sonrası aksiyon taslağı oluşur; aynı konu tekrar ediyorsa öncelik yükselir; önerilen görev mevcut görev tablosuna bağlanabilir; koç öneriyi düzenleyebilir; oluşturulan aksiyon öğrencinin günlük planında görünür; hiçbir öneri “yerleşme garantisi” veya kesin akademik hüküm olarak yazılmaz.

## 7. Faz A4 — Öğrenci ilerleme ve erken uyarı panosu

Koç panelinde her öğrenci için ham veri yerine eyleme dönük sinyaller gösterilecektir. İlk sinyaller; belirli süre etkileşimsizlik, artan görev gecikmesi, teslim edilmeyen kaynak, aynı konuda tekrarlanan yanlış, yaklaşan sınav/ders yoğunluğu ve deneme performansındaki anlamlı düşüş olacaktır.

Her sinyalin neden oluştuğu, son güncelleme tarihi ve önerilen koç aksiyonu gösterilecektir. Kırmızı/yeşil gibi tek başına yargılayıcı renkler kullanılmayacak; sinyaller açıklama ve önerilen iletişim adımıyla sunulacaktır.

**Kabul ölçütleri:** Koç tüm öğrencileri tek ekranda filtreleyebilir; sinyal açıklaması kaynak veriye bağlanır; koç sinyali “incelendi” olarak kapatabilir; veliye otomatik risk etiketi gönderilmez; öğrenciye gösterilen dil destekleyici olur; sorgular büyük öğrenci listelerinde sayfalı çalışır.

## 8. Faz A5 — Veli haftalık özeti ve destek önerisi

İlk dört modülün çıktıları haftalık tek sayfalık veli özetine dönüştürülecektir. Rapor; çalışma ritmi, tamamlanan görevler, yaklaşan önemli tarihler, koçun paylaşmayı seçtiği seans özeti ve evde destek için bir veya iki somut öneri içerecektir. Veliye öğrencinin her hareketinin ham akışı gösterilmeyecektir.

Rapor uygulama içinde başlayacak; daha sonra kullanıcı izni ve e-posta altyapısı uygunsa e-posta özeti eklenebilecektir. Öğrenci reşit değilse veli görünürlüğü ve veri paylaşımı için mevcut ilişki modeli korunmalı, yeni paylaşım seçenekleri açıkça tanımlanmalıdır.

**Kabul ölçütleri:** Veli haftalık özeti açabilir; veri haftalık zaman aralığıyla sınırlıdır; koç paylaşılabilir not seçebilir; veli bildirim tercihini yönetebilir; raporda akademik/psikolojik teşhis veya kesin başarı tahmini bulunmaz.

## 9. Faz B — Çekirdek kullanım doğrulandıktan sonra

Faz A pilot koç ve öğrencilerle iki–dört haftalık kullanımdan sonra değerlendirilecektir. Öğrenciler günlük plana dönüyor, görevler gerçekten kapanıyor ve koç erken uyarıları kullanıyorsa Faz B başlatılacaktır.

İlk Faz B özelliği **hafif oyunlaştırma** olacaktır: öğrencinin kendi geçmişine göre haftalık ritmi, kişisel seri, tamamlanma yüzdesi ve koç rozeti. Genel sıralama, aşırı rekabet ve dikkat dağıtıcı sosyal akış ilk sürümde eklenmeyecektir.

İkinci sırada **tercih sepeti ve koşul kontrolü** vardır. Üniversite/bölüm hedeflerinden ayrı olarak tercih listesi oluşturma, sürükle-bırak sıralama, şehir, burs, dil, devlet/vakıf, özel kontenjan ve ön lisans/lisans filtreleri; veri güncelleme tarihi ve Excel/PDF çıktı eklenmelidir.

Üçüncü sırada **kontrollü AI koç yardımcısı** bulunur. AI önce deneme raporu özetlemeli, görev taslağı önermeli ve yüklenen PDF’den mini test üretmelidir. Her öneri gerekçeli olmalı; koç onayı olmadan öğrencinin çalışma planını kritik biçimde değiştirmemelidir. Öğrencinin doğrudan cevabı kopyalamasını teşvik etmeyen, yönlendirici pedagojik dil kullanılmalıdır.

## 10. Faz C — Şimdilik ertelenecek kapsam

Geniş soru bankası, binlerce video, herkese açık topluluk, gerçek zamanlı sosyal rekabet, ödeme/abonelik/komisyon ve görüşme kaydı/AI moderasyon bu planın ilk uygulama dalgasına alınmayacaktır. Bu özellikler ya yüksek içerik/moderasyon maliyeti taşır ya da henüz doğrulanmamış bir iş modeline bağlıdır.

Ödeme modülü ancak ücretli abonelik modeli, paket kapsamı, iade, koç payı ve faturalama kararı netleştiğinde planlanacaktır. Görüşme kaydı ise açık rıza, KVKK, saklama süresi, silme ve erişim denetimi tasarlanmadan başlatılmayacaktır.

## 11. Teknik çalışma yöntemi

Her faz bağımsız bir migration, query katmanı, role-specific ekran güncellemesi ve test değişikliği olarak uygulanacaktır. Yeni Supabase tabloları RLS ile başlayacak; yeni `SECURITY DEFINER` fonksiyonlarında `search_path` sabitlenecek, anon erişimleri kapatılacak ve security advisor kontrolü yapılacaktır. Mevcut koç–öğrenci ilişkisindeki RPC desenleri korunacak; kullanıcı tarafından değiştirilebilen `user_metadata` güvenlik yetkilendirmesinde kullanılmayacaktır.

Frontend’de mevcut tasarım token’ları, özel ikon seti, route bazlı code splitting ve `lp-` landing isimlendirme kuralı korunacaktır. Büyük özellikler önce mevcut sayfa ve query katmanlarıyla entegre edilecek; paralel bir CSS veya ikinci veri modeli oluşturulmayacaktır. Her özellikten sonra `npm run build`, `npm test`, `npm run lint`, `git diff --check`, RLS sorgusu ve güvenlik advisor kontrolü yapılacaktır.

Proje kuralına uygun olarak her özellik bağımsız commit ile teslim edilecek; GitHub’a push yalnızca açık onay verildiğinde yapılacaktır. Kullanıcı onayı gelmeden bu planın hiçbir fazı için kod, migration, canlı veritabanı veya dış servis değişikliği uygulanmayacaktır.

## 12. Pilot ve başarı ölçütleri

Koçluk Döngüsü 1.0 tamamlandıktan sonra en az bir gerçek koç ve birkaç gerçek öğrenciyle manuel kabul testi yapılacaktır. Testte yeni ders oluşturma, seans notu, görev üretimi, günlük plan, deneme sonrası aksiyon, gecikme sinyali, veli özeti ve bildirim akışı uçtan uca denenmelidir.

| Metrik | Başarı sinyali |
|---|---|
| Haftalık aktif öğrenci | Öğrenci uygulamaya haftada birden fazla ayrı günde görünür eylem için dönüyor. |
| Görev kapanma oranı | Görev yalnızca atanmış kalmıyor; teslim veya öz değerlendirme ile kapanıyor. |
| Günlük plan kullanım oranı | Öğrenci planı açıyor, blok tamamlıyor veya erteleme kararı veriyor. |
| Seans takip maddesi oranı | Tamamlanan derslerin çoğu somut karar veya takip maddesi üretiyor. |
| Erken uyarı müdahale süresi | Koç sinyali görüyor ve kısa süre içinde aksiyon alıyor. |
| Veli özeti okunma oranı | Veli ham bildirim yerine haftalık özeti açıp anlayabiliyor. |
| Öğrenci geri bildirimi | Planın uygulanabilirliği ve görevlerin anlaşılır olduğu doğrulanıyor. |

## 13. Açık riskler ve varsayımlar

Bu plan, ilk pilotta ücretli abonelik bulunmadığı ve Universitely’nin koç–öğrenci kullanımını doğrulamak istediği varsayımıyla hazırlanmıştır. Öğrenci davranışı hakkında henüz yeterli kullanım verisi bulunmadığı için öncelik skorları ölçülmüş pazar verisi değil, stratejik varsayımdır; pilot sonuçlarına göre sıralama değişebilir.

AI önerileri yanlış veya aşırı yönlendirici olabilir. Bu nedenle ilk AI sürümü sınırlı görevlerle ve koç onayıyla çalışmalıdır. Öğrenci/veli verileri için yeni rapor ve sinyallerin RLS kapsamı dikkatle tasarlanmalıdır. PDF’den otomatik soru üretimi telif, kalite ve yanlış bilgi riskleri taşır; yalnızca kullanıcının yüklediği veya kullanım hakkı doğrulanmış içerikle sınırlandırılmalıdır.

## 14. İlk uygulama fazının kesin kapsamı

Plan onaylandıktan sonra ilk kodlama paketi yalnızca şu dört parçayı içerecektir: **seans notu ve takip maddeleri veri modeli**, **koç/öğrenci ders kapanış ekranı**, **takip maddesini mevcut göreve bağlama**, **öğrenci ve veli görünürlük kuralları**. Bu paket doğrulanmadan günlük akıllı çalışma planına geçilmeyecektir.
