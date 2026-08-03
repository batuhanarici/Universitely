-- Faz 1: Öğrenci Paneli — Profil, Çalışma, Görevler, Konu İlerleme
-- Bu dosyayı Supabase > SQL Editor'da tamalama çalıştır.
-- RLS, mevcut tablolarla aynı desen: sahip = auth.uid(), öğretmen = user_metadata.rol='ogretmen'

-- ============ 1) ogrenci_profilleri ============
create table if not exists public.ogrenci_profilleri (
  ogrenci_id       uuid primary key default auth.uid()
                   references public.ogrenciler(id) on delete cascade,
  hedef_universite text,
  hedef_bolum      text,
  sinav_turu       text not null default 'her_ikisi'
                   check (sinav_turu in ('tyt','ayt','her_ikisi')),
  hedef_net        numeric,
  updated_at       timestamptz not null default now()
);

alter table public.ogrenci_profilleri enable row level security;

create policy "ogrenci kendi profilini yonetir" on public.ogrenci_profilleri
  for all using (auth.uid() = ogrenci_id) with check (auth.uid() = ogrenci_id);

create policy "ogretmen profilleri gorur" on public.ogrenci_profilleri
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen');

-- ============ 2) calisma_kayitlari ============
create table if not exists public.calisma_kayitlari (
  id           uuid primary key default gen_random_uuid(),
  ogrenci_id   uuid not null default auth.uid()
               references public.ogrenciler(id) on delete cascade,
  tarih        date not null default current_date,
  sure_dk      integer not null default 0,
  soru_sayisi  integer,
  konu_id      uuid references public.konular(id) on delete set null,
  "not"        text,
  created_at   timestamptz not null default now()
);

alter table public.calisma_kayitlari enable row level security;

create policy "ogrenci kendi calismalarini yonetir" on public.calisma_kayitlari
  for all using (auth.uid() = ogrenci_id) with check (auth.uid() = ogrenci_id);

create policy "ogretmen calismalari gorur" on public.calisma_kayitlari
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen');

create index if not exists calisma_kayitlari_ogrenci_tarih_idx
  on public.calisma_kayitlari (ogrenci_id, tarih);

-- ============ 3) gorevler ============
create table if not exists public.gorevler (
  id          uuid primary key default gen_random_uuid(),
  ogrenci_id  uuid not null default auth.uid()
              references public.ogrenciler(id) on delete cascade,
  tarih       date not null default current_date,
  baslik      text not null,
  tip         text not null default 'gunluk'
              check (tip in ('gunluk','haftalik','koc')),
  atayan_id   uuid references public.ogrenciler(id) on delete set null,
  tamamlandi  boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.gorevler enable row level security;

create policy "ogrenci kendi gorevlerini yonetir" on public.gorevler
  for all using (auth.uid() = ogrenci_id) with check (auth.uid() = ogrenci_id);

create policy "ogretmen gorev gorur ve atar" on public.gorevler
  for all using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen')
  with check ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen');

create index if not exists gorevler_ogrenci_tarih_idx
  on public.gorevler (ogrenci_id, tarih);

-- ============ 4) konu_ilerlemeleri ============
create table if not exists public.konu_ilerlemeleri (
  id                 uuid primary key default gen_random_uuid(),
  ogrenci_id         uuid not null default auth.uid()
                     references public.ogrenciler(id) on delete cascade,
  konu_id            uuid not null references public.konular(id) on delete cascade,
  tamamlandi         boolean not null default false,
  tamamlanma_tarihi  date,
  created_at         timestamptz not null default now(),
  unique (ogrenci_id, konu_id)
);

alter table public.konu_ilerlemeleri enable row level security;

create policy "ogrenci kendi konu ilerlemesini yonetir" on public.konu_ilerlemeleri
  for all using (auth.uid() = ogrenci_id) with check (auth.uid() = ogrenci_id);

create policy "ogretmen konu ilerlemelerini gorur" on public.konu_ilerlemeleri
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen');

create index if not exists konu_ilerlemeleri_ogrenci_idx
  on public.konu_ilerlemeleri (ogrenci_id);