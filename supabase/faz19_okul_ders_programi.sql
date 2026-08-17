-- Faz 19: Öğrenci okul ders programı
-- Haftanın her günü tekrar eden okul dersleri ayrı tabloda tutulur.

create table if not exists public.okul_ders_programlari (
  id           uuid primary key default gen_random_uuid(),
  ogrenci_id   uuid not null references public.ogrenciler(id) on delete cascade,
  gun          smallint not null check (gun between 1 and 7),
  baslangic    time not null,
  bitis        time not null,
  ders_adi     text not null check (char_length(trim(ders_adi)) between 1 and 120),
  created_at   timestamptz not null default now(),
  constraint okul_ders_programlari_saat_check check (bitis > baslangic)
);

create index if not exists okul_ders_programlari_ogrenci_gun_idx
  on public.okul_ders_programlari (ogrenci_id, gun, baslangic);

alter table public.okul_ders_programlari enable row level security;

drop policy if exists "ogrenci kendi okul programini yonetir" on public.okul_ders_programlari;
create policy "ogrenci kendi okul programini yonetir" on public.okul_ders_programlari
  for all using (auth.uid() = ogrenci_id) with check (auth.uid() = ogrenci_id);

drop policy if exists "koc ogrenci okul programini gorur" on public.okul_ders_programlari;
create policy "koc ogrenci okul programini gorur" on public.okul_ders_programlari
  for select using (ogretmen_mi() and public.ogrencim_mi(ogrenci_id));

drop policy if exists "veli ogrenci okul programini gorur" on public.okul_ders_programlari;
create policy "veli ogrenci okul programini gorur" on public.okul_ders_programlari
  for select using (public.velinin_ogrencisi_mi(ogrenci_id));

notify pgrst, 'reload schema';
