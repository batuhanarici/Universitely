import { supabase } from "./supabase";
import type { Mesaj } from "../types/database";

export async function ogretmenHesapId(): Promise<string | null> {
  const { data, error } = await supabase.rpc("ogretmen_hesap_id");
  if (error) throw error;
  return data ?? null;
}

export async function mesajlariGetir(): Promise<Mesaj[]> {
  const { data, error } = await supabase
    .from("mesajlar")
    .select("*")
    .order("tarih", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function mesajGonder(aliciId: string, icerik: string): Promise<Mesaj> {
  const { data, error } = await supabase
    .from("mesajlar")
    .insert({ alici_id: aliciId, icerik })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function mesajOkunduIsaretle(id: string) {
  const { error } = await supabase.from("mesajlar").update({ okundu: true }).eq("id", id);
  if (error) throw error;
}
