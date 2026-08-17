import { supabase } from "./supabase";

export interface AdminKullanici {
  id: string;
  email: string;
  rol: "ogrenci" | "koc" | "veli" | "admin";
  hesap_durumu: "aktif" | "askida";
  hesap_nedeni: string | null;
  ad_soyad: string | null;
  created_at: string;
}

export interface AdminSikayet {
  id: string;
  bildiren_id: string;
  bildiren_email: string | null;
  kategori: "teknik" | "koc" | "ogrenci" | "icerik" | "diger";
  baslik: string;
  aciklama: string;
  durum: "bekliyor" | "inceleniyor" | "cozuldu" | "reddedildi";
  admin_notu: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminIstatistik {
  toplamKullanici: number;
  toplamOgrenci: number;
  aktifOgrenci: number;
  toplamKoc: number;
  toplamGorev: number;
  bekleyenSikayet: number;
  askidakiHesap: number;
  son30GunKayit: number;
}

export async function adminKullanicilariGetir(): Promise<AdminKullanici[]> {
  const { data, error } = await supabase.rpc("admin_kullanicilari");
  if (error) throw error;
  return (data ?? []) as AdminKullanici[];
}

export async function adminSikayetleriGetir(): Promise<AdminSikayet[]> {
  const { data, error } = await supabase.rpc("admin_sikayetleri");
  if (error) throw error;
  return (data ?? []) as AdminSikayet[];
}

export async function adminIstatistikGetir(): Promise<AdminIstatistik> {
  const { data, error } = await supabase.rpc("admin_istatistik");
  if (error) throw error;
  return data as AdminIstatistik;
}

export async function adminHesapDurumuGuncelle(userId: string, durum: "aktif" | "askida", neden?: string) {
  const { error } = await supabase.rpc("admin_hesap_durum_guncelle", {
    p_user_id: userId,
    p_durum: durum,
    p_neden: neden ?? null,
  });
  if (error) throw error;
}

export async function adminSikayetGuncelle(id: string, durum: AdminSikayet["durum"], adminNotu: string) {
  const { error } = await supabase.rpc("admin_sikayet_guncelle", {
    p_sikayet_id: id,
    p_durum: durum,
    p_admin_notu: adminNotu || null,
  });
  if (error) throw error;
}

export async function adminKocDavetEt(email: string, adSoyad: string) {
  const { data, error } = await supabase.functions.invoke("admin-davet-koc", {
    body: { email, adSoyad },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.message ?? "Koç daveti gönderilemedi.");
}

export async function sikayetOlustur(input: {
  kategori: AdminSikayet["kategori"];
  baslik: string;
  aciklama: string;
}) {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Oturum bulunamadı.");
  const { error } = await supabase.from("sikayetler").insert({
    bildiren_id: authData.user.id,
    kategori: input.kategori,
    baslik: input.baslik,
    aciklama: input.aciklama,
  });
  if (error) throw error;
}
