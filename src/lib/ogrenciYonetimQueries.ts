import { supabase } from "./supabase";
import type { CalismaKaydi, Gorev, Kitap, OgrenciProfili, TekrarPlan, YanlisArsivi } from "../types/database";

export interface KocOgrencisi {
  id: string;
  ad_soyad: string;
  aktif: boolean;
  davet_kodu: string | null;
}

export interface OgrenciDetay {
  ad_soyad: string;
  profil: OgrenciProfili | null;
  calismalar: CalismaKaydi[];
  gorevler: Gorev[];
  kitaplar: Kitap[];
  yanlislar: YanlisArsivi[];
  planlar: TekrarPlan[];
  netler: { deneme_adi: string; tarih: string; dogru: number; yanlis: number; net: number }[];
}

const KOD_KARAKTERLER = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function kodUret(uzunluk = 6): string {
  let kod = "";
  for (let i = 0; i < uzunluk; i++) {
    kod += KOD_KARAKTERLER[Math.floor(Math.random() * KOD_KARAKTERLER.length)];
  }
  return kod;
}

export async function kocOgrencileri(): Promise<KocOgrencisi[]> {
  const { data, error } = await supabase.rpc("koc_ogrencileri");
  if (error) throw error;
  return data ?? [];
}

export async function davetKoduUret(ogrenciAdi: string): Promise<string> {
  const kod = kodUret();
  const { error } = await supabase
    .from("davet_kodlari")
    .insert({ kod, ogrenci_adi: ogrenciAdi });
  if (error) throw error;
  return kod;
}

export async function davetKodunuDogrula(kod: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("davet_kodunu_dogrula", { kod });
  if (error) throw error;
  return data != null;
}

export async function davetKodunuBagla(kod: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("davet_kodunu_bagla", { kod });
  if (error) throw error;
  return data ?? false;
}

export async function ogrenciAktifYap(ogrenciId: string, aktif: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc("ogrenci_aktif_yap", { ogrenci_id: ogrenciId, yeni_durum: aktif });
  if (error) throw error;
  return data ?? false;
}

export async function ogrenciDetayiGetir(ogrenciId: string): Promise<OgrenciDetay> {
  const [kocListesi, profil, calismalar, gorevler, kitaplar, yanlislar, planlar, sonuclar] = await Promise.all([
    kocOgrencileri(),
    supabase.from("ogrenci_profilleri").select("*").eq("ogrenci_id", ogrenciId).maybeSingle(),
    supabase.from("calisma_kayitlari").select("*").eq("ogrenci_id", ogrenciId).order("tarih", { ascending: false }),
    supabase.from("gorevler").select("*").eq("ogrenci_id", ogrenciId).order("tarih", { ascending: false }),
    supabase.from("kitaplar").select("*").eq("ogrenci_id", ogrenciId).order("bitis_hedefi", { ascending: true, nullsFirst: true }),
    supabase.from("yanlis_arsivi").select("*").eq("ogrenci_id", ogrenciId).order("eklenme_tarihi", { ascending: false }),
    supabase.from("tekrar_planlari").select("*").eq("ogrenci_id", ogrenciId).order("plan_tarihi", { ascending: true }),
    supabase.from("koc_sonuclari").select("deneme_id, deneme_adi, tarih, soru_no, durum").eq("ogrenci_id", ogrenciId),
  ]);

  const ad = kocListesi.find((k) => k.id === ogrenciId)?.ad_soyad ?? "Öğrenci";
  for (const r of [profil, calismalar, gorevler, kitaplar, yanlislar, planlar, sonuclar]) {
    if (r.error) throw r.error;
  }

  const netMap = new Map<string, { deneme_adi: string; tarih: string; dogru: number; yanlis: number }>();
  for (const s of sonuclar.data ?? []) {
    if (!netMap.has(s.deneme_id)) {
      netMap.set(s.deneme_id, { deneme_adi: s.deneme_adi, tarih: s.tarih, dogru: 0, yanlis: 0 });
    }
    const o = netMap.get(s.deneme_id)!;
    if (s.durum === "dogru") o.dogru++;
    else if (s.durum === "yanlis") o.yanlis++;
  }
  const netler = Array.from(netMap.values())
    .map((o) => ({ ...o, net: Math.round((o.dogru - o.yanlis / 4) * 10) / 10 }))
    .sort((a, b) => b.tarih.localeCompare(a.tarih));

  return {
    ad_soyad: ad,
    profil: profil.data ?? null,
    calismalar: calismalar.data ?? [],
    gorevler: gorevler.data ?? [],
    kitaplar: kitaplar.data ?? [],
    yanlislar: yanlislar.data ?? [],
    planlar: planlar.data ?? [],
    netler,
  };
}
