import { supabase } from "./supabase";
import type { Deneme, DenemeSablonu } from "../types/database";

export async function sablonlariGetirDetayli(): Promise<
  (DenemeSablonu & { ders_adi: string })[]
> {
  const { data, error } = await supabase
    .from("deneme_sablonlari")
    .select("*, dersler(ad)")
    .order("ad");
  if (error) throw error;
  return (data ?? []).map((s: any) => ({
    ...s,
    ders_adi: s.dersler?.ad ?? "—",
  }));
}

export async function denemeOlustur(
  ad: string,
  tarih: string,
  sablonId: string
): Promise<Deneme> {
  const { data, error } = await supabase
    .from("denemeler")
    .insert({ ad, tarih, sablon_id: sablonId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function denemeleriGetir(): Promise<
  (Deneme & { sablon_adi: string })[]
> {
  const { data, error } = await supabase
    .from("denemeler")
    .select("*, deneme_sablonlari(ad)")
    .order("tarih", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d: any) => ({
    ...d,
    sablon_adi: d.deneme_sablonlari?.ad ?? "—",
  }));
}
