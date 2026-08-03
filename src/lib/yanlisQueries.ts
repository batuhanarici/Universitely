import { supabase } from "./supabase";
import type { YanlisArsivi } from "../types/database";

export interface YanlisGirdisi {
  konu_id?: string | null;
  kaynak_adi?: string | null;
  sayfa_no?: number | null;
  soru_no?: number | null;
  aciklama?: string | null;
}

export async function yanlislariGetir(): Promise<YanlisArsivi[]> {
  const { data, error } = await supabase
    .from("yanlis_arsivi")
    .select("*")
    .order("eklenme_tarihi", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function yanlisEkle(girdi: YanlisGirdisi): Promise<YanlisArsivi> {
  const { data, error } = await supabase.from("yanlis_arsivi").insert(girdi).select().single();
  if (error) throw error;
  return data;
}

export async function yanlisCozulduIsaretle(id: string, cozuldu: boolean) {
  const { error } = await supabase.from("yanlis_arsivi").update({ cozuldu }).eq("id", id);
  if (error) throw error;
}

export async function yanlisSil(id: string) {
  const { error } = await supabase.from("yanlis_arsivi").delete().eq("id", id);
  if (error) throw error;
}
