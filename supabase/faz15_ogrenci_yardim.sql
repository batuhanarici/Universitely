-- Faz 15: Öğrenci paneli tanıtım turu / yardım
alter table ogrenci_profilleri
  add column if not exists tur_gorundu boolean not null default false;
