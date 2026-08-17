-- Faz 21: Üniversite ve bölüm hedefleri

create table if not exists public.ogrenci_hedefleri (
  id             uuid primary key default gen_random_uuid(),
  ogrenci_id     uuid not null references public.ogrenciler(id) on delete cascade,
  tur            text not null check (tur in ('lisans', 'onlisans')),
  universite_kodu text not null,
  universite_adi  text not null,
  program_kodu    text not null,
  program_adi    text not null,
  program_url    text,
  created_at     timestamptz not null default now(),
  unique (ogrenci_id, tur, program_kodu)
);

create index if not exists ogrenci_hedefleri_ogrenci_idx
  on public.ogrenci_hedefleri (ogrenci_id, created_at desc);

alter table public.ogrenci_hedefleri enable row level security;

drop policy if exists "ogrenci kendi hedeflerini yonetir" on public.ogrenci_hedefleri;
create policy "ogrenci kendi hedeflerini yonetir" on public.ogrenci_hedefleri
  for all using (auth.uid() = ogrenci_id) with check (auth.uid() = ogrenci_id);

drop policy if exists "koc ogrenci hedeflerini gorur" on public.ogrenci_hedefleri;
create policy "koc ogrenci hedeflerini gorur" on public.ogrenci_hedefleri
  for select using (public.ogretmen_mi() and public.ogrencim_mi(ogrenci_id));

drop policy if exists "veli ogrenci hedeflerini gorur" on public.ogrenci_hedefleri;
create policy "veli ogrenci hedeflerini gorur" on public.ogrenci_hedefleri
  for select using (public.velinin_ogrencisi_mi(ogrenci_id));

notify pgrst, 'reload schema';
