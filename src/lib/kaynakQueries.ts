import { supabase } from "./supabase";
import type { KaynakTuru, Kitap } from "../types/database";

export interface KitapGirdisi {
  ad: string;
  kaynak_turu: KaynakTuru;
  toplam: number;
  ilerleme?: number;
  baslangic_tarihi?: string | null;
  bitis_hedefi?: string | null;
}

export async function kitaplariGetir(): Promise<Kitap[]> {
  const { data, error } = await supabase
    .from("kitaplar")
    .select("*")
    .order("bitis_hedefi", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function kitapEkle(girdi: KitapGirdisi): Promise<Kitap> {
  const { data, error } = await supabase
    .from("kitaplar")
    .insert({ ...girdi, ilerleme: girdi.ilerleme ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function kitapGuncelle(id: string, degisiklik: Partial<Kitap>) {
  const { error } = await supabase.from("kitaplar").update(degisiklik).eq("id", id);
  if (error) throw error;
}

export async function kitapSil(id: string) {
  const { error } = await supabase.from("kitaplar").delete().eq("id", id);
  if (error) throw error;
}
