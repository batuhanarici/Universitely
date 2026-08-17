-- Faz 26: Koç erken uyarı sinyal kapatma kayıtları
create table if not exists public.koc_uyari_kapatmalari (
  id             uuid primary key default gen_random_uuid(),
  ogrenci_id     uuid not null references public.ogrenciler(id) on delete cascade,
  uyari_turu     text not null,
  kaynak_tarihi  date not null,
  kapatan_id     uuid not null references auth.users(id) on delete restrict,
  kapatildi_at   timestamptz not null default now(),
  constraint koc_uyari_kapatma_unique unique (ogrenci_id, uyari_turu, kaynak_tarihi)
);

create index if not exists koc_uyari_kapatmalari_ogrenci_idx
  on public.koc_uyari_kapatmalari (ogrenci_id, kapatildi_at desc);

alter table public.koc_uyari_kapatmalari enable row level security;

drop policy if exists "koc kendi uyarilarini gorur" on public.koc_uyari_kapatmalari;
create policy "koc kendi uyarilarini gorur"
  on public.koc_uyari_kapatmalari
  for select
  using (ogretmen_mi() and ogrencim_mi(ogrenci_id));

drop policy if exists "koc kendi uyarilarini yonetir" on public.koc_uyari_kapatmalari;
create policy "koc kendi uyarilarini yonetir"
  on public.koc_uyari_kapatmalari
  for delete
  using (ogretmen_mi() and ogrencim_mi(ogrenci_id));

create or replace function public.koc_uyariyi_kapat(
  p_ogrenci_id uuid,
  p_uyari_turu text,
  p_kaynak_tarihi date
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not ogretmen_mi() or not ogrencim_mi(p_ogrenci_id) then
    raise exception 'Bu öğrenci için uyarı kapatma yetkin yok';
  end if;

  insert into public.koc_uyari_kapatmalari (ogrenci_id, uyari_turu, kaynak_tarihi, kapatan_id)
  values (p_ogrenci_id, btrim(p_uyari_turu), p_kaynak_tarihi, auth.uid())
  on conflict (ogrenci_id, uyari_turu, kaynak_tarihi)
  do update set kapatan_id = auth.uid(), kapatildi_at = now();

  return true;
end;
$fn$;

revoke all on function public.koc_uyariyi_kapat(uuid, text, date) from public, anon;
grant execute on function public.koc_uyariyi_kapat(uuid, text, date) to authenticated;
notify pgrst, 'reload schema';
