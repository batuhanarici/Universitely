import { supabase } from "./supabase";
import type { Gorev, GorevTipi } from "../types/database";

export interface GorevGirdisi {
  baslik: string;
  tarih?: string;
  tip?: GorevTipi;
}

export async function gorevleriGetir(): Promise<Gorev[]> {
  const { data, error } = await supabase
    .from("gorevler")
    .select("*")
    .order("tarih", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function gorevEkle(girdi: GorevGirdisi): Promise<Gorev> {
  const { data, error } = await supabase
    .from("gorevler")
    .insert({ baslik: girdi.baslik, tarih: girdi.tarih, tip: girdi.tip })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function gorevTamamla(id: string, tamamlandi: boolean) {
  const { error } = await supabase.from("gorevler").update({ tamamlandi }).eq("id", id);
  if (error) throw error;
}

export async function gorevSil(id: string) {
  const { error } = await supabase.from("gorevler").delete().eq("id", id);
  if (error) throw error;
}
