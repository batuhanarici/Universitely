import { supabase } from "./supabase";
import type { DenemeAksiyonu, DenemeAksiyonuDurumu } from "../types/database";

export async function denemeAksiyonlariniGetir(denemeId?: string): Promise<DenemeAksiyonu[]> {
  let sorgu = supabase
    .from("deneme_aksiyonlari")
    .select("*")
    .order("onerilen_tarih", { ascending: true })
    .order("oncelik", { ascending: true })
    .order("created_at", { ascending: false });
  if (denemeId) sorgu = sorgu.eq("deneme_id", denemeId);
  const { data, error } = await sorgu;
  if (error) throw error;
  return (data ?? []) as DenemeAksiyonu[];
}

export async function denemeAksiyonTaslagiOlustur(denemeId: string, ogrenciId: string): Promise<number> {
  const { data, error } = await supabase.rpc("deneme_aksiyon_taslagi_olustur", {
    p_deneme_id: denemeId,
    p_ogrenci_id: ogrenciId,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function denemeAksiyonuDurumGuncelle(id: string, durum: DenemeAksiyonuDurumu, onayNotu?: string | null): Promise<DenemeAksiyonu> {
  const { data, error } = await supabase.rpc("deneme_aksiyonu_durum_guncelle", {
    p_aksiyon_id: id,
    p_durum: durum,
    p_onay_notu: onayNotu ?? null,
  });
  if (error) throw error;
  return data as DenemeAksiyonu;
}

export async function denemeAksiyonunuGoreveDonustur(id: string): Promise<DenemeAksiyonu> {
  const { data, error } = await supabase.rpc("deneme_aksiyonunu_goreve_donustur", { p_aksiyon_id: id });
  if (error) throw error;
  return data as DenemeAksiyonu;
}

export async function denemeAksiyonunuTekraraDonustur(id: string): Promise<DenemeAksiyonu> {
  const { data, error } = await supabase.rpc("deneme_aksiyonunu_tekrara_donustur", { p_aksiyon_id: id });
  if (error) throw error;
  return data as DenemeAksiyonu;
}
