-- Universitely Faz A - Adim 1/3: ogrenciler kolonlari + yardimci fonksiyonlar
-- Supabase > SQL Editor > New query > yapistir > RUN (1/3)
-- Basarili olursa tum satirlarda "Success" yazmali.

alter table public.ogrenciler
  add column if not exists ogretmen_id uuid references auth.users(id) on delete set null;

alter table public.ogrenciler
  add column if not exists aktif boolean not null default true;

alter table public.ogrenciler
  add column if not exists davet_kodu text;

create index if not exists ogrenciler_ogretmen_idx on public.ogrenciler (ogretmen_id);

-- Koç, bu öğrencinin koçu mu?
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

-- Öğrencinin koçunun auth user id'si
create or replace function public.benim_ogretmen_id()
returns uuid
language sql security definer stable
set search_path = public
as $fn$
  select ogretmen_id from public.ogrenciler where id = auth.uid();
$fn$;

revoke all on function public.benim_ogretmen_id() from public;
grant execute on function public.benim_ogretmen_id() to authenticated;

-- Koçun kendi öğrencileri
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

-- Dogrulama (3 satir da dolu olmali)
select to_regprocedure('public.ogrencim_mi(uuid)') as fn_ogrencim_mi,
       to_regprocedure('public.benim_ogretmen_id()') as fn_benim,
       to_regprocedure('public.koc_ogrencileri()') as fn_koc_ogrencileri;
