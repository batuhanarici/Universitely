-- Universitely Faz 10: Veli Paneli Genişletmesi
--
-- Veli, çocuğunun gelişim verilerini (çalışma süresi, soru sayısı, görevler,
-- kaynak ilerlemesi, konu ilerlemesi, tekrar planı, görüşme takvimi, hedef
-- profili) yalnızca OKUMAK için erişim kazanır. Yazma yok: veli salt-okur.
--
-- Desen: faz6'daki koç policy'leri ile aynı. Ortak filtre
--   ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'veli'
--    and public.velinin_ogrencisi_mi(ogrenci_id))
-- ile velinin YALNIZCA kendi çocuğunun satırlarına erişmesi sağlanır.
-- Dosya idempotenttir (2. çalıştırmada hata vermez).

-- ============ 1) Yardımcı fonksiyon: veli, bu öğrencinin velisi mi? ============
create or replace function public.velinin_ogrencisi_mi(ogrenci_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $fn$
  select exists (
    select 1 from public.veliler v
    where v.id = auth.uid() and v.ogrenci_id = velinin_ogrencisi_mi.ogrenci_id
  );
$fn$;

revoke all on function public.velinin_ogrencisi_mi(uuid) from public;
grant execute on function public.velinin_ogrencisi_mi(uuid) to authenticated;

-- ============ 2) Veli salt-okur policy'leri ============

drop policy if exists "veli profili gorur" on public.ogrenci_profilleri;
create policy "veli profili gorur" on public.ogrenci_profilleri
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'veli' and public.velinin_ogrencisi_mi(ogrenci_id));

drop policy if exists "veli calismalari gorur" on public.calisma_kayitlari;
create policy "veli calismalari gorur" on public.calisma_kayitlari
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'veli' and public.velinin_ogrencisi_mi(ogrenci_id));

drop policy if exists "veli gorevleri gorur" on public.gorevler;
create policy "veli gorevleri gorur" on public.gorevler
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'veli' and public.velinin_ogrencisi_mi(ogrenci_id));

drop policy if exists "veli kaynaklari gorur" on public.kitaplar;
create policy "veli kaynaklari gorur" on public.kitaplar
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'veli' and public.velinin_ogrencisi_mi(ogrenci_id));

drop policy if exists "veli konu ilerlemelerini gorur" on public.konu_ilerlemeleri;
create policy "veli konu ilerlemelerini gorur" on public.konu_ilerlemeleri
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'veli' and public.velinin_ogrencisi_mi(ogrenci_id));

drop policy if exists "veli tekrar planlarini gorur" on public.tekrar_planlari;
create policy "veli tekrar planlarini gorur" on public.tekrar_planlari
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'veli' and public.velinin_ogrencisi_mi(ogrenci_id));

drop policy if exists "veli gorusmeleri gorur" on public.gorusmeler;
create policy "veli gorusmeleri gorur" on public.gorusmeler
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'veli' and public.velinin_ogrencisi_mi(ogrenci_id));

notify pgrst, 'reload schema';
