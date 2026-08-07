import type { BildirimTuru } from "../types/database";

export const TUR_ETIKET: Record<BildirimTuru, string> = {
  mesaj: "Mesaj",
  hatirlatma: "Hatırlatma",
  uyari: "Uyarı",
  toplu: "Toplu",
  talep: "Onay",
};

export const TUR_RENK: Record<BildirimTuru, string> = {
  mesaj: "#2A9D8F",
  hatirlatma: "#A07C20",
  uyari: "#C4503A",
  toplu: "#0F1B2D",
  talep: "#C4503A",
};

export function bildirimZamani(tarih: string): string {
  const d = new Date(tarih);
  const fark = Date.now() - d.getTime();
  if (fark < 60_000) return "az önce";
  if (fark < 3_600_000) return `${Math.floor(fark / 60_000)} dk önce`;
  if (fark < 86_400_000) return `${Math.floor(fark / 3_600_000)} sa önce`;
  return d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
