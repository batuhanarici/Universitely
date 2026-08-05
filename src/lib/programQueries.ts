import { supabase } from "./supabase";
import type { Gorev } from "../types/database";

export interface HaftalikGorevGirdisi {
  tarih: string;
  baslik: string;
}

export async function haftalikProgramGetir(ogrenciId: string, baslangic: string, bitis: string): Promise<Gorev[]> {
  const { data, error } = await supabase
    .from("gorevler")
    .select("*")
    .eq("ogrenci_id", ogrenciId)
    .eq("tip", "koc")
    .gte("tarih", baslangic)
    .lte("tarih", bitis)
    .order("tarih", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function haftalikProgramKaydet(ogrenciId: string, girdiler: HaftalikGorevGirdisi[]) {
  if (girdiler.length === 0) return;
  const kayitlar = girdiler.map((g) => ({
    ogrenci_id: ogrenciId,
    tarih: g.tarih,
    baslik: g.baslik,
    tip: "koc" as const,
  }));
  const { error } = await supabase.from("gorevler").insert(kayitlar);
  if (error) throw error;
}
