# Faz 8 — Minimum admin ve operasyon paneli

## Uygulanan kapsam

- `admin_users`: Admin yetkisi user metadata’ya değil, yalnızca güvenli bir tabloya bağlandı. İlk admin olarak `batuhan07arc@gmail.com` için mevcut Auth kullanıcısı seed edildi.
- `hesap_durumlari`: Hesap aktif/askıda durumu, neden, değiştiren admin ve zaman bilgisi tutuluyor. Admin RPC’si kendi hesabını askıya alamıyor; askıya alınan hesap uygulama panellerine giremiyor.
- `sikayetler`: Kullanıcılar Ayarlar > Destek sekmesinden teknik, koç, öğrenci, içerik veya diğer kategorilerinde bildirim bırakabiliyor. Admin şikâyet durumunu ve notunu yönetebiliyor.
- `admin_audit_log`: Hesap askıya alma/aktifleştirme ve koç daveti gibi kritik operasyonlar kayıt altına alınıyor.
- `admin_istatistik`: Kullanıcı, öğrenci, koç, görev, şikâyet, askıdaki hesap ve son 30 günlük kayıt sayaçlarını döndürüyor.
- `admin-davet-koc` Edge Function: Admin JWT’sini doğrulayıp Supabase Auth üzerinden e-posta daveti gönderiyor, davet edilen kullanıcıyı `ogretmen` rolü ve koç profiliyle başlatıyor.

## Frontend

Admin panel route’u role-gated olarak App’e bağlandı. `/admin/dashboard`, `/admin/users`, `/admin/coaches`, `/admin/complaints` ve `/admin/statistics` sekmeleri mevcut. Satın alma yönetimi, ücretli abonelik henüz aktif olmadığı için işlevsel modül olarak açılmadı; panelde açıkça ertelenmiş durum gösteriliyor.

## Güvenlik doğrulaması

Admin tabloları RLS ile etkin. Admin fonksiyonları `SECURITY DEFINER`, `search_path` sabit ve içlerinde `admin_mi()` kontrolü bulunuyor. `anon` execute izinleri kapatıldı; yalnızca `authenticated` rolü RPC çağırabiliyor. Advisor’da yeni admin anon uyarısı kalmadı. Advisor’ın mevcut sistemden gelen `user_metadata` policy ve önceki SECURITY DEFINER uyarıları devam ediyor; bunlar bu fazda yeni oluşturulmadı.
