-- Faz 23: Seans notları ve takip maddeleri
-- Koçluk dersinin kapanışını öğrenci davranışına bağlayan ilk koçluk döngüsü adımı.
-- Bu migration mevcut gorusmeler.tur alanını değiştirmez; yalnızca tur = 'ders' kayıtlarına bağlanır.

create table if not exists public.seans_notlari (
  id                uuid primary key default gen_random_uuid(),
  gorusme_id        uuid not null references public.gorusmeler(id) on delete cascade,
  ogrenci_id        uuid not null references public.ogrenciler(id) on delete cascade,
  ozet              text not null,
  guclu_yonler      text,
  gelisim_alanlari  text,
  veli_gorur        boolean not null default false,
  created_by        uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint seans_notlari_gorusme_unique unique (gorusme_id),
  constraint seans_notlari_ozet_bos_degil check (length(btrim(ozet)) > 0)
);

create table if not exists public.takip_maddeleri (
  id             uuid primary key default gen_random_uuid(),
  gorusme_id     uuid not null references public.gorusmeler(id) on delete cascade,
  seans_notu_id  uuid references public.seans_notlari(id) on delete set null,
  ogrenci_id     uuid not null references public.ogrenciler(id) on delete cascade,
  baslik         text not null,
  aciklama       text,
  son_tarih      date not null,
  oncelik        text not null default 'orta' check (oncelik in ('dusuk', 'orta', 'yuksek')),
  durum          text not null default 'bekliyor' check (durum in ('bekliyor', 'devam_ediyor', 'tamamlandi', 'ertelendi')),
  veli_gorur     boolean not null default false,
  gorev_id       uuid references public.gorevler(id) on delete set null,
  created_by     uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint takip_maddeleri_baslik_bos_degil check (length(btrim(baslik)) > 0),
  constraint takip_maddeleri_tarih_gorusme check (gorusme_id is not null)
);

create index if not exists seans_notlari_ogrenci_idx
  on public.seans_notlari (ogrenci_id, updated_at desc);
create index if not exists takip_maddeleri_ogrenci_durum_idx
  on public.takip_maddeleri (ogrenci_id, durum, son_tarih);
create index if not exists takip_maddeleri_gorusme_idx
  on public.takip_maddeleri (gorusme_id, son_tarih);

alter table public.seans_notlari enable row level security;
alter table public.takip_maddeleri enable row level security;

-- Koç, yalnızca kendi öğrencilerinin seans notlarını yönetebilir.
drop policy if exists "koc seans notlarini yonetir" on public.seans_notlari;
create policy "koc seans notlarini yonetir"
  on public.seans_notlari
  for all
  using (ogretmen_mi() and ogrencim_mi(ogrenci_id))
  with check (ogretmen_mi() and ogrencim_mi(ogrenci_id));

-- Öğrenci kendi seans notunu görebilir; veli yalnızca koçun paylaştığı özeti görür.
drop policy if exists "ogrenci kendi seans notunu gorur" on public.seans_notlari;
create policy "ogrenci kendi seans notunu gorur"
  on public.seans_notlari
  for select
  using (auth.uid() = ogrenci_id);

drop policy if exists "veli paylasilan seans notunu gorur" on public.seans_notlari;
create policy "veli paylasilan seans notunu gorur"
  on public.seans_notlari
  for select
  using (veli_gorur and velinin_ogrencisi_mi(ogrenci_id));

-- Takip maddelerini koç yönetir; öğrenci tamamlanma durumunu güvenli RPC ile günceller.
drop policy if exists "koc takip maddelerini yonetir" on public.takip_maddeleri;
create policy "koc takip maddelerini yonetir"
  on public.takip_maddeleri
  for all
  using (ogretmen_mi() and ogrencim_mi(ogrenci_id))
  with check (ogretmen_mi() and ogrencim_mi(ogrenci_id));

drop policy if exists "ogrenci takip maddelerini gorur" on public.takip_maddeleri;
create policy "ogrenci takip maddelerini gorur"
  on public.takip_maddeleri
  for select
  using (auth.uid() = ogrenci_id);

drop policy if exists "veli paylasilan takip maddesini gorur" on public.takip_maddeleri;
create policy "veli paylasilan takip maddesini gorur"
  on public.takip_maddeleri
  for select
  using (veli_gorur and velinin_ogrencisi_mi(ogrenci_id));

-- Öğrencinin takip maddesi durumunu yalnızca kendisi değiştirebilir.
create or replace function public.takip_maddesi_durum_guncelle(p_takip_id uuid, p_durum text)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_guncellendi integer;
begin
  if p_durum not in ('bekliyor', 'devam_ediyor', 'tamamlandi', 'ertelendi') then
    raise exception 'Geçersiz takip maddesi durumu';
  end if;

  update public.takip_maddeleri
  set durum = p_durum,
      updated_at = now()
  where id = p_takip_id
    and (
      auth.uid() = ogrenci_id
      or (ogretmen_mi() and ogrencim_mi(ogrenci_id))
    );

  get diagnostics v_guncellendi = row_count;
  return v_guncellendi = 1;
end;
$fn$;

-- Koç, takip maddesini öğrencinin mevcut görev akışına tekilleştirilmiş olarak dönüştürebilir.
create or replace function public.takip_maddesini_goreve_donustur(p_takip_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_takip public.takip_maddeleri%rowtype;
  v_gorev_id uuid;
  v_baslik text;
begin
  select * into v_takip
  from public.takip_maddeleri
  where id = p_takip_id
    and ogretmen_mi()
    and ogrencim_mi(ogrenci_id)
  for update;

  if not found then
    raise exception 'Takip maddesi bulunamadı veya bu öğrenciye erişim yok';
  end if;

  if v_takip.gorev_id is not null then
    return v_takip.gorev_id;
  end if;

  v_baslik := 'Takip: ' || v_takip.baslik;
  if v_takip.aciklama is not null and length(btrim(v_takip.aciklama)) > 0 then
    v_baslik := v_baslik || ' — ' || left(btrim(v_takip.aciklama), 180);
  end if;

  insert into public.gorevler (ogrenci_id, tarih, baslik, tip)
  values (v_takip.ogrenci_id, v_takip.son_tarih, v_baslik, 'koc')
  returning id into v_gorev_id;

  update public.takip_maddeleri
  set gorev_id = v_gorev_id,
      updated_at = now()
  where id = p_takip_id;

  return v_gorev_id;
end;
$fn$;

revoke all on function public.takip_maddesi_durum_guncelle(uuid, text) from public;
grant execute on function public.takip_maddesi_durum_guncelle(uuid, text) to authenticated;
revoke all on function public.takip_maddesini_goreve_donustur(uuid) from public;
grant execute on function public.takip_maddesini_goreve_donustur(uuid) to authenticated;

-- Yeni takip maddesi öğrencinin uygulama içi bildirimlerine düşer.
create or replace function public.takip_maddesi_bildirimi_olustur()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.bildirimler
    (alici_id, tur, baslik, detay, gonderici_id, ilgili_id, hedef, kaynak)
  values
    (
      new.ogrenci_id,
      'uyari',
      'Yeni takip maddesi',
      new.baslik,
      new.created_by,
      new.id,
      '/student/tasks',
      'takip:' || new.id::text
    );
  return new;
end;
$fn$;

drop trigger if exists takip_maddesi_bildirimi_trg on public.takip_maddeleri;
create trigger takip_maddesi_bildirimi_trg
after insert on public.takip_maddeleri
for each row execute function public.takip_maddesi_bildirimi_olustur();

revoke all on function public.takip_maddesi_bildirimi_olustur() from public;

notify pgrst, 'reload schema';
