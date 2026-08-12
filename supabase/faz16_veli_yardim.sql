-- Faz 16: Veli paneli tanıtım turu / yardım
alter table veliler
  add column if not exists tur_gorundu boolean not null default false;
