-- Universitely Faz 11: Profil Sayfaları
-- Öğrenci: okul/sınıf/avatar · Koç: ogretmen_profilleri · Veli: telefon/yakinlik/avatar · avatars bucket
-- Kullanım: Supabase > SQL Editor > New query > yapıştır > RUN (idempotent)

-- ============ 1) ogrenci_profilleri: okul + sınıf + avatar ============
alter table public.ogrenci_profilleri
  add column if not exists okul       text,
  add column if not exists sinif      text,
  add column if not exists avatar_url text;

-- ============ 2) ogretmen_profilleri (yeni) ============
create table if not exists public.ogretmen_profilleri (
  ogretmen_id    uuid primary key default auth.uid()
                 references auth.users(id) on delete cascade,
  ad_soyad       text,
  brans          text,
  telefon        text,
  kurum          text,
  biyografi      text,
  avatar_url     text,
  email_bildirim boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.ogretmen_profilleri enable row level security;

drop policy if exists "koc kendi profilini yonetir" on public.ogretmen_profilleri;
create policy "koc kendi profilini yonetir" on public.ogretmen_profilleri
  for all using (auth.uid() = ogretmen_id) with check (auth.uid() = ogretmen_id);

-- ============ 3) veliler: telefon + yakinlik + avatar ============
alter table public.veliler
  add column if not exists telefon         text,
  add column if not exists yakinlik        text,
  add column if not exists avatar_url      text,
  add column if not exists email_bildirim  boolean not null default true;

-- Veli kendi kaydını güncelleyebilsin (ad_soyad, telefon, yakinlik, avatar_url)
drop policy if exists "veli kendi kaydini gunceller" on public.veliler;
create policy "veli kendi kaydini gunceller" on public.veliler
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============ 4) avatars storage bucket + policy ============
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatarlari herkes okur" on storage.objects;
create policy "avatarlari herkes okur" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "kullanici kendi avatarini yukler" on storage.objects;
create policy "kullanici kendi avatarini yukler" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "kullanici kendi avatarini gunceller" on storage.objects;
create policy "kullanici kendi avatarini gunceller" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "kullanici kendi avatarini siler" on storage.objects;
create policy "kullanici kendi avatarini siler" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';

-- ============ Dogrulama ============
select to_regclass('public.ogretmen_profilleri') as tablo_ogretmen,
       count(*) filter (where column_name in ('okul','sinif','avatar_url')) as ogrenci_yeni_kolon,
       count(*) filter (where column_name in ('telefon','yakinlik','avatar_url','email_bildirim')) as veli_yeni_kolon
  from information_schema.columns
 where table_schema = 'public'
   and ((table_name = 'ogrenci_profilleri' and column_name in ('okul','sinif','avatar_url'))
     or (table_name = 'veliler' and column_name in ('telefon','yakinlik','avatar_url','email_bildirim')));
