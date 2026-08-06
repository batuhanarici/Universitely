import { supabase } from "./supabase";
import { kocOgrencileri } from "./ogrenciYonetimQueries";
import type { KocAnalizVerisi } from "./aiMotoru";

export async function kocAnalizVerisiniGetir(): Promise<KocAnalizVerisi> {
  const [ogrenciler, sonuclar, calismalar, gorevler, kitaplar, yanlislar, planlar, profiller] = await Promise.all([
    kocOgrencileri(),
    supabase.from("koc_sonuclari").select("*"),
    supabase.from("calisma_kayitlari").select("*"),
    supabase.from("gorevler").select("*"),
    supabase.from("kitaplar").select("*"),
    supabase.from("yanlis_arsivi").select("*"),
    supabase.from("tekrar_planlari").select("*"),
    supabase.from("ogrenci_profilleri").select("*"),
  ]);

  for (const r of [sonuclar, calismalar, gorevler, kitaplar, yanlislar, planlar, profiller]) {
    if (r.error) throw r.error;
  }

  return {
    ogrenciler,
    sonuclar: sonuclar.data ?? [],
    calismalar: calismalar.data ?? [],
    gorevler: gorevler.data ?? [],
    kitaplar: kitaplar.data ?? [],
    yanlislar: yanlislar.data ?? [],
    planlar: planlar.data ?? [],
    profiller: profiller.data ?? [],
  };
}
