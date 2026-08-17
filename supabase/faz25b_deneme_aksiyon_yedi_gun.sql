-- Faz 25b: Deneme aksiyonlarını 1., 3. ve 7. gün adımlarına yay.
create or replace function public.deneme_aksiyon_taslagi_olustur(p_deneme_id uuid, p_ogrenci_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_soru_sayisi integer;
  v_eklenen integer := 0;
  v_deneme_tarihi date;
  v_deneme_adi text;
  v_konu record;
  v_adim integer;
  v_oneri_tarihi date;
  v_detay text;
  v_dayanak text;
  v_aksiyon_turu text;
  v_baslik text;
begin
  if not ogretmen_mi() or not ogrencim_mi(p_ogrenci_id) then
    raise exception 'Bu öğrenci için aksiyon üretme yetkin yok';
  end if;

  select tarih::date, ad into v_deneme_tarihi, v_deneme_adi
  from public.denemeler
  where id = p_deneme_id;
  if v_deneme_tarihi is null then
    raise exception 'Deneme bulunamadı';
  end if;

  delete from public.deneme_aksiyonlari
  where deneme_id = p_deneme_id
    and ogrenci_id = p_ogrenci_id
    and durum in ('taslak', 'reddedildi');

  select count(*) into v_soru_sayisi
  from public.sonuclar
  where deneme_id = p_deneme_id and ogrenci_id = p_ogrenci_id;
  if v_soru_sayisi = 0 then
    return 0;
  end if;

  for v_konu in
    select
      s.konu_id,
      coalesce(k.ad, 'Konu eşleşmesi olmayan sorular') as konu_adi,
      count(*)::integer as toplam,
      count(*) filter (where s.durum = 'dogru')::integer as dogru,
      count(*) filter (where s.durum = 'yanlis')::integer as yanlis,
      count(*) filter (where s.durum = 'bos')::integer as bos,
      exists (
        select 1
        from public.sonuclar onceki
        join public.denemeler onceki_deneme on onceki_deneme.id = onceki.deneme_id
        where onceki.ogrenci_id = p_ogrenci_id
          and onceki.konu_id is not distinct from s.konu_id
          and onceki.durum in ('yanlis', 'bos')
          and onceki_deneme.tarih < (select tarih from public.denemeler where id = p_deneme_id)
      ) as onceki_zorluk
    from public.sonuclar s
    left join public.konular k on k.id = s.konu_id
    where s.deneme_id = p_deneme_id and s.ogrenci_id = p_ogrenci_id
    group by s.konu_id, k.ad
    having count(*) filter (where s.durum in ('yanlis', 'bos')) > 0
    order by (
      count(*) filter (where s.durum in ('yanlis', 'bos')) * 3
      + case when count(*) filter (where s.durum in ('yanlis', 'bos')) >= 3 then 2 else 0 end
      + case when exists (
          select 1 from public.sonuclar onceki
          join public.denemeler onceki_deneme on onceki_deneme.id = onceki.deneme_id
          where onceki.ogrenci_id = p_ogrenci_id
            and onceki.konu_id is not distinct from s.konu_id
            and onceki.durum in ('yanlis', 'bos')
            and onceki_deneme.tarih < (select tarih from public.denemeler where id = p_deneme_id)
        ) then 3 else 0 end
    ) desc
    limit 3
  loop
    for v_adim in 1..3 loop
      v_aksiyon_turu := case when v_adim = 1 then 'gorev' else 'tekrar' end;
      v_oneri_tarihi := v_deneme_tarihi + case v_adim when 1 then 1 when 2 then 3 else 7 end;
      v_baslik := case v_adim
        when 1 then v_konu.konu_adi || ' konu pekiştirme görevi'
        when 2 then v_konu.konu_adi || ' aralıklı tekrar'
        else v_konu.konu_adi || ' mini kontrol tekrarı'
      end;
      v_detay := case v_adim
        when 1 then format('%s İlk adım: konu özetini gözden geçir ve bu konudan en az 15 soru çöz.', v_konu.konu_adi)
        when 2 then format('%s Üçüncü gün kontrolü: önceki yanlış/boş sorularını açıklayarak yeniden çöz.', v_konu.konu_adi)
        else format('%s Yedinci gün kontrolü: kısa bir mini test ile konuyu yeniden ölç; sonucu koçunla paylaş.', v_konu.konu_adi)
      end;
      v_dayanak := format(
        'Deneme %s · %s · %s yanlış/boş · %s · yedi günlük planın %s. adımı',
        coalesce(v_deneme_adi, 'Seçilen deneme'), v_konu.konu_adi, v_konu.yanlis + v_konu.bos,
        case when v_konu.onceki_zorluk then 'önceki denemelerde de benzer zorlanma var' else 'ilk belirgin zorlanma sinyali' end,
        v_adim
      );
      insert into public.deneme_aksiyonlari (
        deneme_id, ogrenci_id, konu_id, aksiyon_turu, baslik, detay, dayanak,
        oncelik, onerilen_tarih, durum
      ) values (
        p_deneme_id, p_ogrenci_id, v_konu.konu_id, v_aksiyon_turu, v_baslik, v_detay, v_dayanak,
        case when v_adim = 1 and (v_konu.onceki_zorluk or v_konu.yanlis + v_konu.bos >= 3) then 'yuksek'
             when v_adim = 3 then 'dusuk' else 'orta' end,
        v_oneri_tarihi, 'taslak'
      );
      v_eklenen := v_eklenen + 1;
    end loop;
  end loop;
  return v_eklenen;
end;
$fn$;

revoke all on function public.deneme_aksiyon_taslagi_olustur(uuid, uuid) from public, anon;
grant execute on function public.deneme_aksiyon_taslagi_olustur(uuid, uuid) to authenticated;
notify pgrst, 'reload schema';
