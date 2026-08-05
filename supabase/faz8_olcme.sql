-- Universitely Faz C: Ölçme & Analiz
-- Bu dosyayi Supabase > SQL Editor'de calistir. (Idempotent: tekrar calistirilabilir.)
--
-- Icerik:
--   1) sonuclar icin performans indeksleri (toplu giris + sinif analiz)
--   2) (deneme, ogrenci, soru) tekrarini onleyen unique constraint (eski veride tekrar varsa uyari yazar, devam eder)
--   3) toplu_sonuc_gir RPC: koç yalnizca kendi öğrencilerine kaydedebilir (ogrencim_mi);
--      eski kayitlar (tekrar_durumu dahil) temizlenip yeniden yazilir -> tekrar giris güvenli

-- ============ 1) Indeksler ============
create index if not exists sonuclar_deneme_ogrenci_idx
  on public.sonuclar (deneme_id, ogrenci_id);

create index if not exists sonuclar_ogrenci_deneme_idx
  on public.sonuclar (ogrenci_id, deneme_id);

-- ============ 2) Unique constraint (defansif) ============
do $$
begin
  begin
    alter table public.sonuclar
      add constraint sonuclar_deneme_ogrenci_soru_uq unique (deneme_id, ogrenci_id, soru_no);
    raise notice 'unique constraint sonuclar_deneme_ogrenci_soru_uq eklendi';
  exception when others then
    raise notice 'unique constraint eklenemedi (eski veride tekrarlar olabilir): %', SQLERRM;
  end;
end $$;

-- ============ 3) Toplu sonuç girişi ============
-- girdi formati: [{ "ogrenci_id": uuid, "sorular": [{ "soru_no": int, "durum": "dogru|yanlis|bos" }, ...] }, ...]
create or replace function public.toplu_sonuc_gir(deneme_id uuid, girdi jsonb)
returns boolean
language plpgsql security definer
set search_path = public
as $fn$
declare
  ogr record;
  kayit record;
  yeni_sonuc_id uuid;
begin
  for ogr in
    select * from jsonb_to_recordset(girdi) as t(ogrenci_id uuid, sorular jsonb)
  loop
    -- koç yalnizca kendi öğrencisine kaydedebilir
    if not public.ogrencim_mi(ogr.ogrenci_id) then
      continue;
    end if;

    -- eski sonuclari ve tekrar_durumu kayitlarini temizle
    delete from public.tekrar_durumu td
      using public.sonuclar s
      where td.sonuc_id = s.id
        and s.deneme_id = toplu_sonuc_gir.deneme_id
        and s.ogrenci_id = ogr.ogrenci_id;

    delete from public.sonuclar
      where public.sonuclar.deneme_id = toplu_sonuc_gir.deneme_id
        and public.sonuclar.ogrenci_id = ogr.ogrenci_id;

    -- yeni sonuclari yaz
    for kayit in
      select * from jsonb_to_recordset(ogr.sorular) as t(soru_no integer, durum text)
    loop
      insert into public.sonuclar (deneme_id, ogrenci_id, soru_no, durum)
      values (toplu_sonuc_gir.deneme_id, ogr.ogrenci_id, kayit.soru_no, kayit.durum)
      returning id into yeni_sonuc_id;

      if kayit.durum in ('yanlis', 'bos') then
        insert into public.tekrar_durumu (sonuc_id, cozuldu)
        values (yeni_sonuc_id, false);
      end if;
    end loop;
  end loop;

  return true;
end;
$fn$;

revoke all on function public.toplu_sonuc_gir(uuid, jsonb) from public;
grant execute on function public.toplu_sonuc_gir(uuid, jsonb) to authenticated;

-- ============ Dogrulama ============
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'toplu_sonuc_gir';
