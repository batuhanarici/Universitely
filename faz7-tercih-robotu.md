# Faz 7 — Üniversite tercih robotu

## Veri kaynağı

Robotun program kataloğu, ÖSYM’nin yayımladığı **2026-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzu** PDF’sinin Tablo 3 ve Tablo 4 bölümlerinden üretildi. Kılavuz Tablo 3’te ön lisans, Tablo 4’te lisans programlarını; program kodu, puan türü, kontenjan ve 2025-YKS başarı sırası/en küçük puan alanlarını veriyor. Kaynak: https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/TERCIH/kontkilavuz_yktd21072026.pdf

Yerel üretim parser’ı `scripts/parse_kilavuz.py` olup `public/data/yks-2026-programlari.json` dosyasını oluşturuyor. Katalogda 20.550 program var; 16.739 program için 2025 başarı sırası ve en küçük puan alanı dolu.

## Robot mantığı

Öğrenci TYT, SAY, SÖZ, EA veya DİL puan türünden birini, program türünü, isteğe bağlı üniversite/bölüm aramasını ve kendi başarı sırasını giriyor. Robot yalnızca aynı puan türündeki, geçmiş başarı sırası bulunan ve tercihen kontenjanı pozitif olan programları filtreliyor.

Risk etiketi geçmiş kapanış sırasına göre açıklanabilir bir oranla hesaplanıyor: aday sırası geçmiş kapanışın %80’i veya daha iyiyse **daha güvenli**, %80–110 aralığındaysa **dengeli**, daha gerideyse **iddialı**. Sıralama küçük değer daha iyi anlamına geldiği için bu karşılaştırma açıkça kullanıcıya gösteriliyor.

## Ürün sınırı

Robot yerleşme garantisi veya resmî tercih bildirimi yapmıyor. Etiketler yalnızca 2025 geçmiş verisine dayalı yönlendirme. Kılavuzdaki koşullar, güncel tercih dönemi kılavuzu ve YÖK Atlas program detayları ayrıca incelenmeli. ÖSYM kılavuzu da tercihlerin puan, program kontenjanı ve koşullara göre yapıldığını; adayın koşulları karşılamadığı programları tercih etmemesi gerektiğini belirtiyor.

## Kod

- `scripts/parse_kilavuz.py`
- `public/data/yks-2026-programlari.json`
- `src/lib/tercihRobotuQueries.ts`
- `src/lib/tercihRobotuQueries.test.ts`
- `src/pages/ogrenci/TercihRobotu.tsx`
- Öğrenci route: `/student/preference-robot`
