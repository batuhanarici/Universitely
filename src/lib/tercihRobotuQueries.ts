export type TercihPuanTuru = "TYT" | "SAY" | "SÖZ" | "EA" | "DİL";
export type TercihRisk = "guvenli" | "dengeli" | "iddiali";

export interface TercihProgrami {
  kod: string;
  ad: string;
  universite: string | null;
  universiteTuru: "devlet" | "vakif" | null;
  tur: "lisans" | "onlisans";
  sure: number;
  puanTuru: TercihPuanTuru;
  kontenjan: number | null;
  gecmisBasariSirasi: number | null;
  gecmisEnKucukPuan: number | null;
  kaynakYil: number;
  gecmisVeriYili: number;
}

interface KatalogCevabi {
  source: string;
  sourceUrl: string;
  generatedAt: string;
  programlar: TercihProgrami[];
}

let katalogPromise: Promise<KatalogCevabi> | null = null;

export function tercihKatalogunuGetir(): Promise<KatalogCevabi> {
  if (!katalogPromise) {
    katalogPromise = fetch("/data/yks-2026-programlari.json")
      .then(async (response) => {
        if (!response.ok) throw new Error("Tercih kataloğu yüklenemedi.");
        return await response.json() as KatalogCevabi;
      })
      .catch((error) => {
        katalogPromise = null;
        throw error;
      });
  }
  return katalogPromise;
}

export function riskHesapla(adaySirasi: number, gecmisSirasi: number): TercihRisk {
  const oran = adaySirasi / gecmisSirasi;
  if (oran <= 0.8) return "guvenli";
  if (oran <= 1.1) return "dengeli";
  return "iddiali";
}

export function riskEtiketi(risk: TercihRisk) {
  if (risk === "guvenli") return "Daha güvenli";
  if (risk === "dengeli") return "Dengeli";
  return "İddialı";
}

export function riskRengi(risk: TercihRisk) {
  if (risk === "guvenli") return "#2A9D8F";
  if (risk === "dengeli") return "#B17A1A";
  return "#C4503A";
}

export function sayiyiBicimlendir(value: number | null) {
  return value == null ? "—" : new Intl.NumberFormat("tr-TR").format(value);
}

export function puaniBicimlendir(value: number | null) {
  return value == null ? "—" : value.toLocaleString("tr-TR", { minimumFractionDigits: 5, maximumFractionDigits: 5 });
}
