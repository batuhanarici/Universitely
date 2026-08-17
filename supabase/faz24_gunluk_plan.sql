-- Faz 24: Günlük akıllı çalışma planı
-- İlk sürüm kural tabanlıdır; planın nedeni ve kaynak kaydı her blokta saklanır.

create table if not exists public.ogrenci_musaitlikleri (
  id          uuid primary key default gen_random_uuid(),
  ogrenci_id  uuid not null references public.ogrenciler(id) on delete cascade,
  gun         smallint not null check (gun between 1 and 7),
  baslangic   time not null default '09:00',
  bitis       time not null default '22:00',
  aktif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint ogrenci_musaitlik_saat_check check (baslangic < bitis),
  constraint ogrenci_musaitlik_unique unique (ogrenci_id, gun)
);

create table if not exists public.calisma_bloklari (
  id                 uuid primary key default gen_random_uuid(),
  ogrenci_id         uuid not null references public.ogrenciler(id) on delete cascade,
  gorev_id           uuid references public.gorevler(id) on delete cascade,
  takip_maddesi_id   uuid references public.takip_maddeleri(id) on delete cascade,
  tekrar_plan_id     uuid references public.tekrar_planlari(id) on delete cascade,
  plan_tarihi        date not null,
  baslangic          time not null,
  bitis              time not null,
  baslik             text not null,
  neden              text not null,
  durum              text not null default 'planlandi' check (durum in ('planlandi', 'tamamlandi', 'ertelendi', 'iptal')),
  kilitli            boolean not null default false,
  erteleme_sayisi    smallint not null default 0 check (erteleme_sayisi >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint calisma_blok_saat_check check (baslangic < bitis),
  constraint calisma_blok_tek_kaynak_check check (num_nonnulls(gorev_id, takip_maddesi_id, tekrar_plan_id) = 1),
  constraint calisma_blok_baslik_bos_degil check (length(btrim(baslik)) > 0)
);

create index if not exists calisma_bloklari_ogrenci_tarih_idx
  on public.calisma_bloklari (ogrenci_id, plan_tarihi, baslangic);
create unique index if not exists calisma_bloklari_gorev_aktif_uq
  on public.calisma_bloklari (ogrenci_id, gorev_id)
  where gorev_id is not null and durum <> 'ertelendi';
create unique index if not exists calisma_bloklari_takip_aktif_uq
  on public.calisma_bloklari (ogrenci_id, takip_maddesi_id)
  where takip_maddesi_id is not null and durum <> 'ertelendi';
create unique index if not exists calisma_bloklari_tekrar_aktif_uq
  on public.calisma_bloklari (ogrenci_id, tekrar_plan_id)
  where tekrar_plan_id is not null and durum <> 'ertelendi';

alter table public.ogrenci_musaitlikleri enable row level security;
alter table public.calisma_bloklari enable row level security;

drop policy if exists "ogrenci kendi musaitligini yonetir" on public.ogrenci_musaitlikleri;
create policy "ogrenci kendi musaitligini yonetir"
  on public.ogrenci_musaitlikleri
  for all
  using (auth.uid() = ogrenci_id)
  with check (auth.uid() = ogrenci_id);

drop policy if exists "koc ogrenci musaitligini gorur" on public.ogrenci_musaitlikleri;
create policy "koc ogrenci musaitligini gorur"
  on public.ogrenci_musaitlikleri
  for select
  using (ogretmen_mi() and ogrencim_mi(ogrenci_id));

drop policy if exists "ogrenci kendi calisma bloklarini gorur" on public.calisma_bloklari;
create policy "ogrenci kendi calisma bloklarini gorur"
  on public.calisma_bloklari
  for select
  using (auth.uid() = ogrenci_id);

drop policy if exists "koc calisma bloklarini yonetir" on public.calisma_bloklari;
create policy "koc calisma bloklarini yonetir"
  on public.calisma_bloklari
  for all
  using (ogretmen_mi() and ogrencim_mi(ogrenci_id))
  with check (ogretmen_mi() and ogrencim_mi(ogrenci_id));

-- Öğrenci plan bloğunu yalnızca kendi görev/takip/tekrar kaydından üretebilir.
create or replace function public.calisma_bloku_ekle(
  p_kaynak_turu text,
  p_kaynak_id uuid,
  p_plan_tarihi date,
  p_baslangic time,
  p_bitis time,
  p_baslik text,
  p_neden text,
  p_kilitli boolean default false
)
returns public.calisma_bloklari
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_ogrenci_id uuid;
  v_blok public.calisma_bloklari%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Oturum gerekli';
  end if;

  if p_kaynak_turu = 'gorev' then
    select ogrenci_id into v_ogrenci_id from public.gorevler where id = p_kaynak_id;
  elsif p_kaynak_turu = 'takip' then
    select ogrenci_id into v_ogrenci_id from public.takip_maddeleri where id = p_kaynak_id;
  elsif p_kaynak_turu = 'tekrar' then
    select ogrenci_id into v_ogrenci_id from public.tekrar_planlari where id = p_kaynak_id;
  else
    raise exception 'Geçersiz plan kaynağı';
  end if;

  if v_ogrenci_id is null or v_ogrenci_id <> auth.uid() then
    raise exception 'Bu plan kaynağına erişim yok';
  end if;

  if p_baslangic >= p_bitis then
    raise exception 'Çalışma bloğu saatleri geçersiz';
  end if;

  if exists (
    select 1 from public.calisma_bloklari
    where ogrenci_id = auth.uid()
      and durum not in ('ertelendi', 'iptal')
      and (p_kaynak_turu <> 'gorev' or gorev_id <> p_kaynak_id)
      and (p_kaynak_turu <> 'takip' or takip_maddesi_id <> p_kaynak_id)
      and (p_kaynak_turu <> 'tekrar' or tekrar_plan_id <> p_kaynak_id)
      and plan_tarihi = p_plan_tarihi
      and baslangic < p_bitis
      and bitis > p_baslangic
  ) then
    raise exception 'Aynı zaman aralığında başka bir çalışma bloğu var';
  end if;

  insert into public.calisma_bloklari (
    ogrenci_id, gorev_id, takip_maddesi_id, tekrar_plan_id,
    plan_tarihi, baslangic, bitis, baslik, neden, kilitli
  ) values (
    auth.uid(),
    case when p_kaynak_turu = 'gorev' then p_kaynak_id end,
    case when p_kaynak_turu = 'takip' then p_kaynak_id end,
    case when p_kaynak_turu = 'tekrar' then p_kaynak_id end,
    p_plan_tarihi, p_baslangic, p_bitis, btrim(p_baslik), btrim(p_neden), p_kilitli
  ) returning * into v_blok;

  return v_blok;
end;
$fn$;

create or replace function public.calisma_bloku_durum_guncelle(
  p_blok_id uuid,
  p_durum text,
  p_yeni_tarih date default null,
  p_yeni_baslangic time default null,
  p_yeni_bitis time default null
)
returns public.calisma_bloklari
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_blok public.calisma_bloklari%rowtype;
  v_yeni public.calisma_bloklari%rowtype;
begin
  if p_durum not in ('planlandi', 'tamamlandi', 'ertelendi', 'iptal') then
    raise exception 'Geçersiz çalışma bloğu durumu';
  end if;

  select * into v_blok
  from public.calisma_bloklari
  where id = p_blok_id
    and (
      auth.uid() = ogrenci_id
      or (ogretmen_mi() and ogrencim_mi(ogrenci_id))
    )
  for update;

  if not found then
    raise exception 'Çalışma bloğu bulunamadı veya erişim yok';
  end if;

  if v_blok.kilitli and p_durum not in ('tamamlandi', 'iptal') then
    raise exception 'Bu blok koçun tarafından kilitlendi';
  end if;

  if p_durum = 'ertelendi' then
    update public.calisma_bloklari
    set durum = 'ertelendi',
        erteleme_sayisi = erteleme_sayisi + 1,
        updated_at = now()
    where id = p_blok_id;

    insert into public.calisma_bloklari (
      ogrenci_id, gorev_id, takip_maddesi_id, tekrar_plan_id,
      plan_tarihi, baslangic, bitis, baslik, neden, kilitli, erteleme_sayisi
    ) values (
      v_blok.ogrenci_id, v_blok.gorev_id, v_blok.takip_maddesi_id, v_blok.tekrar_plan_id,
      coalesce(p_yeni_tarih, v_blok.plan_tarihi + 1),
      coalesce(p_yeni_baslangic, v_blok.baslangic),
      coalesce(p_yeni_bitis, v_blok.bitis),
      v_blok.baslik,
      'Önceki blok ertelendi; bu zaman yeni öneri olarak oluşturuldu.',
      v_blok.kilitli,
      v_blok.erteleme_sayisi + 1
    ) returning * into v_yeni;
    return v_yeni;
  end if;

  update public.calisma_bloklari
  set durum = p_durum,
      plan_tarihi = coalesce(p_yeni_tarih, plan_tarihi),
      baslangic = coalesce(p_yeni_baslangic, baslangic),
      bitis = coalesce(p_yeni_bitis, bitis),
      updated_at = now()
  where id = p_blok_id
  returning * into v_yeni;

  return v_yeni;
end;
$fn$;

create or replace function public.calisma_bloku_kilitle(p_blok_id uuid, p_kilitli boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_sayi integer;
begin
  update public.calisma_bloklari
  set kilitli = p_kilitli, updated_at = now()
  where id = p_blok_id
    and ogretmen_mi()
    and ogrencim_mi(ogrenci_id);
  get diagnostics v_sayi = row_count;
  return v_sayi = 1;
end;
$fn$;

revoke all on function public.calisma_bloku_ekle(text, uuid, date, time, time, text, text, boolean) from public, anon;
grant execute on function public.calisma_bloku_ekle(text, uuid, date, time, time, text, text, boolean) to authenticated;
revoke all on function public.calisma_bloku_durum_guncelle(uuid, text, date, time, time) from public, anon;
grant execute on function public.calisma_bloku_durum_guncelle(uuid, text, date, time, time) to authenticated;
revoke all on function public.calisma_bloku_kilitle(uuid, boolean) from public, anon;
grant execute on function public.calisma_bloku_kilitle(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
