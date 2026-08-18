import { supabase } from "./supabase";
import type { OgrenciHedefi } from "../types/database";

export interface UniversiteKatalogKaydi {
  kod: string;
  ad: string;
}

export interface ProgramKatalogKaydi {
  kod: string;
  ad: string;
  url: string;
  tur: "lisans" | "onlisans";
  universiteKodu: string;
}

interface UniversiteKatalogCevabi {
  universities?: UniversiteKatalogKaydi[];
  error?: string;
  message?: string;
}

interface ProgramKatalogCevabi {
  programs?: ProgramKatalogKaydi[];
  error?: string;
  message?: string;
}

async function katalogCagrisi<T>(body: Record<string, string>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("yok-katalog", { body });
  if (error) throw error;
  if (!data) throw new Error("Katalog yanıtı boş döndü.");
  const cevap = data as T & { error?: string; message?: string };
  if (cevap.error) throw new Error(cevap.message ?? "Üniversite kataloğu kullanılamıyor.");
  return cevap;
}

export async function universiteleriGetir(tur: "lisans" | "onlisans"): Promise<UniversiteKatalogKaydi[]> {
  const cevap = await katalogCagrisi<UniversiteKatalogCevabi>({ tip: "universiteler", tur });
  return cevap.universities ?? [];
}

export async function programlariGetir(
  tur: "lisans" | "onlisans",
  universiteKodu: string
): Promise<ProgramKatalogKaydi[]> {
  const cevap = await katalogCagrisi<ProgramKatalogCevabi>({ tip: "programlar", tur, universiteKodu });
  return cevap.programs ?? [];
}

export async function ogrenciHedefleriniGetir(): Promise<OgrenciHedefi[]> {
  const { data, error } = await supabase
    .from("ogrenci_hedefleri")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function ogrenciHedefiEkle(program: ProgramKatalogKaydi, universiteAdi: string): Promise<OgrenciHedefi> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Oturum bulunamadı.");

  const { data, error } = await supabase
    .from("ogrenci_hedefleri")
    .insert({
      ogrenci_id: authData.user.id,
      tur: program.tur,
      universite_kodu: program.universiteKodu,
      universite_adi: universiteAdi,
      program_kodu: program.kod,
      program_adi: program.ad,
      program_url: program.url,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function ogrenciHedefiSil(id: string) {
  const { error } = await supabase.from("ogrenci_hedefleri").delete().eq("id", id);
  if (error) throw error;
}
