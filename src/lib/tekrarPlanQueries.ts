import { supabase } from "./supabase";
import type { TekrarPlan } from "../types/database";

export async function tekrarPlanlariniGetir(): Promise<TekrarPlan[]> {
  const { data, error } = await supabase
    .from("tekrar_planlari")
    .select("*")
    .order("plan_tarihi", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function tekrarPlanEkle(aciklama: string, yanlisId: string | null, planTarihi: string): Promise<TekrarPlan> {
  const { data, error } = await supabase
    .from("tekrar_planlari")
    .insert({ aciklama, yanlis_id: yanlisId, plan_tarihi: planTarihi })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function tekrarPlanYapildi(id: string, yapildi: boolean) {
  const { error } = await supabase.from("tekrar_planlari").update({ yapildi }).eq("id", id);
  if (error) throw error;
}

export async function tekrarPlanSil(id: string) {
  const { error } = await supabase.from("tekrar_planlari").delete().eq("id", id);
  if (error) throw error;
}
