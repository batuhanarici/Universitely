-- Faz 22: Minimum admin ve operasyon altyapısı

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.hesap_durumlari (
  user_id uuid primary key references auth.users(id) on delete cascade,
  durum text not null default 'aktif' check (durum in ('aktif', 'askida')),
  neden text,
  degistiren_id uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.sikayetler (
  id uuid primary key default gen_random_uuid(),
  bildiren_id uuid not null references auth.users(id) on delete cascade,
  kategori text not null default 'diger' check (kategori in ('teknik', 'koc', 'ogrenci', 'icerik', 'diger')),
  baslik text not null,
  aciklama text not null,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'inceleniyor', 'cozuldu', 'reddedildi')),
  admin_notu text,
  cozen_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id),
  eylem text not null,
  hedef_id uuid,
  detay jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sikayetler_durum_created_idx on public.sikayetler (durum, created_at desc);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_users enable row level security;
alter table public.hesap_durumlari enable row level security;
alter table public.sikayetler enable row level security;
alter table public.admin_audit_log enable row level security;

create or replace function public.admin_mi()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.admin_mi() from public;
revoke execute on function public.admin_mi() from anon, service_role;
grant execute on function public.admin_mi() to authenticated;

drop policy if exists "admin kendi kaydini gorur" on public.admin_users;
create policy "admin kendi kaydini gorur" on public.admin_users
  for select using (user_id = auth.uid());

drop policy if exists "kullanici kendi hesap durumunu gorur" on public.hesap_durumlari;
create policy "kullanici kendi hesap durumunu gorur" on public.hesap_durumlari
  for select using (user_id = auth.uid() or public.admin_mi());

drop policy if exists "kullanici kendi sikayetini acar" on public.sikayetler;
create policy "kullanici kendi sikayetini acar" on public.sikayetler
  for insert with check (bildiren_id = auth.uid());

drop policy if exists "kullanici kendi sikayetlerini gorur" on public.sikayetler;
create policy "kullanici kendi sikayetlerini gorur" on public.sikayetler
  for select using (bildiren_id = auth.uid() or public.admin_mi());

drop policy if exists "admin sikayetleri gunceller" on public.sikayetler;
create policy "admin sikayetleri gunceller" on public.sikayetler
  for update using (public.admin_mi()) with check (public.admin_mi());

drop policy if exists "admin denetim kayitlarini gorur" on public.admin_audit_log;
create policy "admin denetim kayitlarini gorur" on public.admin_audit_log
  for select using (public.admin_mi());

create or replace function public.admin_sikayet_guncelle(
  p_sikayet_id uuid,
  p_durum text,
  p_admin_notu text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_mi() then
    raise exception 'Bu işlem için admin yetkisi gerekir';
  end if;
  if p_durum not in ('bekliyor', 'inceleniyor', 'cozuldu', 'reddedildi') then
    raise exception 'Geçersiz şikayet durumu';
  end if;
  update public.sikayetler
    set durum = p_durum,
        admin_notu = p_admin_notu,
        cozen_id = auth.uid(),
        updated_at = now()
  where id = p_sikayet_id;
  return found;
end;
$$;

revoke all on function public.admin_sikayet_guncelle(uuid, text, text) from public;
revoke execute on function public.admin_sikayet_guncelle(uuid, text, text) from anon, service_role;
grant execute on function public.admin_sikayet_guncelle(uuid, text, text) to authenticated;

create or replace function public.admin_istatistik()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.admin_mi() then
    raise exception 'Bu işlem için admin yetkisi gerekir';
  end if;
  return jsonb_build_object(
    'toplamKullanici', (select count(*) from auth.users),
    'toplamOgrenci', (select count(*) from public.ogrenciler),
    'aktifOgrenci', (select count(*) from public.ogrenciler where aktif),
    'toplamKoc', (select count(*) from auth.users where raw_user_meta_data->>'rol' = 'ogretmen'),
    'toplamGorev', (select count(*) from public.gorevler),
    'bekleyenSikayet', (select count(*) from public.sikayetler where durum = 'bekliyor'),
    'askidakiHesap', (select count(*) from public.hesap_durumlari where durum = 'askida'),
    'son30GunKayit', (select count(*) from auth.users where created_at >= now() - interval '30 days')
  );
end;
$$;

revoke all on function public.admin_istatistik() from public;
revoke execute on function public.admin_istatistik() from anon, service_role;
grant execute on function public.admin_istatistik() to authenticated;

create or replace function public.admin_kullanicilari()
returns table (
  id uuid,
  email text,
  rol text,
  hesap_durumu text,
  hesap_nedeni text,
  ad_soyad text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.admin_mi() then
    raise exception 'Bu işlem için admin yetkisi gerekir';
  end if;
  return query
    select
      u.id,
      u.email::text,
      case
        when au.user_id is not null then 'admin'
        when nullif(u.raw_user_meta_data->>'rol', '') is not null then u.raw_user_meta_data->>'rol'
        when o.id is not null then 'ogrenci'
        when v.id is not null then 'veli'
        else 'koc'
      end::text,
      coalesce(h.durum, 'aktif')::text,
      h.neden,
      coalesce(o.ad_soyad, op.ad_soyad, u.raw_user_meta_data->>'ad_soyad')::text,
      u.created_at
    from auth.users u
    left join public.ogrenciler o on o.id = u.id
    left join public.veliler v on v.id = u.id
    left join public.ogretmen_profilleri op on op.ogretmen_id = u.id
    left join public.admin_users au on au.user_id = u.id
    left join public.hesap_durumlari h on h.user_id = u.id
    order by u.created_at desc;
end;
$$;

revoke all on function public.admin_kullanicilari() from public;
revoke execute on function public.admin_kullanicilari() from anon, service_role;
grant execute on function public.admin_kullanicilari() to authenticated;

create or replace function public.admin_hesap_durum_guncelle(
  p_user_id uuid,
  p_durum text,
  p_neden text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_mi() then
    raise exception 'Bu işlem için admin yetkisi gerekir';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Kendi admin hesabın askıya alınamaz';
  end if;
  if p_durum not in ('aktif', 'askida') then
    raise exception 'Geçersiz hesap durumu';
  end if;
  insert into public.hesap_durumlari (user_id, durum, neden, degistiren_id, updated_at)
    values (p_user_id, p_durum, nullif(trim(p_neden), ''), auth.uid(), now())
  on conflict (user_id) do update set
    durum = excluded.durum,
    neden = excluded.neden,
    degistiren_id = excluded.degistiren_id,
    updated_at = now();
  insert into public.admin_audit_log (admin_id, eylem, hedef_id, detay)
    values (auth.uid(), case when p_durum = 'askida' then 'hesap_askiya_alindi' else 'hesap_aktif_edildi' end, p_user_id, jsonb_build_object('neden', p_neden));
  return true;
end;
$$;

revoke all on function public.admin_hesap_durum_guncelle(uuid, text, text) from public;
revoke execute on function public.admin_hesap_durum_guncelle(uuid, text, text) from anon, service_role;
grant execute on function public.admin_hesap_durum_guncelle(uuid, text, text) to authenticated;

create or replace function public.admin_sikayetleri()
returns table (
  id uuid,
  bildiren_id uuid,
  bildiren_email text,
  kategori text,
  baslik text,
  aciklama text,
  durum text,
  admin_notu text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.admin_mi() then
    raise exception 'Bu işlem için admin yetkisi gerekir';
  end if;
  return query
    select s.id, s.bildiren_id, u.email::text, s.kategori, s.baslik, s.aciklama, s.durum, s.admin_notu, s.created_at, s.updated_at
    from public.sikayetler s
    left join auth.users u on u.id = s.bildiren_id
    order by s.created_at desc;
end;
$$;

revoke all on function public.admin_sikayetleri() from public;
revoke execute on function public.admin_sikayetleri() from anon, service_role;
grant execute on function public.admin_sikayetleri() to authenticated;

-- Proje sahibinin admin başlangıç kaydı; kullanıcı yoksa sessizce hiçbir satır eklenmez.
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('batuhan07arc@gmail.com')
on conflict (user_id) do nothing;

notify pgrst, 'reload schema';
