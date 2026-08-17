-- Faz 17: Koçluk ders takvimi
-- Mevcut gorusmeler tablosu saatli kayıt omurgası olarak korunur.
-- Ders ve görüşme kayıtları tur alanıyla ayrıştırılır.

alter table public.gorusmeler
  add column if not exists tur text not null default 'gorusme';

drop constraint if exists gorusmeler_tur_check on public.gorusmeler;
alter table public.gorusmeler
  add constraint gorusmeler_tur_check check (tur in ('gorusme', 'ders'));

create index if not exists gorusmeler_tur_tarih_idx
  on public.gorusmeler (tur, tarih);

-- Öğrenci yalnızca kendisine ait koçluk derslerini okuyabilir.
-- Görüşme kayıtları öğrenciye açılmaz; mevcut veli görünürlüğü korunur.
drop policy if exists "ogrenci kendi derslerini gorur" on public.gorusmeler;
create policy "ogrenci kendi derslerini gorur" on public.gorusmeler
  for select
  using (tur = 'ders' and auth.uid() = ogrenci_id);

notify pgrst, 'reload schema';
