import { dersleriGetir, takipMaddeleriniGetir } from "./kocAraclariQueries";
import { gorevleriGetir } from "./gorevQueries";
import { tekrarPlanlariniGetir } from "./tekrarPlanQueries";
import { okulDersPrograminiGetir } from "./programQueries";
import { supabase } from "./supabase";
import type { CalismaBloku, OgrenciMusaitligi, Gorev, TakipMaddesi, TekrarPlan } from "../types/database";

export interface CalismaBlokuGirdisi {
  kaynak_turu: "gorev" | "takip" | "tekrar";
  kaynak_id: string;
  plan_tarihi: string;
  baslangic: string;
  bitis: string;
  baslik: string;
  neden: string;
  kilitli?: boolean;
}

export interface MusaitlikGirdisi {
  gun: number;
  baslangic: string;
  bitis: string;
  aktif: boolean;
}

export async function gununCalismaPlaniniGetir(tarih: string): Promise<CalismaBloku[]> {
  const { data, error } = await supabase
    .from("calisma_bloklari")
    .select("*")
    .eq("plan_tarihi", tarih)
    .order("baslangic", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CalismaBloku[];
}

export async function calismaBlokuEkle(girdi: CalismaBlokuGirdisi): Promise<CalismaBloku> {
  const { data, error } = await supabase.rpc("calisma_bloku_ekle", {
    p_kaynak_turu: girdi.kaynak_turu,
    p_kaynak_id: girdi.kaynak_id,
    p_plan_tarihi: girdi.plan_tarihi,
    p_baslangic: girdi.baslangic,
    p_bitis: girdi.bitis,
    p_baslik: girdi.baslik,
    p_neden: girdi.neden,
    p_kilitli: girdi.kilitli ?? false,
  });
  if (error) throw error;
  return data as CalismaBloku;
}

export async function calismaBlokuDurumGuncelle(
  id: string,
  durum: CalismaBloku["durum"],
  yeniTarih?: string,
  yeniBaslangic?: string,
  yeniBitis?: string,
): Promise<CalismaBloku> {
  const { data, error } = await supabase.rpc("calisma_bloku_durum_guncelle", {
    p_blok_id: id,
    p_durum: durum,
    p_yeni_tarih: yeniTarih ?? null,
    p_yeni_baslangic: yeniBaslangic ?? null,
    p_yeni_bitis: yeniBitis ?? null,
  });
  if (error) throw error;
  return data as CalismaBloku;
}

export async function calismaBlokuKilitle(id: string, kilitli: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc("calisma_bloku_kilitle", { p_blok_id: id, p_kilitli: kilitli });
  if (error) throw error;
  return data === true;
}

export async function musaitlikGetir(): Promise<OgrenciMusaitligi[]> {
  const { data, error } = await supabase
    .from("ogrenci_musaitlikleri")
    .select("*")
    .order("gun", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OgrenciMusaitligi[];
}

export async function musaitlikKaydet(girdi: MusaitlikGirdisi): Promise<OgrenciMusaitligi> {
  const { data, error } = await supabase
    .from("ogrenci_musaitlikleri")
    .upsert(
      {
        gun: girdi.gun,
        baslangic: girdi.baslangic,
        bitis: girdi.bitis,
        aktif: girdi.aktif,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ogrenci_id,gun" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as OgrenciMusaitligi;
}

function gunNumarasi(tarih: string) {
  const gun = new Date(`${tarih}T12:00:00`).getDay();
  return gun === 0 ? 7 : gun;
}

function dakikayaCevir(saat: string) {
  const [saatParcasi, dakikaParcasi] = saat.slice(0, 5).split(":").map(Number);
  return saatParcasi * 60 + dakikaParcasi;
}

function saateCevir(dakika: number) {
  const sinirli = Math.max(0, Math.min(23 * 60 + 59, dakika));
  return `${String(Math.floor(sinirli / 60)).padStart(2, "0")}:${String(sinirli % 60).padStart(2, "0")}`;
}

function yerelTarih(tarih: string) {
  const d = new Date(tarih);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function adayOnceligi(takip: TakipMaddesi) {
  const oncelik = takip.oncelik === "yuksek" ? 30 : takip.oncelik === "orta" ? 20 : 10;
  const gecikme = takip.son_tarih <= new Date().toISOString().slice(0, 10) ? 20 : 0;
  return oncelik + gecikme;
}

function gorevOnceligi(gorev: Gorev) {
  return gorev.tip === "koc" ? 35 : gorev.tip === "haftalik" ? 20 : 10;
}

function sonrakiBosAralik(
  baslangic: number,
  sure: number,
  musaitBaslangic: number,
  musaitBitis: number,
  dolu: Array<{ baslangic: number; bitis: number }>,
) {
  let aday = Math.max(baslangic, musaitBaslangic);
  while (aday + sure <= musaitBitis) {
    const cakisan = dolu.find((aralik) => aday < aralik.bitis && aday + sure > aralik.baslangic);
    if (!cakisan) return aday;
    aday = cakisan.bitis + 10;
  }
  return null;
}

export async function gunlukPlanOlustur(tarih: string): Promise<CalismaBloku[]> {
  const [mevcutBloklar, gorevler, takipler, tekrarlar, dersler, okulDersleri, musaitlikler] = await Promise.all([
    gununCalismaPlaniniGetir(tarih),
    gorevleriGetir(),
    takipMaddeleriniGetir(),
    tekrarPlanlariniGetir(),
    dersleriGetir(),
    okulDersPrograminiGetir(),
    musaitlikGetir(),
  ]);

  const gun = gunNumarasi(tarih);
  const musaitlik = musaitlikler.find((kayit) => kayit.gun === gun && kayit.aktif);
  const musaitBaslangic = dakikayaCevir(musaitlik?.baslangic ?? "09:00");
  const musaitBitis = dakikayaCevir(musaitlik?.bitis ?? "22:00");
  const dolu: Array<{ baslangic: number; bitis: number }> = [];

  for (const okul of okulDersleri.filter((kayit) => kayit.gun === gun)) {
    dolu.push({ baslangic: dakikayaCevir(okul.baslangic), bitis: dakikayaCevir(okul.bitis) });
  }
  for (const ders of dersler.filter((kayit) => kayit.tur === "ders" && yerelTarih(kayit.tarih) === tarih)) {
    const baslangic = new Date(ders.tarih).getHours() * 60 + new Date(ders.tarih).getMinutes();
    dolu.push({ baslangic, bitis: baslangic + 60 });
  }
  for (const blok of mevcutBloklar.filter((kayit) => kayit.durum !== "iptal" && kayit.durum !== "ertelendi")) {
    const baslangic = dakikayaCevir(blok.baslangic);
    const bitis = dakikayaCevir(blok.bitis);
    dolu.push({ baslangic, bitis });
  }

  const mevcutKaynaklar = new Set(
    mevcutBloklar
      .filter((blok) => blok.durum !== "iptal")
      .map((blok) => blok.gorev_id ?? blok.takip_maddesi_id ?? blok.tekrar_plan_id)
      .filter((id): id is string => Boolean(id)),
  );

  const adaylar: Array<{ kaynakTuru: "gorev" | "takip" | "tekrar"; kaynakId: string; baslik: string; neden: string; sure: number; puan: number; kilitli: boolean }> = [];
  for (const takip of takipler.filter((kayit) => kayit.durum !== "tamamlandi" && kayit.son_tarih <= tarih && !mevcutKaynaklar.has(kayit.id))) {
    adaylar.push({
      kaynakTuru: "takip",
      kaynakId: takip.id,
      baslik: takip.baslik,
      neden: `Seans takip maddesi · ${takip.oncelik === "yuksek" ? "yüksek öncelik" : "son tarihi yakın"}`,
      sure: 30,
      puan: adayOnceligi(takip) + 50,
      kilitli: false,
    });
  }
  for (const gorev of gorevler.filter((kayit) => kayit.tarih === tarih && !kayit.tamamlandi && !mevcutKaynaklar.has(kayit.id))) {
    adaylar.push({
      kaynakTuru: "gorev",
      kaynakId: gorev.id,
      baslik: gorev.baslik,
      neden: `${gorev.tip === "koc" ? "Koç görevi" : "Bugünün görevi"} · son tarih bugün`,
      sure: 45,
      puan: gorevOnceligi(gorev),
      kilitli: false,
    });
  }
  for (const tekrar of tekrarlar.filter((kayit) => kayit.plan_tarihi === tarih && !kayit.yapildi && !mevcutKaynaklar.has(kayit.id))) {
    adaylar.push({
      kaynakTuru: "tekrar",
      kaynakId: tekrar.id,
      baslik: `Tekrar: ${tekrar.aciklama}`,
      neden: "Bugün yapılması gereken tekrar planı",
      sure: 25,
      puan: 15,
      kilitli: false,
    });
  }

  adaylar.sort((a, b) => b.puan - a.puan || a.baslik.localeCompare(b.baslik, "tr"));
  const olusan: CalismaBloku[] = [...mevcutBloklar];
  let aramaBaslangici = musaitBaslangic;

  for (const aday of adaylar) {
    const baslangic = sonrakiBosAralik(aramaBaslangici, aday.sure, musaitBaslangic, musaitBitis, dolu);
    if (baslangic === null) break;
    const bitis = baslangic + aday.sure;
    try {
      const blok = await calismaBlokuEkle({
        kaynak_turu: aday.kaynakTuru,
        kaynak_id: aday.kaynakId,
        plan_tarihi: tarih,
        baslangic: saateCevir(baslangic),
        bitis: saateCevir(bitis),
        baslik: aday.baslik,
        neden: aday.neden,
        kilitli: aday.kilitli,
      });
      olusan.push(blok);
      dolu.push({ baslangic, bitis });
      aramaBaslangici = bitis + 10;
    } catch {
      // Aynı kaynak için başka bir blok varsa veya zaman aralığı yarışta dolduysa devam et.
    }
  }

  return olusan.sort((a, b) => a.baslangic.localeCompare(b.baslangic));
}

export function blokSuresiDakika(blok: CalismaBloku) {
  return Math.max(0, dakikayaCevir(blok.bitis) - dakikayaCevir(blok.baslangic));
}

export function blokSaatiniKaydir(blok: CalismaBloku, dakika: number) {
  const baslangic = dakikayaCevir(blok.baslangic);
  const bitis = dakikayaCevir(blok.bitis);
  const yeniBitis = Math.max(baslangic + 15, bitis + dakika);
  return { baslangic: saateCevir(baslangic), bitis: saateCevir(yeniBitis) };
}

export function planKaynakEtiketi(blok: CalismaBloku, gorevler: Gorev[], takipler: TakipMaddesi[], tekrarlar: TekrarPlan[]) {
  if (blok.takip_maddesi_id) return takipler.find((takip) => takip.id === blok.takip_maddesi_id)?.baslik ?? "Seans takip maddesi";
  if (blok.gorev_id) return gorevler.find((gorev) => gorev.id === blok.gorev_id)?.baslik ?? "Görev";
  if (blok.tekrar_plan_id) return tekrarlar.find((tekrar) => tekrar.id === blok.tekrar_plan_id)?.aciklama ?? "Tekrar";
  return blok.baslik;
}
