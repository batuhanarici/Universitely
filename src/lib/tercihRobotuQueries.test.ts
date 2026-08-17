import { describe, expect, it } from "vitest";
import { riskHesapla, sayiyiBicimlendir } from "./tercihRobotuQueries";

describe("tercih robotu risk sınıflandırması", () => {
  it("aday sırası geçmiş kapanıştan belirgin biçimde iyiyse güvenli der", () => {
    expect(riskHesapla(80000, 100000)).toBe("guvenli");
  });

  it("aday sırası geçmiş kapanışa yakınsa dengeli der", () => {
    expect(riskHesapla(100000, 100000)).toBe("dengeli");
    expect(riskHesapla(110000, 100000)).toBe("dengeli");
  });

  it("aday sırası geçmiş kapanıştan gerideyse iddialı der", () => {
    expect(riskHesapla(150000, 100000)).toBe("iddiali");
  });

  it("sayıları Türkçe binlik ayraçla gösterir", () => {
    expect(sayiyiBicimlendir(125000)).toBe("125.000");
    expect(sayiyiBicimlendir(null)).toBe("—");
  });
});
