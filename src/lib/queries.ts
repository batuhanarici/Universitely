import { supabase } from "./supabase";
import type { Ders, Konu, DenemeSablonu } from "../types/database";

export async function dersleriGetir(): Promise<Ders[]> {
  const { data, error } = await supabase.from("dersler").select("*").order("ad");
  if (error) throw error;
  return data ?? [];
}

export async function dersEkle(ad: string): Promise<Ders> {
  const { data, error } = await supabase.from("dersler").insert({ ad }).select().single();
  if (error) throw error;
  return data;
}

export async function konulariGetir(dersId: string): Promise<Konu[]> {
  const { data, error } = await supabase
    .from("konular")
    .select("*")
    .eq("ders_id", dersId)
    .order("ad");
  if (error) throw error;
  return data ?? [];
}

export async function konuEkle(dersId: string, ad: string): Promise<Konu> {
  const { data, error } = await supabase
    .from("konular")
    .insert({ ders_id: dersId, ad })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function sablonlariGetir(): Promise<DenemeSablonu[]> {
  const { data, error } = await supabase.from("deneme_sablonlari").select("*").order("ad");
  if (error) throw error;
  return data ?? [];
}

export async function sablonOlustur(ad: string, dersId: string): Promise<DenemeSablonu> {
  const { data, error } = await supabase
    .from("deneme_sablonlari")
    .insert({ ad, ders_id: dersId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function sablonSorulariniKaydet(
  sablonId: string,
  sorular: { soru_no: number; konu_id: string }[]
) {
  const kayitlar = sorular.map((s) => ({ sablon_id: sablonId, ...s }));
  const { error } = await supabase.from("sablon_sorulari").insert(kayitlar);
  if (error) throw error;
}
