-- Universitely Faz A - TEK SORGU TEŞHİS
-- Bu TEK sorguyu calistir; tek tablo gelecek. O tablodaki TUM satirlari kopyala ve yapistir.

select '1) ogrenciler kolon yapisi' as bolum,
       coalesce(to_jsonb(array_agg(t))::text, '[]') as cikti
from (
  select column_name, data_type, is_nullable, column_default
  from information_schema.columns
  where table_schema = 'public' and table_name = 'ogrenciler'
  order by ordinal_position
) t

union all

select '2) ogrenciler kayitlari (koc eslesmesi)',
       coalesce(to_jsonb(array_agg(t))::text, '[]')
from (select id, ad_soyad, ogretmen_id, aktif, davet_kodu from public.ogrenciler order by ad_soyad) t

union all

select '3) davet_kodlari (kod kime ait, kullanildi mi)',
       coalesce(to_jsonb(array_agg(t))::text, '[]')
from (select kod, olusturan_id, ogrenci_adi, aktif, kullanildi_mi from public.davet_kodlari order by created_at desc) t

union all

select '4) davet koduyla kaydolan kullanicilar (auth metadata)',
       coalesce(to_jsonb(array_agg(t))::text, '[]')
from (
  select id, raw_user_meta_data ->> 'ad_soyad' as ad_soyad,
         raw_user_meta_data ->> 'davet_kodu' as davet_kodu,
         raw_user_meta_data ->> 'rol' as rol,
         created_at
  from auth.users
  where raw_user_meta_data ? 'davet_kodu'
) t;
