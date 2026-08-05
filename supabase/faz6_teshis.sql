-- Universitely Faz A - TESHiS (tanilama)
-- Bu script'i SQL Editor'de calistir ve cikan sonuc tablolarini bana yapistir.

-- 1) ogrenciler tablosunun kolon yapisi (insert'iniz neden basarisiz olabilir gosterir)
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'ogrenciler'
order by ordinal_position;

-- 2) ogrenciler tablosundaki tum kayitlar (koc ile eslesme var mi?)
select id, ad_soyad, ogretmen_id, aktif, davet_kodu
from public.ogrenciler
order by ad_soyad;

-- 3) uretilen davet kodlari (kod koc'a ait mi, kullanilmis mi?)
select kod, olusturan_id, ogrenci_adi, aktif, kullanildi_mi, created_at
from public.davet_kodlari
order by created_at desc;

-- 4) davet koduyla kaydolmus kullanicilar (auth metadata'sinda kod var mi?)
select id, raw_user_meta_data ->> 'ad_soyad' as ad_soyad,
       raw_user_meta_data ->> 'davet_kodu' as davet_kodu,
       raw_user_meta_data ->> 'rol' as rol,
       created_at
from auth.users
where raw_user_meta_data ? 'davet_kodu'
order by created_at desc;

-- 5) davet_kodunu_bagla fonksiyonunun su anki hali (duzeltilmis surum mu?)
select pg_get_functiondef(p.oid) as fonksiyon
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'davet_kodunu_bagla';
