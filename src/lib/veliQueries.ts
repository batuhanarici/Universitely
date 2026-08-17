import { supabase } from "./supabase";
import type { CalismaKaydi, Gorev, Gorusme, Kitap, KonuIlerleme, OgrenciProfili, TekrarPlan, SeansNotu, TakipMaddesi } from "../types/database";

export interface KonuKaydi {
  id: string;
  ders_id: string | null;
  ad: string;
}

export interface VeliCocukVerisi {
  ogrenci_id: string | null;
  cocuk_adi: string;
  profil: OgrenciProfili | null;
  calismalar: CalismaKaydi[];
  gorevler: Gorev[];
  kitaplar: Kitap[];
  konuIlerlemeleri: KonuIlerleme[];
  tekrarPlanlari: TekrarPlan[];
  gorusmeler: Gorusme[];
  seansNotlari: SeansNotu[];
  takipMaddeleri: TakipMaddesi[];
  konular: KonuKaydi[];
}

export interface VeliSonucSatiri {
  deneme_id: string;
  ogrenci_id: string;
  soru_no: number;
  durum: "dogru" | "yanlis" | "bos";
  deneme_adi: string;
  tarih: string;
  konu_adi: string;
  ders_adi: string;
}

export interface VeliProfili {
  id: string;
  ad_soyad: string | null;
  telefon: string | null;
  yakinlik: string | null;
  avatar_url: string | null;
  email_bildirim: boolean;
  tur_gorundu: boolean;
}

export interface VeliProfilGirdisi {
  ad_soyad?: string;
  telefon?: string;
  yakinlik?: string;
  avatar_url?: string | null;
  email_bildirim?: boolean;
}

export async function veliProfilGetir(): Promise<VeliProfili | null> {
  const { data, error } = await supabase.from("veliler").select("*").maybeSingle();
  if (error) throw error;
  return data as VeliProfili | null;
}

export async function veliProfilKaydet(girdi: VeliProfilGirdisi): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("veliler").update(girdi).eq("id", user.id);
  if (error) throw error;
}

export async function veliAdSoyadKaydet(yeni: string): Promise<void> {
  await veliProfilKaydet({ ad_soyad: yeni });
  const { error } = await supabase.auth.updateUser({ data: { ad_soyad: yeni } });
  if (error) throw error;
}

/** Velinin tanıtım turunu daha önce görüp görmediğini döner (görmediyse true). */
export async function turGosterilmeliMi(): Promise<boolean> {
  const { data, error } = await supabase.from("veliler").select("tur_gorundu").maybeSingle();
  if (error) throw error;
  return data ? (data as { tur_gorundu: boolean }).tur_gorundu !== true : true;
}

/** Turu görüldü olarak işaretler (bitirdiğinde ya da atladığında çağrılır). */
export async function turGorulduIsaretle(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("veliler").update({ tur_gorundu: true }).eq("id", user.id);
  if (error) throw error;
}

export async function veliBagla(kod: string, adSoyad: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("veli_bagla", { kod, ad_soyad: adSoyad });
  if (error) throw error;
  return data ?? false;
}

export async function velininKocu(): Promise<string | null> {
  const { data, error } = await supabase.rpc("velinin_kocu");
  if (error) throw error;
  return data ?? null;
}

export async function veliSonuclari(): Promise<VeliSonucSatiri[]> {
  const { data, error } = await supabase.from("veli_sonuclari").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function veliCocukVerisiniGetir(): Promise<VeliCocukVerisi> {
  const bos: VeliCocukVerisi = {
    ogrenci_id: null,
    cocuk_adi: "",
    profil: null,
    calismalar: [],
    gorevler: [],
    kitaplar: [],
    konuIlerlemeleri: [],
    tekrarPlanlari: [],
    gorusmeler: [],
    seansNotlari: [],
    takipMaddeleri: [],
    konular: [],
  };

  const { data: veli, error: veliErr } = await supabase
    .from("veliler")
    .select("ogrenci_id")
    .maybeSingle();
  if (veliErr) throw veliErr;
  const ogr = veli?.ogrenci_id ?? null;
  if (!ogr) return bos;

  const q = (tablo: string) => supabase.from(tablo).select("*").eq("ogrenci_id", ogr);

  const [profilR, calismaR, gorevR, kitapR, konuR, tekrarR, gorusmeR, seansNotuR, takipR, konularR, derslerR, cocukR] = await Promise.all([
    supabase.from("ogrenci_profilleri").select("*").eq("ogrenci_id", ogr).maybeSingle(),
    q("calisma_kayitlari"),
    q("gorevler"),
    q("kitaplar"),
    q("konu_ilerlemeleri"),
    q("tekrar_planlari"),
    q("gorusmeler"),
    q("seans_notlari"),
    q("takip_maddeleri"),
    supabase.from("konular").select("*"),
    supabase.from("dersler").select("*"),
    supabase.from("ogrenciler").select("ad_soyad").eq("id", ogr).maybeSingle(),
  ]);

  const dersAd = new Map((derslerR.data ?? []).map((d: { id: string; ad: string }) => [d.id, d.ad]));
  const konular = (konularR.data ?? [])
    .map((k: { id: string; ders_id: string | null; ad: string }) => ({
      id: k.id,
      ders_id: k.ders_id,
      ad: dersAd.get(k.ders_id ?? "") ? `${dersAd.get(k.ders_id ?? "")} · ${k.ad}` : k.ad,
    }))
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

  return {
    ogrenci_id: ogr,
    cocuk_adi: (cocukR.data as { ad_soyad: string } | null)?.ad_soyad ?? "Çocuğum",
    profil: (profilR.data as OgrenciProfili | null) ?? null,
    calismalar: (calismaR.data as CalismaKaydi[]) ?? [],
    gorevler: (gorevR.data as Gorev[]) ?? [],
    kitaplar: (kitapR.data as Kitap[]) ?? [],
    konuIlerlemeleri: (konuR.data as KonuIlerleme[]) ?? [],
    tekrarPlanlari: (tekrarR.data as TekrarPlan[]) ?? [],
    gorusmeler: (gorusmeR.data as Gorusme[]) ?? [],
    seansNotlari: (seansNotuR.data as SeansNotu[]) ?? [],
    takipMaddeleri: (takipR.data as TakipMaddesi[]) ?? [],
    konular,
  };
}
