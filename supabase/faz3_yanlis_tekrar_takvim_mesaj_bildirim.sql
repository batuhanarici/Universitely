-- Faz 3: Öğrenci Paneli — Yanlışlar, Tekrar Planı, Takvim, Mesajlar, Bildirimler
-- Bu dosyayı Supabase > SQL Editor'da tamalama çalıştır.

-- (1) yanlis_arsivi
create table if not exists public.yanlis_arsivi (
  id              uuid primary key default gen_random_uuid(),
  ogrenci_id      uuid not null default auth.uid()
                  references public.ogrenciler(id) on delete cascade,
  konu_id         uuid references public.konular(id) on delete set null,
  kaynak_adi      text,
  sayfa_no        integer,
  soru_no         integer,
  aciklama        text,
  cozuldu         boolean not null default false,
  eklenme_tarihi  date not null default current_date,
  created_at      timestamptz not null default now()
);

alter table public.yanlis_arsivi enable row level security;

create policy "ogrenci kendi yanlis arsivini yonetir" on public.yanlis_arsivi
  for all using (auth.uid() = ogrenci_id) with check (auth.uid() = ogrenci_id);

create policy "ogretmen yanlis arsivini gorur" on public.yanlis_arsivi
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen');

create index if not exists yanlis_arsivi_ogrenci_idx
  on public.yanlis_arsivi (ogrenci_id);

-- (2) tekrar_planlari
create table if not exists public.tekrar_planlari (
  id           uuid primary key default gen_random_uuid(),
  ogrenci_id   uuid not null default auth.uid()
               references public.ogrenciler(id) on delete cascade,
  aciklama     text not null,
  yanlis_id    uuid references public.yanlis_arsivi(id) on delete set null,
  plan_tarihi  date not null default current_date,
  yapildi      boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.tekrar_planlari enable row level security;

create policy "ogrenci kendi tekrar planini yonetir" on public.tekrar_planlari
  for all using (auth.uid() = ogrenci_id) with check (auth.uid() = ogrenci_id);

create policy "ogretmen tekrar planlarini gorur" on public.tekrar_planlari
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen');

create index if not exists tekrar_planlari_ogrenci_tarih_idx
  on public.tekrar_planlari (ogrenci_id, plan_tarihi);

-- (3) mesajlar (öğrenci <-> öğretmen)
create table if not exists public.mesajlar (
  id           uuid primary key default gen_random_uuid(),
  gonderici_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  alici_id     uuid not null references auth.users(id) on delete cascade,
  icerik       text not null,
  tarih        timestamptz not null default now(),
  okundu       boolean not null default false
);

alter table public.mesajlar enable row level security;

create policy "mesaj taraflari gorur" on public.mesajlar
  for select using (auth.uid() = gonderici_id or auth.uid() = alici_id);

create policy "gonderici mesaj yazar" on public.mesajlar
  for insert with check (auth.uid() = gonderici_id);

create policy "alici okundu isaretler" on public.mesajlar
  for update using (auth.uid() = alici_id) with check (auth.uid() = alici_id);

create index if not exists mesajlar_taraflar_idx
  on public.mesajlar (gonderici_id, alici_id);

-- (4) Öğretmen hesabını bulmak için RPC (öğrenci tarafı mesajda alıcıyı bilmesi gerekir)
create or replace function public.ogretmen_hesap_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id::uuid
  from auth.users
  where raw_user_meta_data ->> 'rol' = 'ogretmen'
  order by created_at
  limit 1
$$;

revoke all on function public.ogretmen_hesap_id() from public;
grant execute on function public.ogretmen_hesap_id() to authenticated;