-- Faz 12: Bildirim Merkezi
-- 1) mesajlar'a etiket (tur) kolonu
-- 2) bildirimler tablosu (okundu / arsiv / sil)
-- 3) mesaj insert → bildirim üreten trigger
-- 4) realtime yayını
-- Kullanim: Supabase > SQL Editor > New query > yapistir > RUN

-- (1) mesajlar: etiket kolonu
alter table public.mesajlar
  add column if not exists tur text not null default 'normal'
  check (tur in ('normal','hatirlatma','uyari','toplu'));

-- (2) bildirimler
create table if not exists public.bildirimler (
  id             uuid primary key default gen_random_uuid(),
  alici_id       uuid not null references auth.users(id) on delete cascade,
  tur            text not null default 'mesaj'
                 check (tur in ('mesaj','hatirlatma','uyari','toplu')),
  baslik         text not null,
  detay          text,
  gonderici_id   uuid references auth.users(id) on delete cascade,
  gonderici_adi  text,
  ilgili_id      uuid,
  hedef          text,
  okundu         boolean not null default false,
  arsivlendi     boolean not null default false,
  kaynak         text,
  created_at     timestamptz not null default now()
);

alter table public.bildirimler enable row level security;

create index if not exists bildirimler_alici_idx
  on public.bildirimler (alici_id, okundu, arsivlendi, created_at desc);

-- Alıcı kendi bildirimlerini tam yönetir (silme = bildirimi kaldırır, mesaj korunur)
drop policy if exists "alici bildirimlerini yonetir" on public.bildirimler;
create policy "alici bildirimlerini yonetir" on public.bildirimler
  for all using (auth.uid() = alici_id) with check (auth.uid() = alici_id);

-- (3) mesaj insert → bildirim
create or replace function public.mesaj_bildirimi_olustur()
returns trigger
language plpgsql security definer
set search_path = public
as $fn$
declare
  alici_rol      text;
  gonderici_rol  text;
  b              text;
  g              text;
  hedef_path     text;
begin
  select (raw_user_meta_data ->> 'rol') into alici_rol from auth.users where id = new.alici_id;
  select (raw_user_meta_data ->> 'rol') into gonderici_rol from auth.users where id = new.gonderici_id;

  if new.tur = 'toplu' then
    b := 'Toplu duyuru';
  elsif new.tur = 'uyari' then
    b := 'Uyarı mesajı';
  elsif new.tur = 'hatirlatma' then
    b := 'Hatırlatma mesajı';
  elsif gonderici_rol = 'ogretmen' then
    b := 'Koçundan yeni mesaj';
  elsif gonderici_rol = 'veli' then
    b := 'Veliden yeni mesaj';
  else
    b := 'Öğrencinden yeni mesaj';
  end if;

  select (raw_user_meta_data ->> 'ad_soyad') into g from auth.users where id = new.gonderici_id;

  if alici_rol = 'ogretmen' then
    hedef_path := 'mesajlar';
  elsif alici_rol = 'veli' then
    hedef_path := '/parent/message';
  else
    hedef_path := '/student/messages';
  end if;

  insert into public.bildirimler
    (alici_id, tur, baslik, detay, gonderici_id, gonderici_adi, ilgili_id, hedef)
  values
    (new.alici_id, new.tur, b, new.icerik, new.gonderici_id, g, new.id, hedef_path);

  return new;
end;
$fn$;

drop trigger if exists mesaj_bildirimi_olustur_trg on public.mesajlar;
create trigger mesaj_bildirimi_olustur_trg
  after insert on public.mesajlar
  for each row execute function public.mesaj_bildirimi_olustur();

revoke all on function public.mesaj_bildirimi_olustur() from public;

-- (4) realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bildirimler'
  ) then
    begin
      alter publication supabase_realtime add table public.bildirimler;
    exception when others then
      raise notice 'supabase_realtime yayini guncellenemedi (onemsiz)';
    end;
  end if;
end $$;
