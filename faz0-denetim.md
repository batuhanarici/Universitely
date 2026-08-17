# Faz 0 Denetim Bulguları — Universitely

## İncelenen kaynaklar

Repository: `batuhanarici/Universitely`, klonlanan son commit: `e49af62 (HEAD -> main, origin/main, origin/HEAD)`. Frontend Vite + React + TypeScript, Supabase JS ile doğrudan erişim ve Vitest test altyapısı kullanıyor. Route yapısı `src/App.tsx` içinde lazy-load ile yönetiliyor; koçta `/coach/weekly-program`, `/coach/meetings`, `/coach/notifications`, `/coach/task-management`, `/coach/assign-resource` rotaları mevcut. Öğrencide `/student/calendar` mevcut `src/pages/ogrenci/Takvim.tsx` bileşenine bağlı.

Canlı Supabase projesi `tqgxajroffbrfqjgyvjk` / `Universitely`, bölge `eu-central-1`, durum `ACTIVE_HEALTHY` olarak doğrulandı. Canlı şemada `gorevler`, `gorusmeler`, `bildirimler`, `ogrenciler`, `ogrenci_profilleri`, `subeler` ve mevcut raporlama tabloları bulunuyor.

## Mevcut yapı

Öğrenci takvimi şu anda yalnızca gün bazlı `gorevler` ve `tekrar_planlari` kayıtlarını gösteriyor. `gorevler` tablosunda başlangıç saati veya bitiş saati yok; bu nedenle gerçek koçluk dersi için bu tablo genişletilmeyecek.

Koç tarafında `gorusmeler` tablosu ve `GorusmeYonetimi.tsx` üzerinden çalışan saatli kayıt CRUD’u zaten var. Canlı tablo alanları `ogrenci_id`, `katilimci`, `baslik`, `tarih timestamptz`, `durum`, `notlar`, `created_at`. Koç RLS’i `ogretmen_mi() AND ogrencim_mi(ogrenci_id)` ile sınırlandırılmış; veli için select politikası var, fakat öğrenci için doğrudan select politikası bulunmuyor. Bu model yeni koçluk dersi akışının temeli olarak yeniden kullanılabilir veya ders tipini ayırt edecek şekilde genişletilebilir; yeni ayrı bir takvim tablosu açmadan önce bu seçenek tercih edilecek.

Bildirim merkezi tamamen mevcut: `bildirimler` tablosunda alıcı, tür, başlık, detay, gönderici, ilgili kayıt, hedef, okunma/arşiv durumu, kaynak ve oluşturulma zamanı bulunuyor. RLS yalnızca alıcının kendi bildirimlerini yönetmesine izin veriyor. Supabase Realtime yayını mevcut. Mevcut sistem hatırlatmaları sayfa açılışında istemci tarafında hesaplayıp `kaynak` anahtarıyla DB’ye senkronluyor; ders başlangıcından bir saat önce arka planda üretim henüz yok.

Canlı RLS denetiminde `gorusmeler` için koç yönetimi ve veli okuma, `bildirimler` için alıcı yönetimi, `gorevler` için öğrenci yönetimi, koç yönetimi ve veli okuma politikaları görüldü. Yeni ders kayıtlarında öğrenci okuma erişimi açıkça tasarlanmalı; yalnızca frontend’de route göstermek yeterli olmayacak.

## Faz 1 için teknik kararlar

1. Ders kaydı için mevcut `gorusmeler` tablosu temel alınacak; çünkü saatli `timestamptz`, durum ve öğrenci ilişkisi zaten var.
2. Ders ile mevcut veli/koç görüşmesini ayırmak için yeni bir `tur` veya eşdeğer açık alan eklenecek; varsayılan geriye dönük olarak mevcut görüşme davranışını bozmayacak.
3. Öğrenci select politikası, yalnızca öğrencinin kendi `auth.uid()` kaydını görmesine izin verecek şekilde yazılacak. Veli politikası korunacak.
4. Koç arayüzünde mevcut `GorusmeYonetimi` ile yeni ders yönetimi arasında ortak query katmanı kullanılacak; aynı veri için paralel CRUD kurulmayacak.
5. Öğrenci `Takvim` ekranı görev/tekrar görünümünü koruyacak; saatli dersler aynı haftalık görünümde ayrı görsel tür olarak eklenecek.
6. Bildirim merkezi mevcut `bildirimler` tablosu ve Realtime üzerinden genişletilecek. Bildirim kaynağı ders id’siyle deterministik hale getirilecek; aynı ders için çift bildirim önlenecek.
7. Dosya yükleme Faz 5’e bırakılacak. Avatar dışı özel dosya bucket/policy henüz bulunmadığından bu fazda storage değişikliği yapılmayacak.
8. `gorevler` RLS’i canlıda `ogrencim_mi` ve `ogretmen_mi` ile ilişki-scoped görünüyor; yeni migration’lar bu desenle uyumlu olacak ve her migration sonrası security advisor çalıştırılacak.

## Risk ve takip notları

`gorusmeler` tablosunu genişletmek en az veri çoğaltan yoldur; ancak mevcut veli takviminde görüşmeler ayrı listelendiği için `tur` filtresinin veli görünümünü bozmaması gerekir. Faz 1 migration’ı uygulanmadan önce canlıdaki mevcut `gorusmeler` satırlarının varsayılan türle geriye dönük uyumlu kalacağı doğrulanacaktır.

Ders hatırlatmasının üretim mekanizması Faz 2’nin kararıdır. Uygulama içi bildirim kaydı ortak kalacak; ilk aday, Supabase tarafında zamanlanmış kontrol veya mevcut Edge Function altyapısının bildirim tablosuna güvenli insert yapmasıdır. Manus oturum zamanlayıcısı, derslerin büyüyen kapsamı ve saatlik doğruluk ihtiyacı için kullanılmayacaktır.

Bu dosya yalnızca denetim ve tasarım kaydıdır; canlı veritabanına hiçbir DDL/DML değişikliği uygulanmamıştır.
