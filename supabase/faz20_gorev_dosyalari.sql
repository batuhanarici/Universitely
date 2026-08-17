-- Faz 20: Görev kaynak dosyaları ve öğrenci teslimleri

create table if not exists public.gorev_dosyalari (
  id            uuid primary key default gen_random_uuid(),
  gorev_id      uuid not null references public.gorevler(id) on delete cascade,
  ogrenci_id    uuid not null references public.ogrenciler(id) on delete cascade,
  yukleyen_id   uuid not null references auth.users(id) on delete cascade,
  tur           text not null check (tur in ('kaynak', 'teslim')),
  dosya_adi     text not null check (char_length(trim(dosya_adi)) between 1 and 180),
  storage_path  text not null unique,
  mime_type     text,
  boyut         integer check (boyut is null or boyut between 1 and 26214400),
  created_at    timestamptz not null default now()
);

create index if not exists gorev_dosyalari_gorev_idx
  on public.gorev_dosyalari (gorev_id, tur, created_at desc);

alter table public.gorev_dosyalari enable row level security;

drop policy if exists "ilgili ogrenci gorev dosyalarini gorur" on public.gorev_dosyalari;
create policy "ilgili ogrenci gorev dosyalarini gorur" on public.gorev_dosyalari
  for select using (auth.uid() = ogrenci_id);

drop policy if exists "koc ogrenci gorev dosyalarini gorur" on public.gorev_dosyalari;
create policy "koc ogrenci gorev dosyalarini gorur" on public.gorev_dosyalari
  for select using (ogretmen_mi() and public.ogrencim_mi(ogrenci_id));

drop policy if exists "ogrenci kendi teslimini yukler" on public.gorev_dosyalari;
create policy "ogrenci kendi teslimini yukler" on public.gorev_dosyalari
  for insert with check (
    tur = 'teslim'
    and auth.uid() = ogrenci_id
    and auth.uid() = yukleyen_id
  );

drop policy if exists "koc kaynak yukler" on public.gorev_dosyalari;
create policy "koc kaynak yukler" on public.gorev_dosyalari
  for insert with check (
    tur = 'kaynak'
    and ogretmen_mi()
    and public.ogrencim_mi(ogrenci_id)
    and auth.uid() = yukleyen_id
  );

drop policy if exists "ogrenci kendi teslimini siler" on public.gorev_dosyalari;
create policy "ogrenci kendi teslimini siler" on public.gorev_dosyalari
  for delete using (tur = 'teslim' and auth.uid() = yukleyen_id);

drop policy if exists "koc kaynak dosyasini siler" on public.gorev_dosyalari;
create policy "koc kaynak dosyasini siler" on public.gorev_dosyalari
  for delete using (tur = 'kaynak' and ogretmen_mi() and public.ogrencim_mi(ogrenci_id));

-- Kaynak veya teslim eklendiğinde karşı tarafa bildirim düşer.
create or replace function public.gorev_dosyasi_bildirimi_olustur()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  alici uuid;
  baslik text;
  detay text;
  hedef text;
begin
  if new.tur = 'kaynak' then
    alici := new.ogrenci_id;
    baslik := 'Görevine yeni kaynak eklendi';
    detay := new.dosya_adi || ' dosyası koçun tarafından gönderildi.';
    hedef := '/student/tasks';
  else
    alici := public.benim_ogretmen_id();
    baslik := 'Öğrencin görev teslim etti';
    detay := new.dosya_adi || ' dosyası göreve teslim edildi.';
    hedef := '/teacher/tasks';
  end if;

  if alici is not null then
    insert into public.bildirimler
      (alici_id, tur, baslik, detay, gonderici_id, ilgili_id, hedef, kaynak)
    values
      (alici, 'hatirlatma', baslik, detay, new.yukleyen_id, new.gorev_id, hedef, 'gorev-dosyasi:' || new.id::text);
  end if;

  return new;
end;
$fn$;

revoke all on function public.gorev_dosyasi_bildirimi_olustur() from public;
revoke execute on function public.gorev_dosyasi_bildirimi_olustur() from anon, authenticated, service_role;
grant execute on function public.gorev_dosyasi_bildirimi_olustur() to postgres;

drop trigger if exists gorev_dosyasi_bildirimi_trg on public.gorev_dosyalari;
create trigger gorev_dosyasi_bildirimi_trg
after insert on public.gorev_dosyalari
for each row execute function public.gorev_dosyasi_bildirimi_olustur();

-- Private bucket; erişim yalnızca ilgili öğrenci veya koç policy’leriyle sağlanır.
insert into storage.buckets (id, name, public)
values ('gorev-dosyalari', 'gorev-dosyalari', false)
on conflict (id) do update set public = false;

drop policy if exists "gorev dosyalarini ilgili taraflar okur" on storage.objects;
create policy "gorev dosyalarini ilgili taraflar okur" on storage.objects
  for select using (
    bucket_id = 'gorev-dosyalari'
    and (storage.foldername(name))[1] = 'gorevler'
    and exists (
      select 1
      from public.gorevler g
      where g.id::text = (storage.foldername(name))[2]
        and (
          g.ogrenci_id = auth.uid()
          or (public.ogretmen_mi() and public.ogrencim_mi(g.ogrenci_id))
        )
    )
  );

drop policy if exists "koc gorev kaynagi yukler" on storage.objects;
create policy "koc gorev kaynagi yukler" on storage.objects
  for insert with check (
    bucket_id = 'gorev-dosyalari'
    and (storage.foldername(name))[1] = 'gorevler'
    and (storage.foldername(name))[3] = 'kaynak'
    and (storage.foldername(name))[4] = auth.uid()::text
    and exists (
      select 1
      from public.gorevler g
      where g.id::text = (storage.foldername(name))[2]
        and public.ogretmen_mi()
        and public.ogrencim_mi(g.ogrenci_id)
    )
  );

drop policy if exists "ogrenci gorev teslimi yukler" on storage.objects;
create policy "ogrenci gorev teslimi yukler" on storage.objects
  for insert with check (
    bucket_id = 'gorev-dosyalari'
    and (storage.foldername(name))[1] = 'gorevler'
    and (storage.foldername(name))[3] = 'teslim'
    and (storage.foldername(name))[4] = auth.uid()::text
    and exists (
      select 1
      from public.gorevler g
      where g.id::text = (storage.foldername(name))[2]
        and g.ogrenci_id = auth.uid()
    )
  );

drop policy if exists "gorev dosyasini sahibi siler" on storage.objects;
create policy "gorev dosyasini sahibi siler" on storage.objects
  for delete using (
    bucket_id = 'gorev-dosyalari'
    and (storage.foldername(name))[4] = auth.uid()::text
  );

notify pgrst, 'reload schema';
