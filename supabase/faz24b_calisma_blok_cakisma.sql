-- Faz 24b: Yeni blok ve süre değişikliklerinde çakışmayı veritabanı seviyesinde engelle.
create or replace function public.calisma_bloku_cakisma_kontrol()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.durum not in ('ertelendi', 'iptal') and exists (
    select 1
    from public.calisma_bloklari mevcut
    where mevcut.ogrenci_id = new.ogrenci_id
      and mevcut.id <> new.id
      and mevcut.plan_tarihi = new.plan_tarihi
      and mevcut.durum not in ('ertelendi', 'iptal')
      and new.baslangic < mevcut.bitis
      and new.bitis > mevcut.baslangic
  ) then
    raise exception 'Aynı öğrenci için çalışma blokları çakışamaz';
  end if;
  return new;
end;
$fn$;

drop trigger if exists calisma_bloku_cakisma_kontrol_trg on public.calisma_bloklari;
create trigger calisma_bloku_cakisma_kontrol_trg
before insert or update of plan_tarihi, baslangic, bitis, durum on public.calisma_bloklari
for each row execute function public.calisma_bloku_cakisma_kontrol();

revoke all on function public.calisma_bloku_cakisma_kontrol() from public, anon, authenticated;
