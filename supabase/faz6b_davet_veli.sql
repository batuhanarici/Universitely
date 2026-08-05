-- Universitely Faz A - Adim 2/3: davet kodlari + veliler tablolari ve fonksiyonlar
-- Supabase > SQL Editor > New query > yapistir > RUN (2/3)  [Adim 1'i once calistir]

-- ============ davet_kodlari ============
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

-- Davet kodu doğrula (kayıt öncesi)
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
-- Önemli: Ogrencinin "ogrenciler" satiri yoksa OLUSTURUR (self-registration).
-- "kullanildi_mi" kontrolu burada YOKTUR: ayni ogrenci her girisinde kendi
-- metadata'sindaki kodla yeniden baglanabilir (ayni kod yeni kayit icin
-- davet_kodunu_dogrula tarafindan hala engellenir).
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

-- ============ veliler ============
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

-- Veli kaydını koda göre bağla
create or replace function public.veli_bagla(kod text, ad_soyad text)
returns boolean
language plpgsql security definer
set search_path = public
as $fn$
declare
  ogr uuid;
begin
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

-- Velinin çocuğunun koçu
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

-- Veli aktif mi
create or replace function public.veli_mi()
returns boolean
language sql security definer stable
set search_path = public
as $fn$
  select exists (select 1 from public.veliler where id = auth.uid());
$fn$;

revoke all on function public.veli_mi() from public;
grant execute on function public.veli_mi() to authenticated;

-- Öğrencinin aktif/pasif durumunu değiştir
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

-- Dogrulama (5 satir da dolu olmali)
select to_regprocedure('public.davet_kodunu_dogrula(text)') as fn_dogrula,
       to_regprocedure('public.davet_kodunu_bagla(text)') as fn_bagla,
       to_regprocedure('public.veli_bagla(text, text)') as fn_veli_bagla,
       to_regprocedure('public.velinin_kocu()') as fn_velinin_kocu,
       to_regprocedure('public.ogrenci_aktif_yap(uuid, boolean)') as fn_aktif_yap;
