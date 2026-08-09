# Universitely

Üniversite sınavına hazırlanan öğrenciler için deneme sonucu takip ve konu bazlı zayıflık analiz sistemi.

## Özellikler
- Ders / Konu yönetimi
- Deneme şablonu oluşturma (soru no -> konu eşleştirme)
- Supabase (Postgres + Auth + RLS) altyapısı

## Kurulum
```
npm install
npm run dev
```

`.env` dosyasına Supabase proje bilgilerin gerekiyor (`.env.example`'a bak).

## Test
```
npm test          # tüm testleri bir kez çalıştırır
npm run test:watch # dosya değişince otomatik tekrar çalışır
```
Şu an yalnızca DB gerektirmeyen saf hesaplama mantığı test ediliyor
(`src/lib/aiMotoru.ts` — koç risk skorlama, `src/lib/oneriMotoru.ts` —
öğrenci öneri motoru). RLS/veritabanı testleri henüz eklenmedi.
