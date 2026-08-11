-- Faz 14: Koç paneli tanıtım turu / yardım
-- Koçun tanıtım turunu görüp görmediğini takip eden kolon.
-- Var olan tüm koçlar için default false ile başlar — herkes bir kez turu görecek.

alter table ogretmen_profilleri
  add column if not exists tur_gorundu boolean not null default false;
