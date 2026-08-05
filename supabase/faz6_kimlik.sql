-- Universitely Faz A (koç paneli): Çoklu koç + Davet kodu + Veli portalı + RLS scoping
--
-- NOT: Bu dosya tum adimlari tek parcada icerir (teknik referans).
-- Supabase SQL Editor'de sorun yasarsan lutf siralari ayri ayri calistir:
--   1) supabase/faz6a_temel.sql          (kolonlar + yardimci fonksiyonlar)
--   2) supabase/faz6b_davet_veli.sql     (davet kodlari + veliler)
--   3) supabase/faz6c_gorunurluk.sql     (view'lar + policy'ler + cache yenileme)
-- Fonksiyon gövdeleri $fn$ ... $fn$ (isimli dolar-alinti) ile sarilidir.
-- Supabase SQL Editor'un $$ isaretli gövdeleri bozan bilinen bir parcalayici
-- hatasi vardir ("no function body specified" / 42P13); isimli etiket bu
-- sorunu atlatir. View'larda "security definer" yoktur (CREATE VIEW icin
-- gecersizdir); auth.uid() filtreleri zaten gecerli kullaniciya göre daraltir.

-- ============ 1) ogrenciler tablosu: koç ilişkisi + aktif + davet kodu ============
alter table public.ogrenciler
  add column if not exists ogretmen_id uuid references auth.users(id) on delete set null;

alter table public.ogrenciler
  add column if not exists aktif boolean not null default true;

alter table public.ogrenciler
  add column if not exists davet_kodu text;

create index if not exists ogrenciler_ogretmen_idx on public.ogrenciler (ogretmen_id);

-- ============ 2) Yardımcı fonksiyonlar ============
-- Koç, bu öğrencinin koçu mu? (security definer: base RLS'i bypass edip koç kontrolü yapar)
create or replace function public.ogrencim_mi(ogrenci_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $fn$
  select exists (
    select 1 from public.ogrenciler o
    where o.id = ogrenci_id and o.ogretmen_id = auth.uid()
  );
$fn$;

revoke all on function public.ogrencim_mi(uuid) from public;
grant execute on function public.ogrencim_mi(uuid) to authenticated;

-- Öğrencinin koçunun auth user id'si (öğrenci Mesajı ve veli tarafı kullanır)
create or replace function public.benim_ogretmen_id()
returns uuid
language sql security definer stable
set search_path = public
as $fn$
  select ogretmen_id from public.ogrenciler where id = auth.uid();
$fn$;

revoke all on function public.benim_ogretmen_id() from public;
grant execute on function public.benim_ogretmen_id() to authenticated;

-- Koçun kendi öğrencileri (base RLS'ten bağımsız, scoped liste)
create or replace function public.koc_ogrencileri()
returns table (id uuid, ad_soyad text, aktif boolean, davet_kodu text)
language sql security definer stable
set search_path = public
as $fn$
  select o.id, o.ad_soyad, o.aktif, o.davet_kodu
  from public.ogrenciler o
  where o.ogretmen_id = auth.uid()
  order by o.ad_soyad;
$fn$;

revoke all on function public.koc_ogrencileri() from public;
grant execute on function public.koc_ogrencileri() to authenticated;

-- ============ 3) davet_kodlari ============
create table if not exists public.davet_kodlari (
  kod            text primary key,
  olusturan_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ogrenci_adi    text not null,
  aktif          boolean not null default true,
  kullanildi_mi  boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.davet_kodlari enable row level security;

drop policy if exists "koç kendi ürettiği daveti yönetir" on public.davet_kodlari;
create policy "koç kendi ürettiği daveti yönetir" on public.davet_kodlari
  for all using (auth.uid() = olusturan_id) with check (auth.uid() = olusturan_id);

-- Davet kodu doğrula (kayıt öncesi): geçerliyse oluşturan koç id döner
create or replace function public.davet_kodunu_dogrula(kod text)
returns uuid
language sql security definer stable
set search_path = public
as $fn$
  select olusturan_id
  from public.davet_kodlari
  where kod = davet_kodunu_dogrula.kod
    and aktif
    and not kullanildi_mi;
$fn$;

revoke all on function public.davet_kodunu_dogrula(text) from public;
grant execute on function public.davet_kodunu_dogrula(text) to authenticated;

-- Öğrenci kayıt sonrası kodu bağla.
-- Ogrencinin "ogrenciler" satiri yoksa OLUSTURUR (self-registration).
-- "kullanildi_mi" kontrolu burada YOKTUR: ayni ogrenci her girisinde kendi
-- metadata'sindaki kodla yeniden baglanabilir.
create or replace function public.davet_kodunu_bagla(kod text)
returns boolean
language plpgsql security definer
set search_path = public
as $fn$
declare
  koc uuid;
  kod_kayit record;
  ogrenci_adi text;
begin
  select * into kod_kayit
    from public.davet_kodlari
    where davet_kodlari.kod = davet_kodunu_bagla.kod and aktif;
  if kod_kayit is null then
    return false;
  end if;
  koc := kod_kayit.olusturan_id;

  select raw_user_meta_data ->> 'ad_soyad' into ogrenci_adi
    from auth.users where id = auth.uid();

  insert into public.ogrenciler (id, ad_soyad, ogretmen_id, davet_kodu, aktif)
  values (auth.uid(), coalesce(ogrenci_adi, kod_kayit.ogrenci_adi, 'Öğrenci'), koc, davet_kodunu_bagla.kod, true)
  on conflict (id) do update
    set ogretmen_id = excluded.ogretmen_id,
        davet_kodu = excluded.davet_kodu;

  update public.davet_kodlari
    set kullanildi_mi = true
    where davet_kodlari.kod = davet_kodunu_bagla.kod;

  return true;
end;
$fn$;

revoke all on function public.davet_kodunu_bagla(text) from public;
grant execute on function public.davet_kodunu_bagla(text) to authenticated;

-- ============ 4) veliler (tam veli portalı) ============
create table if not exists public.veliler (
  id              uuid primary key references auth.users(id) on delete cascade,
  ogrenci_id      uuid not null references public.ogrenciler(id) on delete cascade,
  baglanti_kodu   text not null unique,
  ad_soyad        text,
  onaylandi       boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table public.veliler enable row level security;

drop policy if exists "veli kendi kaydini gorur" on public.veliler;
create policy "veli kendi kaydini gorur" on public.veliler
  for select using (auth.uid() = id);

-- Veli kaydını koda göre bağla (veli kodu öğretmen tarafından üretilir)
create or replace function public.veli_bagla(kod text, ad_soyad text)
returns boolean
language plpgsql security definer
set search_path = public
as $fn$
declare
  ogr uuid;
begin
  -- Kod, bir öğrencinin davet_kodu kolonundadır (öğretmen öğrenciyi eklerken üretir)
  select id into ogr from public.ogrenciler
    where davet_kodu = veli_bagla.kod;
  if ogr is null then
    return false;
  end if;

  insert into public.veliler (id, ogrenci_id, baglanti_kodu, ad_soyad)
  values (auth.uid(), ogr, veli_bagla.kod, veli_bagla.ad_soyad)
  on conflict (id) do nothing;

  return true;
end;
$fn$;

revoke all on function public.veli_bagla(text, text) from public;
grant execute on function public.veli_bagla(text, text) to authenticated;

-- Velinin çocuğunun koçu (veli mesajlaşması)
create or replace function public.velinin_kocu()
returns uuid
language sql security definer stable
set search_path = public
as $fn$
  select o.ogretmen_id
  from public.veliler v
  join public.ogrenciler o on o.id = v.ogrenci_id
  where v.id = auth.uid();
$fn$;

revoke all on function public.velinin_kocu() from public;
grant execute on function public.velinin_kocu() to authenticated;

-- Veli aktif mi / hangi öğrenciye bağlı (App yönlendirmesi)
create or replace function public.veli_mi()
returns boolean
language sql security definer stable
set search_path = public
as $fn$
  select exists (select 1 from public.veliler where id = auth.uid());
$fn$;

revoke all on function public.veli_mi() from public;
grant execute on function public.veli_mi() to authenticated;

-- Öğrencinin aktif/pasif durumunu değiştir (koç, kendi öğrencisi için)
create or replace function public.ogrenci_aktif_yap(ogrenci_id uuid, yeni_durum boolean)
returns boolean
language plpgsql security definer
set search_path = public
as $fn$
begin
  update public.ogrenciler
    set aktif = yeni_durum
    where id = ogrenci_id and ogretmen_id = auth.uid();
  return found;
end;
$fn$;

revoke all on function public.ogrenci_aktif_yap(uuid, boolean) from public;
grant execute on function public.ogrenci_aktif_yap(uuid, boolean) to authenticated;

-- ============ 5) Koç görünürlüğü: scoped view'lar ============
-- View'lar görünüm sahibi (postgres) ayrıcalıklarıyla çalışır; yani alttaki
-- tabloların RLS'ini bypass ederler. Görünürlük WHERE icindeki auth.uid()
-- filtreleriyle sağlanır (sinif_sonuclari view'i ile aynı desen).
-- Sınıf sonuçları, koçun kendi öğrencileriyle sınırlı (sinif_sonuclari yerine kullanılır)
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

-- Veli sonuçları: veli, kendi çocuğunun sonuçlarını görür
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

-- ============ 6) Bilinen öğretmen policy'lerini koç'a özel yap (cross-coach görünürlüğü kapat) ============
-- Hem eski hem yeni ad drop edilir: dosya tekrar tekrar calistirilabilir.
drop policy if exists "ogretmen profilleri gorur" on public.ogrenci_profilleri;
drop policy if exists "koc profilleri gorur" on public.ogrenci_profilleri;
create policy "koc profilleri gorur" on public.ogrenci_profilleri
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen calismalari gorur" on public.calisma_kayitlari;
drop policy if exists "koc calismalari gorur" on public.calisma_kayitlari;
create policy "koc calismalari gorur" on public.calisma_kayitlari
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen gorev gorur ve atar" on public.gorevler;
drop policy if exists "koc gorev gorur ve atar" on public.gorevler;
create policy "koc gorev gorur ve atar" on public.gorevler
  for all using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id))
  with check ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen konu ilerlemelerini gorur" on public.konu_ilerlemeleri;
drop policy if exists "koc konu ilerlemelerini gorur" on public.konu_ilerlemeleri;
create policy "koc konu ilerlemelerini gorur" on public.konu_ilerlemeleri
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen kaynaklari gorur" on public.kitaplar;
drop policy if exists "koc kaynaklari gorur" on public.kitaplar;
create policy "koc kaynaklari gorur" on public.kitaplar
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen yanlis arsivini gorur" on public.yanlis_arsivi;
drop policy if exists "koc yanlis arsivini gorur" on public.yanlis_arsivi;
create policy "koc yanlis arsivini gorur" on public.yanlis_arsivi
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogretmen tekrar planlarini gorur" on public.tekrar_planlari;
drop policy if exists "koc tekrar planlarini gorur" on public.tekrar_planlari;
create policy "koc tekrar planlarini gorur" on public.tekrar_planlari
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

-- Eski tek-koç RPC'sini kaldır (artık çoklu koç; öğrenci kendi koçunu benim_ogretmen_id ile bulur)
drop function if exists public.ogretmen_hesap_id();
