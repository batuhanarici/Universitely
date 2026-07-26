import { supabase } from "./supabase";

export interface SonucDetay {
  id: string;
  deneme_id: string;
  ogrenci_id: string;
  soru_no: number;
  durum: "dogru" | "yanlis" | "bos";
  deneme_adi: string;
  tarih: string;
  konu_id: string | null;
  konu_adi: string;
  ders_adi: string;
}

export interface TekrarKaydi {
  sonuc_id: string;
  cozuldu: boolean;
  deneme_adi: string;
  soru_no: number;
  konu_adi: string;
  tarih: string;
}

export async function kendiSonuclariniGetir(): Promise<SonucDetay[]> {
  const { data, error } = await supabase
    .from("sonuc_detaylari")
    .select("*")
    .order("tarih", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function kendiTekrarHavuzunuGetir(): Promise<TekrarKaydi[]> {
  const { data, error } = await supabase
    .from("tekrar_havuzu_detay")
    .select("*")
    .order("tarih", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function tekrarCozulduIsaretle(sonucId: string, cozuldu: boolean) {
  const { error } = await supabase
    .from("tekrar_durumu")
    .update({ cozuldu })
    .eq("sonuc_id", sonucId);
  if (error) throw error;
}
