# E-posta Kurulum Rehberi

Üniversitely, doğrulama ve şifre sıfırlama e-postalarını **Supabase Auth** üzerinden gönderir.
Şablonlar Supabase dashboard'da düzenlenir; bu klasördeki HTML dosyaları o temaya hazır şablonlardır.

## Mimari (kısaca)
- **Doğrulama / şifre sıfırlama / e-posta değiştirme** → Supabase Auth tarafından gönderilir.
  Gönderim, dashboard'a bağladığın **SMTP** (önerilen: Resend ücretsiz) üzerinden yapılır.
- **Günlük hatırlatma mailleri** → `supabase/functions/hatirlatma-email` Edge Function'ı (Resend).

---

## Adım 1 — Resend hesabı ve SMTP bilgileri
1. [resend.com](https://resend.com) adresine kaydol (ücretsiz: 100 mail/gün, 3000/ay).
2. Sol menü **API Keys** → yeni key oluştur (varsa zaten `RESEND_API_KEY` olarak kullanıyorsun).
3. Sol menü **SMTP** → `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` değerlerini kopyala.
   - Ücretsiz planda gönderici: `onboarding@resend.dev`. Bu adresle **yalnızca kendi e-postana** test gönderebilirsin.
   - Gerçek kullanıcılara göndermek için kendi alan adını doğrulaman gerekir (Settings → Domains → DNS kaydı).

## Adım 2 — Supabase'de e-posta doğrulamayı aç
1. Supabase dashboard → projen → **Authentication** → **Sign In / Up**.
2. Sağ üstten **Providers** içindeki **Email** kartına gir.
3. **Confirm email** kutusunu **aç**.
4. **Secure email change** kutusunu da aç (isteğe bağlı).

## Adım 3 — SMTP'yi bağla
1. **Authentication** → **SMTP Settings**.
2. **Enable custom SMTP** kutusunu işaretle.
3. Adım 1'deki Resend değerlerini gir:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) veya `587` (STARTTLS)
   - Username / Password: Resend'den aldıkların
   - Sender email: `onboarding@resend.dev` (domain doğrulayınca kendi adresin)
4. **Save**.

## Adım 4 — Redirect URL'lerini ekle
1. **Authentication** → **URL Configuration**.
2. **Redirect URLs** alanına ekle:
   - `http://localhost:5173` (geliştirme)
   - Yayın adresin (örn. `https://universitely.com`)
3. **Save**.

## Adım 5 — E-posta şablonlarını yapıştır
1. **Authentication** → **Email Templates**.
2. Şu şablonların içeriğini bu klasördeki dosyalarla değiştir:
   - **Confirm signup** → `confirm-signup.html`
   - **Reset password** → `reset-password.html`
   - **Change email address** → `change-email.html`
3. **Subject** alanlarını da güncelle:
   - Confirm signup: `Üniversitely · E-postanı doğrula`
   - Reset password: `Üniversitely · Şifreni sıfırla`
   - Change email: `Üniversitely · E-posta adresini değiştir`

## Adım 6 — Güvenlik bildirim şablonları (yalnızca 2 aktif)
Aynı **Email Templates** sayfasındaki **Security** bölümünde yalnızca şu ikisini doldur
ve yanlarındaki **Notify** anahtarını aç; diğerlerini kapalı bırak:

| Şablon | Dosya | Subject |
| --- | --- | --- |
| Password changed | `password-changed.html` | Üniversitely · Şifren değiştirildi |
| Email address changed | `email-changed.html` | Üniversitely · E-posta adresin değiştirildi |

## Test etme
1. `npm run dev` ile uygulamayı başlat.
2. Öğrenci/Veli kaydı yap → doğrulama ekranı çıkar → gelen kutunu kontrol et.
3. Giriş ekranında **Şifremi Unuttum** → sıfırlama maili gelir → linke tıkla → yeni şifre ekranı açılır.

## Yayına geçmeden önce
- Kendi alan adını al (örn. `universitely.com`) ve Resend'de doğrula (DNS TXT/MX kayıtları).
- SMTP Sender email'i kendi adresine çevir.
- Ücretsiz Resend limiti (100 mail/gün) yetersiz kalırsa Resend ücretli plana veya Brevo ücretsiz (300/gün) geçilebilir.

## Günlük hatırlatma maili (opsiyonel)
`hatirlatma-email` Edge Function'ı her gün `email_bildirim` açık olan öğrencilere hatırlatma gönderir.
Bunu otomatik çalıştırmak için Supabase dashboard → **Edge Functions** → Schedule (pg_cron) veya dış cron ile
günde bir kez çağır (örn. sabah 08:00).
