import { supabase } from "./supabase";

export interface OgretmenProfili {
  ogretmen_id: string;
  ad_soyad: string | null;
  brans: string | null;
  telefon: string | null;
  kurum: string | null;
  biyografi: string | null;
  avatar_url: string | null;
  email_bildirim: boolean;
  tur_gorundu: boolean;
}

export interface OgretmenProfilGirdisi {
  ad_soyad?: string;
  brans?: string;
  telefon?: string;
  kurum?: string;
  biyografi?: string;
  avatar_url?: string | null;
  email_bildirim?: boolean;
}

export async function ogretmenProfilGetir(): Promise<OgretmenProfili | null> {
  const { data, error } = await supabase.from("ogretmen_profilleri").select("*").maybeSingle();
  if (error) throw error;
  return data as OgretmenProfili | null;
}

export async function ogretmenProfilKaydet(girdi: OgretmenProfilGirdisi): Promise<OgretmenProfili> {
  const { data, error } = await supabase
    .from("ogretmen_profilleri")
    .upsert(girdi, { onConflict: "ogretmen_id" })
    .select()
    .single();
  if (error) throw error;
  return data as OgretmenProfili;
}

export async function ogretmenAdSoyadKaydet(yeni: string): Promise<void> {
  const { error: tabloHata } = await supabase
    .from("ogretmen_profilleri")
    .upsert({ ad_soyad: yeni }, { onConflict: "ogretmen_id" });
  if (tabloHata) throw tabloHata;
  const { error: metaHata } = await supabase.auth.updateUser({ data: { ad_soyad: yeni } });
  if (metaHata) throw metaHata;
}

/** Koçun tanıtım turunu daha önce görüp görmediğini döner (görmediyse true). */
export async function turGosterilmeliMi(): Promise<boolean> {
  const { data, error } = await supabase
    .from("ogretmen_profilleri")
    .select("tur_gorundu")
    .maybeSingle();
  if (error) throw error;
  return data ? data.tur_gorundu !== true : true;
}

/** Turu görüldü olarak işaretler (bitirdiğinde ya da atladığında çağrılır). */
export async function turGorulduIsaretle(): Promise<void> {
  const { error } = await supabase
    .from("ogretmen_profilleri")
    .upsert({ tur_gorundu: true }, { onConflict: "ogretmen_id" });
  if (error) throw error;
}
