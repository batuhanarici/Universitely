import { supabase } from "./supabase";

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
