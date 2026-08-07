import { supabase } from "./supabase";
import type { HesapSilmeTalebi } from "../types/database";
import { profiliKaydet } from "./profilQueries";
import { veliProfilKaydet, veliSonuclari, veliCocukVerisiniGetir, velininKocu } from "./veliQueries";
import { ogretmenProfilKaydet } from "./ogretmenProfilQueries";
import { calismalariGetir } from "./calismaQueries";
import { gorevleriGetir } from "./gorevQueries";
import { tekrarPlanlariniGetir } from "./tekrarPlanQueries";
import { yanlislariGetir } from "./yanlisQueries";
import { kitaplariGetir } from "./kaynakQueries";
import { kendiSonuclariniGetir, kendiTekrarHavuzunuGetir } from "./ogrenciQueries";
import { ogrencileriGetir } from "./sonucQueries";
import { kocVelileriniGetir } from "./kocAraclariQueries";

type Rol = "ogrenci" | "ogretmen" | "veli";

async function rolGetir(): Promise<Rol | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.user_metadata?.rol === "veli") return "veli";
  const { data } = await supabase.from("ogrenciler").select("id").eq("id", user.id).maybeSingle();
  return data ? "ogrenci" : "ogretmen";
}

// ── Bildirim tercihi ────────────────────────────────────────────────────────
export async function emailBildirimGetir(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const rol = await rolGetir();
  if (rol === "ogrenci") {
    const { data } = await supabase.from("ogrenci_profilleri").select("email_bildirim").eq("ogrenci_id", user.id).maybeSingle();
    return data?.email_bildirim ?? false;
  }
  if (rol === "veli") {
    const { data } = await supabase.from("veliler").select("email_bildirim").eq("id", user.id).maybeSingle();
    return data?.email_bildirim ?? false;
  }
  const { data } = await supabase.from("ogretmen_profilleri").select("email_bildirim").eq("ogretmen_id", user.id).maybeSingle();
  return data?.email_bildirim ?? false;
}

export async function emailBildirimKaydet(v: boolean): Promise<void> {
  const rol = await rolGetir();
  if (rol === "ogrenci") {
    await profiliKaydet({ email_bildirim: v });
  } else if (rol === "veli") {
    await veliProfilKaydet({ email_bildirim: v });
  } else if (rol === "ogretmen") {
    await ogretmenProfilKaydet({ email_bildirim: v });
  }
}

// ── Veri indirme ────────────────────────────────────────────────────────────
export async function verileriTopla(): Promise<Record<string, unknown>> {
  const rol = await rolGetir();
  const disaAktarimTarihi = new Date().toISOString();

  if (rol === "ogrenci") {
    const [calismalar, gorevler, tekrarPlanlari, yanlislar, kitaplar, sonuclar, tekrarHavuzu] = await Promise.all([
      calismalariGetir(),
      gorevleriGetir(),
      tekrarPlanlariniGetir(),
      yanlislariGetir(),
      kitaplariGetir(),
      kendiSonuclariniGetir(),
      kendiTekrarHavuzunuGetir(),
    ]);
    return { rol, disaAktarimTarihi, calismalar, gorevler, tekrarPlanlari, yanlislar, kitaplar, sonuclar, tekrarHavuzu };
  }

  if (rol === "veli") {
    const [sonuclar, cocuk, kocId] = await Promise.all([
      veliSonuclari(),
      veliCocukVerisiniGetir(),
      velininKocu(),
    ]);
    return { rol, disaAktarimTarihi, kocId, cocuk, sonuclar };
  }

  const [ogrenciler, veliler] = await Promise.all([ogrencileriGetir(), kocVelileriniGetir()]);
  return { rol, disaAktarimTarihi, ogrenciler, veliler };
}

export function jsonIndir(ad: string, veri: unknown) {
  const blob = new Blob([JSON.stringify(veri, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ad}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Hesap silme ─────────────────────────────────────────────────────────────
export async function kendiTalepDurumum(): Promise<HesapSilmeTalebi | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("hesap_silme_talepleri")
    .select("*")
    .eq("kullanici_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);
  return (data?.[0] as HesapSilmeTalebi | undefined) ?? null;
}

export async function talepOlustur(): Promise<string | null> {
  const { data, error } = await supabase.rpc("talep_olustur");
  if (error) throw error;
  return data;
}

// Koç: öğrencinin bekleyen talebi
export async function ogrenciTalepGetir(ogrenciId: string): Promise<HesapSilmeTalebi | null> {
  const { data } = await supabase
    .from("hesap_silme_talepleri")
    .select("*")
    .eq("kullanici_id", ogrenciId)
    .eq("durum", "bekliyor")
    .order("created_at", { ascending: false })
    .limit(1);
  return (data?.[0] as HesapSilmeTalebi | undefined) ?? null;
}

export async function talepKarar(talepId: string, onay: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc("talep_karar", { talep_id: talepId, onay });
  if (error) throw error;
  return data ?? false;
}

export async function hesapSil(girdi: {
  tur: string;
  hedef_id?: string;
  talep_id?: string;
  onay_email: string;
}): Promise<void> {
  const sonuc = await supabase.functions.invoke("hesap-silme", { body: girdi });
  if (sonuc.error) {
    const detay = sonuc.error as { context?: Response; message?: string };
    let mesaj = "Silme işlemi başarısız oldu.";
    try {
      const res = detay.context;
      if (res && typeof (res as Response).json === "function") {
        const json = (await (res as Response).json()) as Record<string, unknown>;
        mesaj =
          (json?.hata as string) ??
          (json?.message as string) ??
          (json?.msg as string) ??
          `Silme işlemi başarısız oldu. (${(res as Response).status})`;
      } else if (detay.message) {
        mesaj = detay.message;
      }
    } catch {
      // mesaj varsayılan kalır
    }
    throw new Error(mesaj);
  }
}
