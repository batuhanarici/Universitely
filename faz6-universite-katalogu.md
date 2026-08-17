# Faz 6 — Üniversite ve bölüm katalog araştırması

## Sonuç

ÖSYM, 2026-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzu’nun 21 Temmuz 2026 tarihinde yayımlandığını ve tercih sürecinde adayların güncel kılavuzu takip etmesi gerektiğini duyuruyor: https://www.osym.gov.tr/2026yks-yuksekogretim-programlari-ve-kontenjanlari-kilavuzunun-yayimlanmasi

YÖK Atlas için kamuya açık, kararlı bir JSON API bulunamadı. YÖK Atlas’ın lisans/önlisans sayfaları HTML ve form seçenekleri üzerinden çalışıyor; açık kaynak scraper örneği de üniversite ve programları sayfa HTML’inden Puppeteer ile çıkardığını belirtiyor: https://raw.githubusercontent.com/hdd42/universite_bolum_listesi/master/spider.js ve https://raw.githubusercontent.com/hdd42/universite_bolum_listesi/master/spider2.js

Açık kaynak `nejdetkadir/universities-in-turkey-api` reposu üniversite, fakülte, yüksekokul ve bölüm endpointleri tanımlıyor; ancak endpoint kimlik doğrulaması istiyor ve canlı public servis adresi sağlamıyor. Repo statik YAML verileri 2021 tabanlı bir yedek olarak erişilebilir: https://github.com/nejdetkadir/universities-in-turkey-api

## Uygulanan mimari

`yok-katalog` adlı Supabase Edge Function, JWT doğrulamalı olarak frontend’den çağrılıyor. Önce YÖK Atlas’ın lisans/önlisans HTML sayfasını ve seçili üniversitenin program sayfasını alıp üniversite/program seçeneklerini normalize ediyor. YÖK Atlas ağı erişilemez olduğunda, kullanıcı akışının tamamen kırılmaması için açık kaynak statik YAML snapshot’ına düşüyor. Smoke test sonucu fallback üzerinden **223 üniversite** ve Adıyaman Üniversitesi için **34 lisans programı** döndü.

Statik yedek güncel resmi tercih verisi yerine geçmez; tercih robotu yapılırken her program için yıl, puan türü, kontenjan ve başarı sırası gibi alanlar ÖSYM/YÖK Atlas’ın ilgili yıl verisiyle ayrıca doğrulanmalıdır. Bu nedenle hedef seçim ekranındaki katalog seçimi ile ilerideki tercih robotunun puan/başarı sırası hesapları birbirinden ayrılmıştır.

## Kod ve migration

- `supabase/functions/yok-katalog/index.ts`
- `supabase/faz21_universite_hedefleri.sql`
- `src/lib/universiteQueries.ts`
- `src/pages/ogrenci/Hedefler.tsx`
- Öğrenci route: `/student/goals`
- Supabase Edge Function: `yok-katalog`, JWT doğrulama açık
