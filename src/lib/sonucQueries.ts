import { supabase } from "./supabase";
import type { Ogrenci, SoruDurumu } from "../types/database";

export async function ogrencileriGetir(): Promise<Ogrenci[]> {
  const { data, error } = await supabase.rpc("koc_ogrencileri");
  if (error) throw error;
  return (data ?? []).map((o: any) => ({ id: o.id, ad_soyad: o.ad_soyad, sube_id: o.sube_id, sube_adi: o.sube_adi }));
}

export interface SablonSorusuDetayli {
  soru_no: number;
  konu_id: string | null;
  konu_ad: string;
}

export async function sablonSorulariniGetir(sablonId: string): Promise<SablonSorusuDetayli[]> {
  const { data, error } = await supabase
    .from("sablon_sorulari")
    .select("soru_no, konu_id, konular(ad)")
    .eq("sablon_id", sablonId)
    .order("soru_no");
  if (error) throw error;
  return (data ?? []).map((s: any) => ({
    soru_no: s.soru_no,
    konu_id: s.konu_id,
    konu_ad: s.konular?.ad ?? "—",
  }));
}

export async function denemeSonucuVarMi(denemeId: string, ogrenciId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("sonuclar")
    .select("*", { count: "exact", head: true })
    .eq("deneme_id", denemeId)
    .eq("ogrenci_id", ogrenciId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function sonucGirisiKaydet(
  denemeId: string,
  ogrenciId: string,
  sonuclar: { soru_no: number; durum: SoruDurumu }[]
) {
  const kayitlar = sonuclar.map((s) => ({
    deneme_id: denemeId,
    ogrenci_id: ogrenciId,
    soru_no: s.soru_no,
    durum: s.durum,
  }));

  const { data, error } = await supabase.from("sonuclar").insert(kayitlar).select("id, durum");
  if (error) throw error;

  const tekrarGerekenler = (data ?? [])
    .filter((s) => s.durum === "yanlis" || s.durum === "bos")
    .map((s) => ({ sonuc_id: s.id, cozuldu: false }));

  if (tekrarGerekenler.length > 0) {
    const { error: tekrarHata } = await supabase.from("tekrar_durumu").insert(tekrarGerekenler);
    if (tekrarHata) throw tekrarHata;
  }
}

export interface TopluSonucGirdisi {
  ogrenci_id: string;
  sorular: { soru_no: number; durum: SoruDurumu }[];
}

export async function topluSonucGir(denemeId: string, girdi: TopluSonucGirdisi[]): Promise<boolean> {
  const { data, error } = await supabase.rpc("toplu_sonuc_gir", { deneme_id: denemeId, girdi });
  if (error) throw error;
  return data ?? false;
}

export interface DenemeSonucSatiri {
  ogrenci_id: string;
  soru_no: number;
  durum: SoruDurumu;
}

export async function denemeSonuclariniGetir(denemeId: string): Promise<DenemeSonucSatiri[]> {
  const { data, error } = await supabase
    .from("koc_sonuclari")
    .select("ogrenci_id, soru_no, durum")
    .eq("deneme_id", denemeId);
  if (error) throw error;
  return (data ?? []).map((s: any) => ({
    ogrenci_id: s.ogrenci_id,
    soru_no: s.soru_no,
    durum: s.durum as SoruDurumu,
  }));
}
