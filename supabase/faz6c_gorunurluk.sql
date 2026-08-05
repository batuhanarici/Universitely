-- Universitely Faz A - Adim 3/3: scoped view'lar + koç policy'leri + eski RPC temizligi
-- Supabase > SQL Editor > New query > yapistir > RUN (3/3)  [Adim 1 ve 2'yi once calistir]

-- View'lar görünüm sahibi (postgres) ayrıcalıklarıyla çalışır; görünürlük WHERE
-- icindeki auth.uid() filtreleriyle saglanir (sinif_sonuclari ile ayni desen).

-- Koç sonuçları: koçun kendi öğrencileriyle sınırlı
create or replace view public.koc_sonuclari
as
select
  s.id,
  s.deneme_id,
  s.ogrenci_id,
  s.soru_no,
  s.durum,
  d.ad as deneme_adi,
  d.tarih,
  o.ad_soyad,
  k.ad as konu_adi,
  ders.ad as ders_adi
from public.sonuclar s
join public.denemeler d on d.id = s.deneme_id
join public.ogrenciler o on o.id = s.ogrenci_id
left join public.sablon_sorulari ss on ss.sablon_id = d.sablon_id and ss.soru_no = s.soru_no
left join public.konular k on k.id = ss.konu_id
left join public.dersler ders on ders.id = k.ders_id
where public.ogrencim_mi(s.ogrenci_id);

grant select on public.koc_sonuclari to authenticated;

-- Veli sonuçları: veli kendi çocuğunun sonuçlarını görür
create or replace view public.veli_sonuclari
as
select
  s.id,
  s.deneme_id,
  s.ogrenci_id,
  s.soru_no,
  s.durum,
  d.ad as deneme_adi,
  d.tarih,
  k.ad as konu_adi,
  ders.ad as ders_adi
from public.sonuclar s
join public.denemeler d on d.id = s.deneme_id
left join public.sablon_sorulari ss on ss.sablon_id = d.sablon_id and ss.soru_no = s.soru_no
left join public.konular k on k.id = ss.konu_id
left join public.dersler ders on ders.id = k.ders_id
where exists (
  select 1 from public.veliler v
  where v.id = auth.uid() and v.ogrenci_id = s.ogrenci_id
);

grant select on public.veli_sonuclari to authenticated;

-- Bilinen öğretmen policy'lerini koç'a özel yap (cross-coach görünürlüğü kapat)
drop policy if exists "ogretmen profilleri gorur" on public.ogrenci_profilleri;
create policy "koc profilleri gorur" on public.ogrenci_profilleri
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen calismalari gorur" on public.calisma_kayitlari;
create policy "koc calismalari gorur" on public.calisma_kayitlari
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen gorev gorur ve atar" on public.gorevler;
create policy "koc gorev gorur ve atar" on public.gorevler
  for all using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id))
  with check ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen konu ilerlemelerini gorur" on public.konu_ilerlemeleri;
create policy "koc konu ilerlemelerini gorur" on public.konu_ilerlemeleri
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen kaynaklari gorur" on public.kitaplar;
create policy "koc kaynaklari gorur" on public.kitaplar
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen yanlis arsivini gorur" on public.yanlis_arsivi;
create policy "koc yanlis arsivini gorur" on public.yanlis_arsivi
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen tekrar planlarini gorur" on public.tekrar_planlari;
create policy "koc tekrar planlarini gorur" on public.tekrar_planlari
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

-- Eski tek-koç RPC'sini kaldır
drop function if exists public.ogretmen_hesap_id();

-- PostgREST schema cache yenile (yeni view/fonksiyonlarin API'de gorunmesi icin)
notify pgrst, 'reload schema';

-- Dogrulama (2 satir da dolu olmali)
select to_regclass('public.koc_sonuclari') as view_koc,
       to_regclass('public.veli_sonuclari') as view_veli;
