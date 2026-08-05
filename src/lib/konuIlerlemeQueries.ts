import { supabase } from "./supabase";
import type { KonuIlerleme } from "../types/database";

export interface KonuDersBilgisi {
  id: string;
  ders_id: string;
  ad: string;
  ders_adi: string;
}

export async function konularVeDersler(): Promise<KonuDersBilgisi[]> {
  const { data, error } = await supabase
    .from("konular")
    .select("id, ders_id, ad, dersler(ad)")
    .order("ad");
  if (error) throw error;
  return (data ?? []).map((k: any) => ({
    id: k.id,
    ders_id: k.ders_id,
    ad: k.ad,
    ders_adi: k.dersler?.ad ?? "—",
  }));
}

export async function konuIlerlemeleriGetir(): Promise<KonuIlerleme[]> {
  const { data, error } = await supabase.from("konu_ilerlemeleri").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function konuIlerlemeIsaretle(konuId: string, tamamlandi: boolean) {
  const { error } = await supabase
    .from("konu_ilerlemeleri")
    .upsert({
      konu_id: konuId,
      tamamlandi,
      tamamlanma_tarihi: tamamlandi ? new Date().toISOString().slice(0, 10) : null,
    }, { onConflict: "ogrenci_id,konu_id" });
  if (error) throw error;
}

export async function ogrenciKonuIlerlemeleriGetir(ogrenciId: string): Promise<KonuIlerleme[]> {
  const { data, error } = await supabase
    .from("konu_ilerlemeleri")
    .select("*")
    .eq("ogrenci_id", ogrenciId);
  if (error) throw error;
  return data ?? [];
}

export async function konuAta(ogrenciId: string, konuId: string) {
  const { error } = await supabase
    .from("konu_ilerlemeleri")
    .upsert({
      ogrenci_id: ogrenciId,
      konu_id: konuId,
      tamamlandi: false,
      tamamlanma_tarihi: null,
    }, { onConflict: "ogrenci_id,konu_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function konuAtamasiKaldir(ogrenciId: string, konuId: string) {
  const { error } = await supabase
    .from("konu_ilerlemeleri")
    .delete()
    .eq("ogrenci_id", ogrenciId)
    .eq("konu_id", konuId);
  if (error) throw error;
}
