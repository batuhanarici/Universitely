-- Universitely Faz D: Koç Araçları & İletişim
--
-- 1) koc_notlari   : koçun öğrencileri hakkında tuttuğu notlar
-- 2) gorusmeler    : öğrenci/veli görüşme takvimi (planlandi/tamamlandi/iptal)
-- 3) odemeler      : koçun öğrenci ödeme takibi
-- 4) koc_velileri  : koçun öğrencilerinin velileri (toplu bildirim + mesajlaşma)
-- 5) mesajlar      : mesajlaşma iliski-scoped yapildi (veli <-> koç, öğrenci <-> koç)
--
-- NOT: Tüm policy'ler faz6 desenini izler: koç yalnizca kendi öğrencisi (ogrencim_mi)
-- ile ilgili satirlari gorur/isler. Dosya idempotenttir (2. calistirmada hata vermez).

-- ============ 1) koc_notlari ============
create table if not exists public.koc_notlari (
  id          uuid primary key default gen_random_uuid(),
  ogrenci_id  uuid not null references public.ogrenciler(id) on delete cascade,
  not_metni   text not null,
  onem        text not null default 'normal',   -- dusuk | normal | yuksek
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists koc_notlari_ogrenci_idx
  on public.koc_notlari (ogrenci_id);

alter table public.koc_notlari enable row level security;

drop policy if exists "koc notlari yonetir" on public.koc_notlari;
create policy "koc notlari yonetir" on public.koc_notlari
  for all using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id))
  with check ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

-- ============ 2) gorusmeler ============
create table if not exists public.gorusmeler (
  id          uuid primary key default gen_random_uuid(),
  ogrenci_id  uuid not null references public.ogrenciler(id) on delete cascade,
  katilimci   text not null default 'ogrenci',  -- ogrenci | veli
  baslik      text not null,
  tarih       timestamptz not null,
  durum       text not null default 'planlandi', -- planlandi | tamamlandi | iptal
  notlar      text,
  created_at  timestamptz not null default now()
);

create index if not exists gorusmeler_ogrenci_tarih_idx
  on public.gorusmeler (ogrenci_id, tarih);

alter table public.gorusmeler enable row level security;

drop policy if exists "koc gorusmeleri yonetir" on public.gorusmeler;
create policy "koc gorusmeleri yonetir" on public.gorusmeler
  for all using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id))
  with check ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

-- ============ 3) odemeler ============
create table if not exists public.odemeler (
  id          uuid primary key default gen_random_uuid(),
  ogrenci_id  uuid not null references public.ogrenciler(id) on delete cascade,
  tutar       numeric(10,2) not null,
  aciklama    text,
  tarih       date not null default current_date,
  odendi      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists odemeler_ogrenci_idx
  on public.odemeler (ogrenci_id);

alter table public.odemeler enable row level security;

drop policy if exists "koc odemeleri yonetir" on public.odemeler;
create policy "koc odemeleri yonetir" on public.odemeler
  for all using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id))
  with check ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen' and public.ogrencim_mi(ogrenci_id));

-- ============ 4) koc_velileri RPC ============
-- Koçun kendi öğrencilerinin velileri (scoped, security definer).
-- Toplu bildirim ve koç -> veli mesajlaşması için alıcı listesi.
create or replace function public.koc_velileri()
returns table (id uuid, ad_soyad text, ogrenci_id uuid, ogrenci_adi text)
language sql security definer stable
set search_path = public
as $fn$
  select v.id, coalesce(v.ad_soyad, 'Veli'), v.ogrenci_id, o.ad_soyad
  from public.veliler v
  join public.ogrenciler o on o.id = v.ogrenci_id
  where o.ogretmen_id = auth.uid()
  order by o.ad_soyad;
$fn$;

revoke all on function public.koc_velileri() from public;
grant execute on function public.koc_velileri() to authenticated;

-- ============ 5) mesajlar: iliski-scoped mesajlaşma ============
-- Eski "her authenticated istediğine yazabilir" policy'si kapatilir; yerine
-- taraflarin gercekten iliskili olmasi aranir:
--   öğrenci -> kendi koçu
--   koç     -> kendi öğrencisi
--   veli    -> çocuğunun koçu
--   koç     -> kendi öğrencisinin velisi
create or replace function public.mesaj_alicisi_uygun(alici_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $fn$
  select exists (
    select 1 from public.ogrenciler o
    where o.id = auth.uid() and o.ogretmen_id = mesaj_alicisi_uygun.alici_id
  ) or exists (
    select 1 from public.ogrenciler o
    where o.id = mesaj_alicisi_uygun.alici_id and o.ogretmen_id = auth.uid()
  ) or exists (
    select 1 from public.veliler v
    join public.ogrenciler o on o.id = v.ogrenci_id
    where v.id = auth.uid() and o.ogretmen_id = mesaj_alicisi_uygun.alici_id
  ) or exists (
    select 1 from public.veliler v
    join public.ogrenciler o on o.id = v.ogrenci_id
    where v.id = mesaj_alicisi_uygun.alici_id and o.ogretmen_id = auth.uid()
  );
$fn$;

revoke all on function public.mesaj_alicisi_uygun(uuid) from public;
grant execute on function public.mesaj_alicisi_uygun(uuid) to authenticated;

drop policy if exists "gonderici mesaj yazar" on public.mesajlar;
drop policy if exists "gonderici iliskili tarafa mesaj yazar" on public.mesajlar;
create policy "gonderici iliskili tarafa mesaj yazar" on public.mesajlar
  for insert with check (auth.uid() = gonderici_id and public.mesaj_alicisi_uygun(alici_id));

-- ============ PostgREST schema cache yenile + dogrulama ============
notify pgrst, 'reload schema';

-- Dogrulama (uc tablo + iki fonksiyon da var olmali)
select to_regclass('public.koc_notlari')  as notlar,
       to_regclass('public.gorusmeler')   as gorusmeler,
       to_regclass('public.odemeler')     as odemeler,
       to_regprocedure('public.koc_velileri()')          as fn_veliler,
       to_regprocedure('public.mesaj_alicisi_uygun(uuid)') as fn_alici;
