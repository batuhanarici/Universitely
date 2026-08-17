import { supabase } from "./supabase";

export interface Sube {
  id: string;
  ogretmen_id: string;
  ad: string;
  created_at: string;
}

export async function subeleriGetir(): Promise<Sube[]> {
  const { data, error } = await supabase
    .from("subeler")
    .select("*")
    .order("ad", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function subeOlustur(ad: string): Promise<Sube> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum bulunamadı");

  const { data, error } = await supabase
    .from("subeler")
    .insert({ ad, ogretmen_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function subeAdiGuncelle(subeId: string, ad: string): Promise<void> {
  const { error } = await supabase.from("subeler").update({ ad }).eq("id", subeId);
  if (error) throw error;
}

export async function subeSil(subeId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("sube_sil", { p_sube_id: subeId });
  if (error) throw error;
  return data ?? false;
}

// Öğrenci dropdown'larını seçili şubeye göre daraltmak için ortak yardımcı.
// subeId boşsa (Tüm Şubeler) listeyi olduğu gibi döner.
export function subeyeGoreFiltrele<T extends { sube_id?: string | null }>(liste: T[], subeId: string): T[] {
  if (!subeId) return liste;
  return liste.filter((o) => o.sube_id === subeId);
}

// null gönderilirse öğrenci şubesiz bırakılır
export async function ogrenciyiSubeyeAta(ogrenciId: string, subeId: string | null): Promise<boolean> {
  const { data, error } = await supabase.rpc("ogrenciyi_subeye_ata", {
    p_ogrenci_id: ogrenciId,
    p_sube_id: subeId,
  });
  if (error) throw error;
  return data ?? false;
}
