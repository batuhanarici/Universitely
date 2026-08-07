import { supabase } from "./supabase";
import type { Bildirim } from "../types/database";
import { kendiTekrarHavuzunuGetir, kendiSonuclariniGetir } from "./ogrenciQueries";
import { gorevleriGetir } from "./gorevQueries";
import { tekrarPlanlariniGetir } from "./tekrarPlanQueries";
import { yanlislariGetir } from "./yanlisQueries";

// ── Okuma ────────────────────────────────────────────────────────────────────
export async function bildirimleriGetir(): Promise<Bildirim[]> {
  const { data, error } = await supabase
    .from("bildirimler")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

// ── Aksiyonlar ───────────────────────────────────────────────────────────────
export async function bildirimOkunduYap(id: string) {
  const { error } = await supabase.from("bildirimler").update({ okundu: true }).eq("id", id);
  if (error) throw error;
}

export async function bildirimArsivle(id: string) {
  const { error } = await supabase.from("bildirimler").update({ arsivlendi: true }).eq("id", id);
  if (error) throw error;
}

export async function bildirimSil(id: string) {
  const { error } = await supabase.from("bildirimler").delete().eq("id", id);
  if (error) throw error;
}

// ── Realtime ─────────────────────────────────────────────────────────────────
export function bildirimleriDinle(
  aliciId: string,
  onEkle: (b: Bildirim) => void,
  onGuncelle: (b: Bildirim) => void,
  kanalAdi = "bildirimler-realtime"
) {
  return supabase
    .channel(kanalAdi)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "bildirimler", filter: `alici_id=eq.${aliciId}` },
      (payload) => onEkle(payload.new as Bildirim)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "bildirimler", filter: `alici_id=eq.${aliciId}` },
      (payload) => onGuncelle(payload.new as Bildirim)
    )
    .subscribe();
}

// ── Sistem hatırlatmaları (öğrenci) ─────────────────────────────────────────
export interface SistemHatirlatmasi {
  baslik: string;
  detay: string;
  oncelik: "yuksek" | "normal";
  hedef: string;
}

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Mevcut öğrenci Bildirimler sayfasındaki hesaplanmış hatırlatmalar.
// Her öğe için kaynak anahtarı üretilir; aynı anahtar varsa tekrar eklenmez.
export async function ogrenciHatirlatmalariniHesapla(): Promise<SistemHatirlatmasi[]> {
  try {
    const [havuz, gorevler, planlar, yanlislar, sonuclar] = await Promise.all([
      kendiTekrarHavuzunuGetir(),
      gorevleriGetir(),
      tekrarPlanlariniGetir(),
      yanlislariGetir(),
      kendiSonuclariniGetir(),
    ]);
    const liste: SistemHatirlatmasi[] = [];
    const bugun = bugunIso();

    const kalanTekrar = havuz.filter((h) => !h.cozuldu).length;
    if (kalanTekrar > 0) {
      liste.push({ baslik: `${kalanTekrar} soru tekrar havuzunda`, detay: "Yanlış/boş bıraktığın soruları tekrar etmeyi unutma.", oncelik: "yuksek", hedef: "/student/repetition" });
    }

    const bugunBitmemis = gorevler.filter((g) => g.tarih === bugun && !g.tamamlandi);
    if (bugunBitmemis.length > 0) {
      liste.push({ baslik: `${bugunBitmemis.length} bugünkü görev tamamlanmamış`, detay: bugunBitmemis.map((g) => g.baslik).join(" · "), oncelik: "normal", hedef: "/student/tasks" });
    }

    const bugunkuTekrar = planlar.filter((p) => p.plan_tarihi === bugun && !p.yapildi);
    if (bugunkuTekrar.length > 0) {
      liste.push({ baslik: `${bugunkuTekrar.length} tekrar bugün sırada`, detay: bugunkuTekrar.map((p) => p.aciklama).join(" · "), oncelik: "yuksek", hedef: "/student/repetition" });
    }

    const cozulmemis = yanlislar.filter((y) => !y.cozuldu).length;
    if (cozulmemis > 0) {
      liste.push({ baslik: `${cozulmemis} çözülmemiş yanlış arşivde`, detay: "Yanlışlar sekmesinden tekrarına ekleyebilirsin.", oncelik: "normal", hedef: "/student/wrongs" });
    }

    const konuMap = new Map<string, { dogru: number; toplam: number }>();
    for (const s of sonuclar) {
      const m = konuMap.get(s.konu_adi) ?? { dogru: 0, toplam: 0 };
      m.toplam++;
      if (s.durum === "dogru") m.dogru++;
      konuMap.set(s.konu_adi, m);
    }
    const zayif = Array.from(konuMap.entries())
      .filter(([, v]) => v.toplam > 0 && (v.dogru / v.toplam) * 100 < 55)
      .map(([k]) => k);
    if (zayif.length > 0) {
      liste.push({ baslik: `${zayif.length} konuda performansın düşük`, detay: zayif.slice(0, 4).join(" · "), oncelik: "normal", hedef: "/student/subjects" });
    }

    return liste;
  } catch {
    return [];
  }
}

// Hesaplanmış hatırlatmaları DB'ye yazar (kaynak anahtarıyla tekrarı önler).
export async function sistemHatirlatmalariniSenkronla(hatirlatmalar: SistemHatirlatmasi[]) {
  if (hatirlatmalar.length === 0) return;
  const { data: authData } = await supabase.auth.getUser();
  const uid = authData.user?.id;
  if (!uid) return;

  const { data: mevcut } = await supabase
    .from("bildirimler")
    .select("kaynak")
    .eq("alici_id", uid)
    .not("kaynak", "is", null);
  const mevcutAnahtarlar = new Set((mevcut ?? []).map((r) => r.kaynak as string));

  const eklenecek = hatirlatmalar
    .map((h) => ({ ...h, kaynak: `hatirlatma:${h.baslik}` }))
    .filter((h) => !mevcutAnahtarlar.has(h.kaynak));

  if (eklenecek.length === 0) return;
  await supabase.from("bildirimler").insert(
    eklenecek.map((h) => ({
      alici_id: uid,
      tur: "hatirlatma",
      baslik: h.baslik,
      detay: h.detay,
      hedef: h.hedef,
      kaynak: h.kaynak,
    }))
  );
}
