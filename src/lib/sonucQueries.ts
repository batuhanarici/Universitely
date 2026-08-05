import { supabase } from "./supabase";
import type { Ogrenci, SoruDurumu } from "../types/database";

export async function ogrencileriGetir(): Promise<Ogrenci[]> {
  const { data, error } = await supabase.rpc("koc_ogrencileri");
  if (error) throw error;
  return (data ?? []).map((o: any) => ({ id: o.id, ad_soyad: o.ad_soyad }));
}

export interface SablonSorusuDetayli {
  soru_no: number;
  konu_id: string | null;
  konu_ad: string;
}

export async function sablonSorulariniGetir(sablonId: string): Promise<SablonSorusuDetayli[]> {
  const { data, error } = await supabase
    .from("sablon_sorulari")
    .select("soru_no, konu_id, konular(ad)")
    .eq("sablon_id", sablonId)
    .order("soru_no");
  if (error) throw error;
  return (data ?? []).map((s: any) => ({
    soru_no: s.soru_no,
    konu_id: s.konu_id,
    konu_ad: s.konular?.ad ?? "—",
  }));
}

export async function denemeSonucuVarMi(denemeId: string, ogrenciId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("sonuclar")
    .select("*", { count: "exact", head: true })
    .eq("deneme_id", denemeId)
    .eq("ogrenci_id", ogrenciId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function sonucGirisiKaydet(
  denemeId: string,
  ogrenciId: string,
  sonuclar: { soru_no: number; durum: SoruDurumu }[]
) {
  const kayitlar = sonuclar.map((s) => ({
    deneme_id: denemeId,
    ogrenci_id: ogrenciId,
    soru_no: s.soru_no,
    durum: s.durum,
  }));

  const { data, error } = await supabase.from("sonuclar").insert(kayitlar).select("id, durum");
  if (error) throw error;

  const tekrarGerekenler = (data ?? [])
    .filter((s) => s.durum === "yanlis" || s.durum === "bos")
    .map((s) => ({ sonuc_id: s.id, cozuldu: false }));

  if (tekrarGerekenler.length > 0) {
    const { error: tekrarHata } = await supabase.from("tekrar_durumu").insert(tekrarGerekenler);
    if (tekrarHata) throw tekrarHata;
  }
}
