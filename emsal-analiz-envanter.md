# Emsal Ürün Analizi — Universitely Mevcut Envanter

## Mevcut çekirdek

Universitely; koç, öğrenci ve veli rollerine sahip TYT/AYT koçluk SaaS’ıdır. Mevcut ürün yüzeyinde koç–öğrenci ilişkisi, şube yönetimi, deneme sonuçları, tekrar durumu, görev takibi, raporlar, mesajlaşma, bildirimler, ders takvimi, okul ders programı, private dosya paylaşımı ve öğrenci teslimi bulunmaktadır.

## Son teslimde eklenen özellikler

| Alan | Mevcut durum |
|---|---|
| Koçluk takvimi | Koç saatli ders oluşturabilir; öğrenci takviminde görür. |
| Hatırlatma | Ders öncesi uygulama içi bildirim; `pg_cron` ile tekilleştirilmiş hatırlatma. |
| Okul programı | Öğrenci haftalık tekrar eden okul derslerini yönetebilir. |
| Görev ve dosya | Koç kaynak yükler; öğrenci çözüm dosyası gönderir; iki tarafa bildirim gider. |
| Hedef ve tercih | Üniversite/bölüm hedef seçimi ve 2026 ÖSYM verili tercih robotu. |
| Admin | Kullanıcı, hesap durumu, koç daveti, şikâyet ve istatistik. |
| Veri güvenliği | Supabase Auth, RLS, private Storage, admin tabanlı güvenli RPC’ler. |

## Kullanıcı değeri açısından belirgin boşluklar

Mevcut ürün, koçun operasyonunu dijitalleştiriyor; ancak öğrencinin günlük çalışma davranışını yönlendiren ve tamamlanan çalışmanın öğrenme çıktısını ölçen döngü henüz tam değil. Özellikle çalışma planının otomatik oluşturulması, görevlerin parçalanması, kaynak içi çözüm/yanlış analizi, deneme sonrası kişiselleştirilmiş aksiyon ve koçun müdahale önceliklendirmesi eksik alanlardır.

Ayrıca ürünün veli tarafında salt-okuma görünümünün ötesinde anlaşılır haftalık özet, risk sinyali ve koçla koordinasyon akışı sınırlıdır. Öğrenci ve koç arasında ders sonrası not, karar, hedef ve takip maddelerini tek yerde bağlayan yapı da güçlendirilebilir.

## Araştırmada özellikle karşılaştırılacak emsal yetenek kümeleri

1. Öğrenme uygulamalarında adaptif soru/konu önerisi, kişiselleştirilmiş çalışma planı ve ilerleme analizi.
2. Koçluk uygulamalarında seans notu, hedef/aksiyon takibi, otomatik hatırlatma, veli raporu ve koç iş yükü yönetimi.
3. Sınav hazırlık uygulamalarında soru bankası, video/konu anlatımı, deneme analizi, yanlış defteri, süre yönetimi ve motivasyon/gamification.
4. Öğrenci ve veli ürünlerinde çok kanallı bildirim, güvenli mesajlaşma, erken uyarı ve davranışa dayalı risk skoru.
5. Tercih ürünlerinde güncel kontenjan/başarı verisi, koşul kontrolü, tercih listesi oluşturma, senaryo karşılaştırma ve sonuç açıklama.

## Ön değerlendirme

Universitely’nin farklılaşma fırsatı tek başına yeni bir soru bankası olmak değil; koçun uzmanlığını veriyle destekleyen **koç destekli adaptif çalışma işletim sistemi** olmaktır. Emsal özellikler arasından seçilecek her modül, koçun kararını otomatikleştirmek yerine koçun daha erken ve daha isabetli müdahale etmesini sağlamalıdır.
