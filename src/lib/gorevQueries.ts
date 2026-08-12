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
  const degisiklik: Partial<Gorev> = { tamamlandi };
  if (!tamamlandi) degisiklik.kontrol_edildi = false;
  const { error } = await supabase.from("gorevler").update(degisiklik).eq("id", id);
  if (error) throw error;
}

export async function gorevKontrolEt(id: string, kontrolEdildi: boolean) {
  const { error } = await supabase.from("gorevler").update({ kontrol_edildi: kontrolEdildi }).eq("id", id);
  if (error) throw error;
}

export async function gorevGeriBildirimYaz(id: string, geriBildirim: string) {
  const { error } = await supabase.from("gorevler").update({ geri_bildirim: geriBildirim }).eq("id", id);
  if (error) throw error;
}

export async function ogrenciGorevleriGetir(ogrenciId: string): Promise<Gorev[]> {
  const { data, error } = await supabase
    .from("gorevler")
    .select("*")
    .eq("ogrenci_id", ogrenciId)
    .order("tarih", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function gorevSil(id: string) {
  const { error } = await supabase.from("gorevler").delete().eq("id", id);
  if (error) throw error;
}

export async function gorevAta(ogrenciId: string, baslik: string, tarih: string, subeId?: string | null) {
  const { data, error } = await supabase
    .from("gorevler")
    .insert({ ogrenci_id: ogrenciId, baslik, tarih, tip: "koc", sube_id: subeId ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}
