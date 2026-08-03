import { supabase } from "./supabase";
import type { OgrenciProfili, SinavTuru } from "../types/database";

export interface ProfilGirdisi {
  hedef_universite?: string;
  hedef_bolum?: string;
  sinav_turu?: SinavTuru;
  hedef_net?: number | null;
}

export async function profiliGetir(): Promise<OgrenciProfili | null> {
  const { data, error } = await supabase.from("ogrenci_profilleri").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function profiliKaydet(girdi: ProfilGirdisi): Promise<OgrenciProfili> {
  const { data, error } = await supabase
    .from("ogrenci_profilleri")
    .upsert(girdi, { onConflict: "ogrenci_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
