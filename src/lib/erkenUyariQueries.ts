import { supabase } from "./supabase";
import type { KocUyariKapatma } from "../types/database";

export async function kocUyariKapatmalariniGetir(): Promise<KocUyariKapatma[]> {
  const { data, error } = await supabase
    .from("koc_uyari_kapatmalari")
    .select("*")
    .order("kapatildi_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as KocUyariKapatma[];
}

export async function kocUyariyiKapat(ogrenciId: string, uyariTuru: string, kaynakTarihi: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("koc_uyariyi_kapat", {
    p_ogrenci_id: ogrenciId,
    p_uyari_turu: uyariTuru,
    p_kaynak_tarihi: kaynakTarihi,
  });
  if (error) throw error;
  return data === true;
}
