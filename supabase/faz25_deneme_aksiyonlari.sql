-- Faz 25: Deneme sonrası 7 günlük açıklanabilir aksiyon motoru

create table if not exists public.deneme_aksiyonlari (
  id                uuid primary key default gen_random_uuid(),
  deneme_id         uuid not null references public.denemeler(id) on delete cascade,
  ogrenci_id        uuid not null references public.ogrenciler(id) on delete cascade,
  konu_id           uuid references public.konular(id) on delete set null,
  aksiyon_turu      text not null check (aksiyon_turu in ('gorev', 'tekrar')),
  baslik            text not null,
  detay             text not null,
  dayanak           text not null,
  oncelik           text not null default 'orta' check (oncelik in ('yuksek', 'orta', 'dusuk')),
  onerilen_tarih    date not null,
  durum             text not null default 'taslak' check (durum in ('taslak', 'onaylandi', 'reddedildi', 'uygulandi', 'tamamlandi')),
  gorev_id          uuid references public.gorevler(id) on delete set null,
  tekrar_plan_id    uuid references public.tekrar_planlari(id) on delete set null,
  onaylayan_id      uuid references auth.users(id) on delete set null,
  onay_notu         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint deneme_aksiyonu_baslik_bos_degil check (length(btrim(baslik)) > 0),
  constraint deneme_aksiyonu_dayanak_bos_degil check (length(btrim(dayanak)) > 0)
);

create index if not exists deneme_aksiyonlari_ogrenci_durum_idx
  on public.deneme_aksiyonlari (ogrenci_id, durum, onerilen_tarih);
create index if not exists deneme_aksiyonlari_deneme_idx
  on public.deneme_aksiyonlari (deneme_id, ogrenci_id, created_at desc);

alter table public.deneme_aksiyonlari enable row level security;

-- Koç tüm taslakları görür, onaylar veya reddeder; yalnızca kendi öğrencileri kapsamındadır.
drop policy if exists "koc deneme aksiyonlarini yonetir" on public.deneme_aksiyonlari;
create policy "koc deneme aksiyonlarini yonetir"
  on public.deneme_aksiyonlari
  for all
  using (ogretmen_mi() and ogrencim_mi(ogrenci_id))
  with check (ogretmen_mi() and ogrencim_mi(ogrenci_id));

-- Öğrenci yalnızca koçun onayladığı/uyguladığı aksiyonları görür.
drop policy if exists "ogrenci onayli deneme aksiyonunu gorur" on public.deneme_aksiyonlari;
create policy "ogrenci onayli deneme aksiyonunu gorur"
  on public.deneme_aksiyonlari
  for select
  using (auth.uid() = ogrenci_id and durum in ('onaylandi', 'uygulandi', 'tamamlandi'));

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
  where deneme_id = p_deneme_id and ogrenci_id = p_ogrenci_id and durum = 'taslak';

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
    where s.deneme_id = p_deneme_id
      and s.ogrenci_id = p_ogrenci_id
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
    v_detay := format(
      '%s konusunda %s soruda %s doğru, %s yanlış ve %s boş yaptın. Doğru oranı %%s.',
      v_konu.konu_adi, v_konu.toplam, v_konu.dogru, v_konu.yanlis, v_konu.bos,
      to_char(round((v_konu.dogru::numeric / greatest(v_konu.toplam, 1)) * 100, 1), 'FM999990D0')
    );
    v_dayanak := format(
      'Deneme %s · %s · %s yanlış/boş · %s',
      coalesce(v_deneme_adi, 'Seçilen deneme'), v_konu.konu_adi,
      v_konu.yanlis + v_konu.bos,
      case when v_konu.onceki_zorluk then 'önceki denemelerde de benzer zorlanma var' else 'ilk belirgin zorlanma sinyali' end
    );
    v_oneri_tarihi := v_deneme_tarihi + 1;
    v_aksiyon_turu := case when v_konu.yanlis + v_konu.bos >= 2 then 'tekrar' else 'gorev' end;
    v_baslik := case when v_aksiyon_turu = 'tekrar'
      then v_konu.konu_adi || ' yanlış/boş analizi'
      else v_konu.konu_adi || ' konu pekiştirme görevi' end;

    insert into public.deneme_aksiyonlari (
      deneme_id, ogrenci_id, konu_id, aksiyon_turu, baslik, detay, dayanak,
      oncelik, onerilen_tarih, durum
    ) values (
      p_deneme_id, p_ogrenci_id, v_konu.konu_id, v_aksiyon_turu, v_baslik, v_detay, v_dayanak,
      case when v_konu.onceki_zorluk or v_konu.yanlis + v_konu.bos >= 3 then 'yuksek' else 'orta' end,
      v_oneri_tarihi, 'taslak'
    );
    v_eklenen := v_eklenen + 1;
  end loop;

  return v_eklenen;
end;
$fn$;

create or replace function public.deneme_aksiyonu_durum_guncelle(
  p_aksiyon_id uuid,
  p_durum text,
  p_onay_notu text default null
)
returns public.deneme_aksiyonlari
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_aksiyon public.deneme_aksiyonlari%rowtype;
  v_son public.deneme_aksiyonlari%rowtype;
begin
  if p_durum not in ('onaylandi', 'reddedildi', 'tamamlandi') then
    raise exception 'Geçersiz aksiyon durumu';
  end if;

  select * into v_aksiyon
  from public.deneme_aksiyonlari
  where id = p_aksiyon_id
    and ogretmen_mi()
    and ogrencim_mi(ogrenci_id)
  for update;

  if not found then
    raise exception 'Aksiyon bulunamadı veya erişim yok';
  end if;

  update public.deneme_aksiyonlari
  set durum = p_durum,
      onaylayan_id = auth.uid(),
      onay_notu = nullif(btrim(p_onay_notu), ''),
      updated_at = now()
  where id = p_aksiyon_id
  returning * into v_son;

  return v_son;
end;
$fn$;

create or replace function public.deneme_aksiyonunu_goreve_donustur(p_aksiyon_id uuid)
returns public.deneme_aksiyonlari
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_aksiyon public.deneme_aksiyonlari%rowtype;
  v_gorev_id uuid;
  v_son public.deneme_aksiyonlari%rowtype;
begin
  select * into v_aksiyon
  from public.deneme_aksiyonlari
  where id = p_aksiyon_id
    and ogretmen_mi()
    and ogrencim_mi(ogrenci_id)
  for update;

  if not found or v_aksiyon.aksiyon_turu <> 'gorev' then
    raise exception 'Göreve dönüştürülebilecek aksiyon bulunamadı';
  end if;
  if v_aksiyon.gorev_id is not null then
    return v_aksiyon;
  end if;
  if v_aksiyon.durum not in ('onaylandi', 'uygulandi') then
    raise exception 'Önce aksiyonu onaylayın';
  end if;

  insert into public.gorevler (ogrenci_id, tarih, baslik, tip)
  values (v_aksiyon.ogrenci_id, v_aksiyon.onerilen_tarih, v_aksiyon.baslik, 'koc')
  returning id into v_gorev_id;

  update public.deneme_aksiyonlari
  set gorev_id = v_gorev_id, durum = 'uygulandi', updated_at = now()
  where id = p_aksiyon_id
  returning * into v_son;
  return v_son;
end;
$fn$;

create or replace function public.deneme_aksiyonunu_tekrara_donustur(p_aksiyon_id uuid)
returns public.deneme_aksiyonlari
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_aksiyon public.deneme_aksiyonlari%rowtype;
  v_tekrar_id uuid;
  v_son public.deneme_aksiyonlari%rowtype;
begin
  select * into v_aksiyon
  from public.deneme_aksiyonlari
  where id = p_aksiyon_id
    and ogretmen_mi()
    and ogrencim_mi(ogrenci_id)
  for update;

  if not found or v_aksiyon.aksiyon_turu <> 'tekrar' then
    raise exception 'Tekrara dönüştürülebilecek aksiyon bulunamadı';
  end if;
  if v_aksiyon.tekrar_plan_id is not null then
    return v_aksiyon;
  end if;
  if v_aksiyon.durum not in ('onaylandi', 'uygulandi') then
    raise exception 'Önce aksiyonu onaylayın';
  end if;

  insert into public.tekrar_planlari (ogrenci_id, aciklama, plan_tarihi, yapildi)
  values (v_aksiyon.ogrenci_id, v_aksiyon.baslik, v_aksiyon.onerilen_tarih, false)
  returning id into v_tekrar_id;

  update public.deneme_aksiyonlari
  set tekrar_plan_id = v_tekrar_id, durum = 'uygulandi', updated_at = now()
  where id = p_aksiyon_id
  returning * into v_son;
  return v_son;
end;
$fn$;

create or replace function public.deneme_aksiyonu_bildirimi_olustur()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.durum = 'onaylandi' and (old.durum is distinct from new.durum) then
    insert into public.bildirimler (
      alici_id, tur, baslik, detay, gonderici_id, ilgili_id, hedef, kaynak
    ) values (
      new.ogrenci_id, 'uyari', 'Koçun yeni aksiyon önerdi', new.baslik,
      new.onaylayan_id, new.id, '/student/suggestions', 'deneme-aksiyon:' || new.id::text
    );
  end if;
  return new;
end;
$fn$;

drop trigger if exists deneme_aksiyonu_bildirimi_trg on public.deneme_aksiyonlari;
create trigger deneme_aksiyonu_bildirimi_trg
after update on public.deneme_aksiyonlari
for each row execute function public.deneme_aksiyonu_bildirimi_olustur();

revoke all on function public.deneme_aksiyon_taslagi_olustur(uuid, uuid) from public, anon;
grant execute on function public.deneme_aksiyon_taslagi_olustur(uuid, uuid) to authenticated;
revoke all on function public.deneme_aksiyonu_durum_guncelle(uuid, text, text) from public, anon;
grant execute on function public.deneme_aksiyonu_durum_guncelle(uuid, text, text) to authenticated;
revoke all on function public.deneme_aksiyonunu_goreve_donustur(uuid) from public, anon;
grant execute on function public.deneme_aksiyonunu_goreve_donustur(uuid) to authenticated;
revoke all on function public.deneme_aksiyonunu_tekrara_donustur(uuid) from public, anon;
grant execute on function public.deneme_aksiyonunu_tekrara_donustur(uuid) to authenticated;
revoke all on function public.deneme_aksiyonu_bildirimi_olustur() from public, anon, authenticated;

notify pgrst, 'reload schema';
