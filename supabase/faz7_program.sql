-- Universitely Faz B: Program & Görev
-- Bu dosyayi Supabase > SQL Editor'de calistir. (Idempotent: tekrar calistirilabilir.)
--
-- Icerik:
--   1) gorevler'e  kontrol_edildi + geri_bildirim  kolonlari (koç onay akisi)
--   2) kitaplar'a  koç INSERT (kendi öğrencisine kaynak atar)
--   3) konu_ilerlemeleri'ne koç INSERT (kendi öğrencisine konu atar)

-- ============ 1) gorevler: kontrol + geri bildirim ============
alter table public.gorevler
  add column if not exists kontrol_edildi boolean not null default false;

alter table public.gorevler
  add column if not exists geri_bildirim text;

-- ============ 2) kitaplar: koç kendi öğrencisine kaynak atayabilir ============
-- (faz6c'de yalnizca SELECT vardi; artik INSERT/UPDATE/DELETE de açildi)
drop policy if exists "ogretmen kaynaklari gorur" on public.kitaplar;
drop policy if exists "koc kaynaklari gorur" on public.kitaplar;
create policy "koc kaynaklari gorur ve atar" on public.kitaplar
  for all using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id))
  with check ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

-- ============ 3) konu_ilerlemeleri: koç kendi öğrencisine konu atayabilir ============
-- (faz6c'de yalnizca SELECT vardi; artik INSERT/UPDATE/DELETE de açildi)
drop policy if exists "ogretmen konu ilerlemelerini gorur" on public.konu_ilerlemeleri;
drop policy if exists "koc konu ilerlemelerini gorur" on public.konu_ilerlemeleri;
create policy "koc konu ilerlemelerini yonetir" on public.konu_ilerlemeleri
  for all using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id))
  with check ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

-- ============ Dogrulama ============
-- 2 satir da dolu olmali (kontrol_edildi, geri_bildirim)
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'gorevler'
  and column_name in ('kontrol_edildi', 'geri_bildirim');

-- 3 policy de mevcut olmali (kitaplar, konu_ilerlemeleri; gorevler zaten 'koc gorev gorur ve atar')
select tablename, policyname, permissive, cmd
from pg_policies
where schemaname = 'public' and policyname in ('koc kaynaklari gorur ve atar', 'koc konu ilerlemelerini yonetir', 'koc gorev gorur ve atar');
