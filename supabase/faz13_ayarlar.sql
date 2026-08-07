-- Faz 13: Ayarlar — Hesap silme talepleri + bildirim 'talep' türü
-- Kullanim: Supabase > SQL Editor > New query > yapistir > RUN

-- (1) bildirimler.tur kısıtına 'talep' ekle
do $$
declare
  c text;
begin
  select conname into c
    from pg_constraint
    where conrelid = 'public.bildirimler'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%hatirlatma%';
  if c is not null then
    execute format('alter table public.bildirimler drop constraint %I', c);
  end if;
end $$;

alter table public.bildirimler
  add constraint bildirimler_tur_check
  check (tur in ('mesaj','hatirlatma','uyari','toplu','talep'));

-- (2) hesap_silme_talepleri
create table if not exists public.hesap_silme_talepleri (
  id            uuid primary key default gen_random_uuid(),
  kullanici_id  uuid not null references auth.users(id) on delete cascade,
  durum         text not null default 'bekliyor'
                check (durum in ('bekliyor','onaylandi','reddedildi')),
  onaylayan_id  uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists hesap_silme_talepleri_kullanici_idx
  on public.hesap_silme_talepleri (kullanici_id, durum);

alter table public.hesap_silme_talepleri enable row level security;

drop policy if exists "ogrenci kendi silme talebini yonetir" on public.hesap_silme_talepleri;
create policy "ogrenci kendi silme talebini yonetir" on public.hesap_silme_talepleri
  for select using (auth.uid() = kullanici_id);

drop policy if exists "ogrenci kendi silme talebini olusturur" on public.hesap_silme_talepleri;
create policy "ogrenci kendi silme talebini olusturur" on public.hesap_silme_talepleri
  for insert with check (auth.uid() = kullanici_id);

drop policy if exists "koc ogrencisinin taleplerini gorur" on public.hesap_silme_talepleri;
create policy "koc ogrencisinin taleplerini gorur" on public.hesap_silme_talepleri
  for select using (public.ogrencim_mi(kullanici_id));

-- (3) Öğrenci talep oluşturur + koça bildirim gider
create or replace function public.talep_olustur()
returns uuid
language plpgsql security definer
set search_path = public
as $fn$
declare
  uid uuid := auth.uid();
  koc uuid;
  talep_id uuid;
begin
  if uid is null then
    return null;
  end if;

  select ogretmen_id into koc from public.ogrenciler where id = uid;
  if koc is null then
    return null;
  end if;

  select id into talep_id
    from public.hesap_silme_talepleri
    where kullanici_id = uid and durum = 'bekliyor'
    limit 1;
  if talep_id is not null then
    return talep_id;
  end if;

  insert into public.hesap_silme_talepleri (kullanici_id, durum)
  values (uid, 'bekliyor')
  returning id into talep_id;

  insert into public.bildirimler
    (alici_id, tur, baslik, detay, gonderici_id, ilgili_id, hedef)
  values
    (koc, 'talep', 'Hesap silme onayı bekliyor',
     'Öğrencin hesabının silinmesini istedi. Öğrenci Detay sayfasından karar verebilirsin.',
     uid, talep_id, 'ogrenciler');

  return talep_id;
end;
$fn$;

revoke all on function public.talep_olustur() from public;
grant execute on function public.talep_olustur() to authenticated;

-- (4) Koç karar verir (onay/reddet). Onay sonrası silme, hesap-sil edge function'ıyla yapılır.
create or replace function public.talep_karar(talep_id uuid, onay boolean)
returns boolean
language plpgsql security definer
set search_path = public
as $fn$
declare
  ogr uuid;
begin
  select kullanici_id into ogr
    from public.hesap_silme_talepleri
    where id = talep_karar.talep_id and durum = 'bekliyor';
  if ogr is null then
    return false;
  end if;

  if not exists (
    select 1 from public.ogrenciler
    where id = ogr and ogretmen_id = auth.uid()
  ) then
    return false;
  end if;

  update public.hesap_silme_talepleri
    set durum = case when talep_karar.onay then 'onaylandi' else 'reddedildi' end,
        onaylayan_id = auth.uid(),
        updated_at = now()
    where id = talep_karar.talep_id;

  if not talep_karar.onay then
    insert into public.bildirimler
      (alici_id, tur, baslik, detay, gonderici_id, ilgili_id, hedef)
    values
      (ogr, 'uyari', 'Hesap silme talebin reddedildi',
       'Koçun hesap silme talebini reddetti.',
       auth.uid(), talep_karar.talep_id, '/student/dashboard');
  end if;

  return true;
end;
$fn$;

revoke all on function public.talep_karar(uuid, boolean) from public;
grant execute on function public.talep_karar(uuid, boolean) to authenticated;
