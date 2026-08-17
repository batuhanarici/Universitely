import { supabase } from "./supabase";
import type { Gorev, OkulDersProgrami } from "../types/database";

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

export interface OkulDersProgramiGirdisi {
  gun: number;
  baslangic: string;
  bitis: string;
  ders_adi: string;
}

async function aktifOgrenciId(ogrenciId?: string) {
  if (ogrenciId) return ogrenciId;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function okulDersPrograminiGetir(ogrenciId?: string): Promise<OkulDersProgrami[]> {
  const id = await aktifOgrenciId(ogrenciId);
  if (!id) return [];
  const { data, error } = await supabase
    .from("okul_ders_programlari")
    .select("*")
    .eq("ogrenci_id", id)
    .order("gun", { ascending: true })
    .order("baslangic", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function okulDersProgramiEkle(
  girdi: OkulDersProgramiGirdisi,
  ogrenciId?: string
): Promise<OkulDersProgrami> {
  const id = await aktifOgrenciId(ogrenciId);
  if (!id) throw new Error("Oturum bulunamadı.");
  const { data, error } = await supabase
    .from("okul_ders_programlari")
    .insert({ ...girdi, ogrenci_id: id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function okulDersProgramiSil(id: string) {
  const { error } = await supabase.from("okul_ders_programlari").delete().eq("id", id);
  if (error) throw error;
}
