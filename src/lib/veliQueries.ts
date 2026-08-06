import { supabase } from "./supabase";
import type { CalismaKaydi, Gorev, Gorusme, Kitap, KonuIlerleme, OgrenciProfili, TekrarPlan } from "../types/database";

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

  const [profilR, calismaR, gorevR, kitapR, konuR, tekrarR, gorusmeR, konularR, derslerR, cocukR] = await Promise.all([
    supabase.from("ogrenci_profilleri").select("*").eq("ogrenci_id", ogr).maybeSingle(),
    q("calisma_kayitlari"),
    q("gorevler"),
    q("kitaplar"),
    q("konu_ilerlemeleri"),
    q("tekrar_planlari"),
    q("gorusmeler"),
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
    konular,
  };
}
