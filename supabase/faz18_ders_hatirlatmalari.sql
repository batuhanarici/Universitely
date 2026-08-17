-- Faz 18: Ders hatırlatmaları
-- Her dakika çalışan pg_cron işi, yaklaşan koçluk dersleri için
-- uygulama içi bildirim üretir. Aynı ders için kaynak anahtarıyla tek kayıt tutulur.

create extension if not exists pg_cron;

create or replace function public.ders_hatirlatmalarini_olustur()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  eklenen integer;
begin
  insert into public.bildirimler
    (alici_id, tur, baslik, detay, ilgili_id, hedef, kaynak)
  select
    g.ogrenci_id,
    'hatirlatma',
    'Yaklaşan dersin var',
    to_char(g.tarih at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') ||
      ' tarihinde ' || g.baslik || ' dersi başlıyor.',
    g.id,
    '/student/calendar',
    'ders-hatirlatma:' || g.id::text
  from public.gorusmeler g
  where g.tur = 'ders'
    and g.durum = 'planlandi'
    and g.tarih >= now() + interval '55 minutes'
    and g.tarih < now() + interval '65 minutes'
    and not exists (
      select 1
      from public.bildirimler b
      where b.kaynak = 'ders-hatirlatma:' || g.id::text
      limit 1
    );

  get diagnostics eklenen = row_count;
  return eklenen;
end;
$fn$;

revoke all on function public.ders_hatirlatmalarini_olustur() from public;
revoke execute on function public.ders_hatirlatmalarini_olustur() from anon, authenticated, service_role;
grant execute on function public.ders_hatirlatmalarini_olustur() to postgres;

do $job$
declare
  mevcut_job_id bigint;
begin
  select jobid into mevcut_job_id
  from cron.job
  where jobname = 'universitely-ders-hatirlatmalari'
  limit 1;

  if mevcut_job_id is not null then
    perform cron.unschedule(mevcut_job_id);
  end if;

  perform cron.schedule(
    'universitely-ders-hatirlatmalari',
    '* * * * *',
    $$select public.ders_hatirlatmalarini_olustur();$$
  );
end
$job$;


-- Ders iptal edilir veya zamanı/başlığı değişirse eski hatırlatma kaydı geçersizdir.
create or replace function public.ders_hatirlatma_kaydi_guncellendi()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if old.tur = 'ders'
     and (new.tur <> 'ders' or new.durum <> 'planlandi' or new.tarih <> old.tarih or new.baslik <> old.baslik) then
    delete from public.bildirimler
    where kaynak = 'ders-hatirlatma:' || old.id::text;
  end if;
  return new;
end;
$fn$;

revoke all on function public.ders_hatirlatma_kaydi_guncellendi() from public;
revoke execute on function public.ders_hatirlatma_kaydi_guncellendi() from anon, authenticated, service_role;
grant execute on function public.ders_hatirlatma_kaydi_guncellendi() to postgres;

drop trigger if exists ders_hatirlatma_kaydi_guncellendi_trg on public.gorusmeler;
create trigger ders_hatirlatma_kaydi_guncellendi_trg
after update of tur, tarih, durum, baslik on public.gorusmeler
for each row
when (old.tur = 'ders' or new.tur = 'ders')
execute function public.ders_hatirlatma_kaydi_guncellendi();
