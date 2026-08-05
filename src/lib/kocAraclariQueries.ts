import { supabase } from "./supabase";
import type { KocNot, Gorusme, Odeme, VeliAlici, KocSonucSatiri } from "../types/database";

export async function kocVelileriniGetir(): Promise<VeliAlici[]> {
  const { data, error } = await supabase.rpc("koc_velileri");
  if (error) throw error;
  return data ?? [];
}

export async function kocNotlariniGetir(ogrenciId: string): Promise<KocNot[]> {
  const { data, error } = await supabase
    .from("koc_notlari")
    .select("*")
    .eq("ogrenci_id", ogrenciId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function kocNotEkle(ogrenciId: string, notMetni: string, onem: string): Promise<KocNot> {
  const { data, error } = await supabase
    .from("koc_notlari")
    .insert({ ogrenci_id: ogrenciId, not_metni: notMetni, onem })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function kocNotGuncelle(id: string, notMetni: string, onem: string) {
  const { error } = await supabase
    .from("koc_notlari")
    .update({ not_metni: notMetni, onem, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function kocNotSil(id: string) {
  const { error } = await supabase.from("koc_notlari").delete().eq("id", id);
  if (error) throw error;
}

export async function gorusmeleriGetir(): Promise<Gorusme[]> {
  const { data, error } = await supabase
    .from("gorusmeler")
    .select("*")
    .order("tarih", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface GorusmeGirdisi {
  ogrenci_id: string;
  katilimci: string;
  baslik: string;
  tarih: string;
  notlar?: string | null;
}

export async function gorusmeEkle(girdi: GorusmeGirdisi): Promise<Gorusme> {
  const { data, error } = await supabase
    .from("gorusmeler")
    .insert({
      ogrenci_id: girdi.ogrenci_id,
      katilimci: girdi.katilimci,
      baslik: girdi.baslik,
      tarih: girdi.tarih,
      notlar: girdi.notlar ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function gorusmeDurumGuncelle(id: string, durum: string) {
  const { error } = await supabase.from("gorusmeler").update({ durum }).eq("id", id);
  if (error) throw error;
}

export async function gorusmeSil(id: string) {
  const { error } = await supabase.from("gorusmeler").delete().eq("id", id);
  if (error) throw error;
}

export async function odemeleriGetir(): Promise<Odeme[]> {
  const { data, error } = await supabase
    .from("odemeler")
    .select("*")
    .order("tarih", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface OdemeGirdisi {
  ogrenci_id: string;
  tutar: number;
  aciklama?: string | null;
  tarih: string;
}

export async function odemeEkle(girdi: OdemeGirdisi): Promise<Odeme> {
  const { data, error } = await supabase
    .from("odemeler")
    .insert({
      ogrenci_id: girdi.ogrenci_id,
      tutar: girdi.tutar,
      aciklama: girdi.aciklama ?? null,
      tarih: girdi.tarih,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function odemeOdendiGuncelle(id: string, odendi: boolean) {
  const { error } = await supabase.from("odemeler").update({ odendi }).eq("id", id);
  if (error) throw error;
}

export async function odemeSil(id: string) {
  const { error } = await supabase.from("odemeler").delete().eq("id", id);
  if (error) throw error;
}

export async function kocSonuclariniGetir(): Promise<KocSonucSatiri[]> {
  const { data, error } = await supabase.from("koc_sonuclari").select("*");
  if (error) throw error;
  return data ?? [];
}
