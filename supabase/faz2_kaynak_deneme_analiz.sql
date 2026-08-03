-- Faz 2: Öğrenci Paneli — Kaynaklar, Deneme Türü, Analiz
-- Bu dosyayı Supabase > SQL Editor'da tamalama çalıştır.

-- (1) denemeler.tur kolonu (TYT / AYT / Branş)
alter table public.denemeler
  add column if not exists tur text default 'brans'
  check (tur in ('tyt','ayt','brans'));

-- (2) kitaplar
create table if not exists public.kitaplar (
  id               uuid primary key default gen_random_uuid(),
  ogrenci_id       uuid not null default auth.uid()
                   references public.ogrenciler(id) on delete cascade,
  ad               text not null,
  kaynak_turu      text not null default 'kitap'
                   check (kaynak_turu in ('kitap','soru_bankasi','deneme','video')),
  toplam           integer not null default 0,   -- toplam sayfa/soru
  ilerleme         integer not null default 0,   -- bitirilen sayfa/soru
  baslangic_tarihi date,
  bitis_hedefi     date,
  created_at       timestamptz not null default now()
);

alter table public.kitaplar enable row level security;

create policy "ogrenci kendi kaynaklarini yonetir" on public.kitaplar
  for all using (auth.uid() = ogrenci_id) with check (auth.uid() = ogrenci_id);

create policy "ogretmen kaynaklari gorur" on public.kitaplar
  for select using ((auth.jwt() -> 'user_metadata' ->> 'rol') = 'ogretmen');

create index if not exists kitaplar_ogrenci_idx
  on public.kitaplar (ogrenci_id);