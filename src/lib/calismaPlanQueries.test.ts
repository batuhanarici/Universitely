import { describe, expect, it } from "vitest";
import { blokSaatiniKaydir, blokSuresiDakika } from "./calismaPlanQueries";
import type { CalismaBloku } from "../types/database";

const blok: CalismaBloku = {
  id: "blok-1",
  ogrenci_id: "ogrenci-1",
  gorev_id: "gorev-1",
  takip_maddesi_id: null,
  tekrar_plan_id: null,
  plan_tarihi: "2026-08-17",
  baslangic: "10:00:00",
  bitis: "10:45:00",
  baslik: "Matematik görevi",
  neden: "Bugünün görevi",
  durum: "planlandi",
  kilitli: false,
  erteleme_sayisi: 0,
  created_at: "2026-08-17T00:00:00Z",
  updated_at: "2026-08-17T00:00:00Z",
};

describe("calismaPlanQueries", () => {
  it("çalışma bloğu süresini dakika olarak hesaplar", () => {
    expect(blokSuresiDakika(blok)).toBe(45);
  });

  it("çalışma bloğunun süresini uzatırken başlangıç saatini korur", () => {
    expect(blokSaatiniKaydir(blok, 15)).toEqual({ baslangic: "10:00", bitis: "11:00" });
  });

  it("çalışma bloğunu kısaltırken minimum on beş dakikayı korur", () => {
    expect(blokSaatiniKaydir({ ...blok, bitis: "10:20:00" }, -15)).toEqual({ baslangic: "10:00", bitis: "10:15" });
    expect(blokSaatiniKaydir({ ...blok, bitis: "10:10:00" }, -30)).toEqual({ baslangic: "10:00", bitis: "10:15" });
  });
});
