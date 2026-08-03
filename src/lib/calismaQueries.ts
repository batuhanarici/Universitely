import { supabase } from "./supabase";
import type { CalismaKaydi } from "../types/database";

export interface CalismaGirdisi {
  tarih?: string;
  sure_dk: number;
  soru_sayisi?: number | null;
  konu_id?: string | null;
  not?: string | null;
}

export type CalismaKaydiDetayli = CalismaKaydi & { konu_adi: string | null };

export async function calismalariGetir(): Promise<CalismaKaydiDetayli[]> {
  const { data, error } = await supabase
    .from("calisma_kayitlari")
    .select("*, konular(ad)")
    .order("tarih", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c: any) => ({ ...c, konu_adi: c.konular?.ad ?? null }));
}

export async function calismaEkle(girdi: CalismaGirdisi): Promise<CalismaKaydi> {
  const { data, error } = await supabase.from("calisma_kayitlari").insert(girdi).select().single();
  if (error) throw error;
  return data;
}

export async function calismaSil(id: string) {
  const { error } = await supabase.from("calisma_kayitlari").delete().eq("id", id);
  if (error) throw error;
}
