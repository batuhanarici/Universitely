import { supabase } from "./supabase";
import type { GorevDosyasi, GorevDosyaTuru } from "../types/database";

const BUCKET = "gorev-dosyalari";
const MAX_DOSYA_BOYUTU = 25 * 1024 * 1024;
const DESTEKLENEN_TIPLER = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function guvenliDosyaAdi(ad: string) {
  const temiz = ad.replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ._() -]/g, "_").trim();
  return temiz.slice(-140) || "dosya";
}

function dosyaYolu(gorevId: string, tur: GorevDosyaTuru, kullaniciId: string, dosyaAdi: string) {
  const benzersiz = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `gorevler/${gorevId}/${tur}/${kullaniciId}/${benzersiz}-${guvenliDosyaAdi(dosyaAdi)}`;
}

function dosyaKontrol(file: File) {
  if (file.size <= 0 || file.size > MAX_DOSYA_BOYUTU) {
    throw new Error("Dosya 25 MB'dan küçük olmalıdır.");
  }
  if (file.type && !DESTEKLENEN_TIPLER.has(file.type)) {
    throw new Error("Bu dosya türü desteklenmiyor. PDF, görsel, Word, Excel veya metin dosyası yükleyebilirsin.");
  }
}

export async function gorevDosyalariniGetir(gorevId: string): Promise<GorevDosyasi[]> {
  const { data, error } = await supabase
    .from("gorev_dosyalari")
    .select("*")
    .eq("gorev_id", gorevId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function gorevDosyalariniTopluGetir(gorevIdleri: string[]): Promise<GorevDosyasi[]> {
  if (gorevIdleri.length === 0) return [];
  const { data, error } = await supabase
    .from("gorev_dosyalari")
    .select("*")
    .in("gorev_id", gorevIdleri)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function gorevDosyasiYukle(
  gorevId: string,
  ogrenciId: string,
  tur: GorevDosyaTuru,
  file: File
): Promise<GorevDosyasi> {
  dosyaKontrol(file);
  const { data: authData } = await supabase.auth.getUser();
  const kullanici = authData.user;
  if (!kullanici) throw new Error("Oturum bulunamadı.");

  const path = dosyaYolu(gorevId, tur, kullanici.id, file.name);
  const { error: yuklemeHatasi } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
  });
  if (yuklemeHatasi) throw yuklemeHatasi;

  const { data, error: kayitHatasi } = await supabase
    .from("gorev_dosyalari")
    .insert({
      gorev_id: gorevId,
      ogrenci_id: ogrenciId,
      yukleyen_id: kullanici.id,
      tur,
      dosya_adi: file.name,
      storage_path: path,
      mime_type: file.type || null,
      boyut: file.size,
    })
    .select()
    .single();

  if (kayitHatasi) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw kayitHatasi;
  }
  return data;
}

export async function gorevDosyasiImzaliUrl(path: string, saniye = 600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, saniye);
  if (error) throw error;
  return data.signedUrl;
}

export async function gorevDosyasiSil(dosya: GorevDosyasi) {
  const { error: kayitHatasi } = await supabase.from("gorev_dosyalari").delete().eq("id", dosya.id);
  if (kayitHatasi) throw kayitHatasi;
  await supabase.storage.from(BUCKET).remove([dosya.storage_path]);
}

export function dosyaBoyutuEtiketi(boyut: number | null) {
  if (!boyut) return "";
  if (boyut < 1024 * 1024) return `${Math.max(1, Math.round(boyut / 1024))} KB`;
  return `${(boyut / (1024 * 1024)).toFixed(1)} MB`;
}
