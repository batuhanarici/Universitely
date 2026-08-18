import { supabase } from "./supabase";
import type { OgrenciProfili, SinavTuru } from "../types/database";

export interface ProfilGirdisi {
  okul?: string;
  sinif?: string;
  hedef_universite?: string | null;
  hedef_bolum?: string | null;
  sinav_turu?: SinavTuru;
  hedef_net?: number | null;
  email_bildirim?: boolean;
  avatar_url?: string | null;
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

export async function ogrenciAdSoyadGetir(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "";
  const { data, error } = await supabase.from("ogrenciler").select("ad_soyad").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return (data as { ad_soyad: string } | null)?.ad_soyad ?? "";
}

export async function ogrenciAdSoyadKaydet(yeni: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum bulunamadı.");
  const { error: tabloHata } = await supabase.from("ogrenciler").update({ ad_soyad: yeni }).eq("id", user.id);
  if (tabloHata) throw tabloHata;
  const { error: metaHata } = await supabase.auth.updateUser({ data: { ad_soyad: yeni } });
  if (metaHata) throw metaHata;
}

/** Öğrencinin tanıtım turunu daha önce görüp görmediğini döner (görmediyse true). */
export async function turGosterilmeliMi(): Promise<boolean> {
  const { data, error } = await supabase
    .from("ogrenci_profilleri")
    .select("tur_gorundu")
    .maybeSingle();
  if (error) throw error;
  return data ? (data as { tur_gorundu: boolean }).tur_gorundu !== true : true;
}

/** Turu görüldü olarak işaretler (bitirdiğinde ya da atladığında çağrılır). */
export async function turGorulduIsaretle(): Promise<void> {
  const { error } = await supabase
    .from("ogrenci_profilleri")
    .upsert({ tur_gorundu: true }, { onConflict: "ogrenci_id" });
  if (error) throw error;
}
