# Universitely — Ürün Geliştirme Teslim Raporu

**Tarih:** 17 Ağustos 2026  
**Çalışma alanı:** `/home/ubuntu/Universitely`  
**Durum:** Kod ve canlı Supabase değişiklikleri tamamlandı; GitHub’a push yapılmadı.

## Yönetici özeti

Onaylanan ürün yaklaşımına uygun olarak önce koç–öğrenci kullanım sıklığını artıracak çekirdek akışlar geliştirildi. Koçluk dersi takvimi, uygulama içi ders hatırlatması, öğrenci okul ders programı, kaynak dosyalı görev teslimi, üniversite hedef seçimi ve açıklanabilir tercih robotu tamamlandı. Bu çekirdek kullanımın üzerine minimum admin ve operasyon paneli eklendi.

Ücretli abonelik aktif olmadığı için satın alma yönetimi bu teslimde işlevsel bir modül olarak açılmadı. Admin panelinde bu durum açıkça gösteriliyor ve ödeme modülü ayrı bir gelecek fazına bırakıldı.

## Teslim edilen modüller

| Faz | Özellik | Sonuç |
|---|---|---|
| 1 | Koçluk dersi takvimi | Koç, öğrenci ve şube seçerek saatli ders oluşturabiliyor; öğrenci dersi kendi takviminde görüyor. |
| 2 | Ders hatırlatması | Supabase `pg_cron` her dakika çalışıyor; ders başlangıcından yaklaşık bir saat önce tekilleştirilmiş uygulama içi bildirim üretiyor. İptal veya saat değişikliğinde eski hatırlatma temizleniyor. |
| 3 | Okul ders programı | Öğrenci haftalık tekrar eden okul derslerini ekleyip silebiliyor; dersler ortak takvimde gösteriliyor. |
| 4 | Dosyalı görev teslimi | Koç private Storage’a kaynak yükleyebiliyor; öğrenci çözüm dosyasını geri gönderebiliyor. İki tarafa da uygulama içi bildirim gidiyor. |
| 5 | Üniversite hedefleri | YÖK katalog Edge Function’ı üzerinden üniversite ve bölüm seçimi yapılıyor; hedef RLS korumalı tabloya kaydediliyor. |
| 6 | Üniversite tercih robotu | 2026 ÖSYM kılavuzundan üretilen 20.550 programlık yerel katalog; puan türü, öğrenim türü, üniversite/bölüm araması ve başarı sırası filtreleri. |
| 7 | Admin ve operasyon | Admin rolü tablo tabanlı; kullanıcı yönetimi, hesap askıya alma/aktifleştirme, koç e-posta daveti, şikâyet inceleme ve istatistik ekranları hazır. |

## Admin güvenlik yaklaşımı

Admin yetkisi değiştirilebilir `user_metadata` alanına bağlanmadı. `admin_users` tablosu ve `admin_mi()` fonksiyonu ile doğrulanıyor. Kritik işlemler `SECURITY DEFINER` RPC’leri üzerinden ve fonksiyon içinde admin kontrolüyle çalışıyor. Anon execute erişimleri kapatıldı; canlı doğrulamada yeni admin fonksiyonlarının `anon_execute=false` olduğu görüldü.

Hesap askıya alma işlemi `hesap_durumlari` tablosunda neden ve değiştiren admin bilgisiyle saklanıyor. Uygulama açılışında hesap durumu kontrol ediliyor; askıdaki kullanıcıya paneller yerine açıklama ekranı gösteriliyor. Admin kendi hesabını askıya alamıyor. Kritik operasyonlar `admin_audit_log` tablosuna yazılıyor.

Supabase Security Advisor, bu fazda oluşturulan admin tabloları için yeni RLS uyarısı üretmedi. Advisor’da görülen diğer uyarılar daha önce var olan sistem view’ları, eski `user_metadata` policy’leri ve önceki SECURITY DEFINER fonksiyonlarıyla ilgilidir; bu teslimde yeni oluşturulmamıştır.

## Tercih robotu veri sınırı

Tercih robotu, ÖSYM’nin 2026-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzu’ndaki 2025-YKS başarı sırası ve en küçük puan alanlarını karşılaştırır. “Daha güvenli”, “dengeli” ve “iddialı” etiketleri yalnızca geçmiş veriye dayalı yardımcı sınıflandırmadır; yerleşme garantisi değildir. Program koşulları ve tercih dönemi yayımlanan son resmî kılavuz ayrıca kontrol edilmelidir.

YÖK Atlas erişilemediğinde kullanılan açık statik katalog yedeği 2021 tabanlıdır. Bu yedek kullanıcı deneyimini korumak içindir; güncel puan, başarı sırası veya kontenjan verisi yerine kullanılmamalıdır.

## Doğrulama sonuçları

| Kontrol | Sonuç |
|---|---|
| `npm run build` | Başarılı |
| `npm test` | 5 test dosyası, 40 test başarılı |
| `npm run lint` | 0 hata, 7 mevcut uyarı |
| `git diff --check` | Başarılı |
| Supabase migration’ları | Faz 17–22 canlıda uygulandı |
| Supabase Edge Functions | `yok-katalog` ve `admin-davet-koc` aktif |
| Ders cron görevi | Aktif ve read-only sorguyla doğrulandı |
| Admin RPC ACL | Anon erişim kapalı, authenticated erişim kontrollü |

Lint uyarıları hata değildir. Kalan yedi uyarı, çoğunlukla mevcut Fast Refresh export desenleri ve önceki React Hook dependency desenlerinden kaynaklanmaktadır; yeni DersTakvimi ve Takvim uyarıları giderilmiştir.

## Git ve sonraki adım

Değişiklikler `/home/ubuntu/Universitely` çalışma alanında hazırdır. Proje kuralı gereği GitHub’a push yapılmadı; bunun için ayrıca açık onay gerekir. Sonraki operasyonel adım, gerçek bir koç ve öğrenci hesabıyla ders oluşturma, bildirim alma, dosya yükleme, şikâyet açma ve admin durumu değiştirme akışlarını tarayıcı üzerinden manuel kabul testiyle doğrulamaktır.

## Kaynaklar

[1]: https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/TERCIH/kontkilavuz_yktd21072026.pdf "ÖSYM 2026-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzu"

[2]: https://yokatlas.yok.gov.tr/ "YÖK Atlas"

[3]: https://www.osym.gov.tr/2026yks-yuksekogretim-programlari-ve-kontenjanlari-kilavuzunun-yayimlanmasi "ÖSYM 2026-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzunun Yayımlanması"
