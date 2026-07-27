import { supabase } from "./supabase";

export interface SinifSonucSatiri {
  id: string;
  deneme_id: string;
  ogrenci_id: string;
  ad_soyad: string;
  soru_no: number;
  durum: "dogru" | "yanlis" | "bos";
  deneme_adi: string;
  tarih: string;
  konu_adi: string;
  ders_adi: string;
}

export async function sinifSonuclariniGetir(): Promise<SinifSonucSatiri[]> {
  const { data, error } = await supabase.from("sinif_sonuclari").select("*");
  if (error) throw error;
  return data ?? [];
}
