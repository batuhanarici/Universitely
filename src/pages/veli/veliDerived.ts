import { useMemo } from "react";
import { useVeliVeri } from "./VeliVeri";

export interface DenemeOzeti {
  deneme_id: string | null;
  ad: string;
  tarih: string;
  dogru: number;
  yanlis: number;
  net: number;
}

export interface DersBazli {
  ad: string;
  yuzde: number;
}

export interface Hatirlatma {
  ikon: string;
  baslik: string;
  detay: string;
  oncelik: "yuksek" | "normal";
}

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function sonGunIso(gun: number): string {
  const d = new Date();
  d.setDate(d.getDate() - gun);
  return d.toISOString().slice(0, 10);
}

export function useVeliDerived() {
  const { veri, sonuclar } = useVeliVeri();

  return useMemo(() => {
    const denemeler: DenemeOzeti[] = (() => {
      const map = new Map<string, { deneme_id: string; ad: string; tarih: string; dogru: number; yanlis: number }>();
      for (const s of sonuclar) {
        if (!map.has(s.deneme_id)) map.set(s.deneme_id, { deneme_id: s.deneme_id, ad: s.deneme_adi, tarih: s.tarih, dogru: 0, yanlis: 0 });
        const o = map.get(s.deneme_id)!;
        if (s.durum === "dogru") o.dogru++;
        else if (s.durum === "yanlis") o.yanlis++;
      }
      return Array.from(map.values())
        .map((o) => ({ ...o, net: Math.round((o.dogru - o.yanlis / 4) * 10) / 10 }))
        .sort((a, b) => a.tarih.localeCompare(b.tarih));
    })();

    const ort = denemeler.length === 0 ? null : denemeler.reduce((a, d) => a + d.net, 0) / denemeler.length;

    const dersler: DersBazli[] = (() => {
      const map = new Map<string, { dogru: number; toplam: number }>();
      for (const s of sonuclar) {
        if (!map.has(s.ders_adi)) map.set(s.ders_adi, { dogru: 0, toplam: 0 });
        const o = map.get(s.ders_adi)!;
        o.toplam++;
        if (s.durum === "dogru") o.dogru++;
      }
      return Array.from(map.entries())
        .map(([ad, d]) => ({ ad, yuzde: d.toplam === 0 ? 0 : Math.round((d.dogru / d.toplam) * 100) }))
        .sort((a, b) => a.yuzde - b.yuzde);
    })();

    const ozet = (() => {
      const bugun = bugunIso();
      const haftaSinir = sonGunIso(6);
      const aySinir = sonGunIso(29);

      const calismaAralik = (sinir: string) => veri.calismalar.filter((c) => c.tarih >= sinir && c.tarih <= bugun);

      const bugunC = veri.calismalar.filter((c) => c.tarih === bugun);
      const bugunSure = bugunC.reduce((a, c) => a + (c.sure_dk || 0), 0);
      const bugunSoru = bugunC.reduce((a, c) => a + (c.soru_sayisi || 0), 0);

      const hC = calismaAralik(haftaSinir);
      const haftaSure = hC.reduce((a, c) => a + (c.sure_dk || 0), 0);
      const haftaSoru = hC.reduce((a, c) => a + (c.soru_sayisi || 0), 0);
      const gorev7 = veri.gorevler.filter((g) => g.tarih >= haftaSinir && g.tarih <= bugun);
      const haftaGorevTam = gorev7.filter((g) => g.tamamlandi).length;
      const haftaGorevKalan = gorev7.length - haftaGorevTam;
      const haftaDeneme = new Set(sonuclar.filter((s) => s.tarih >= haftaSinir).map((s) => s.deneme_id)).size;

      const aC = calismaAralik(aySinir);
      const aySure = aC.reduce((a, c) => a + (c.sure_dk || 0), 0);
      const aySoru = aC.reduce((a, c) => a + (c.soru_sayisi || 0), 0);
      const ayDenemeAdlari = Array.from(new Set(sonuclar.filter((s) => s.tarih >= aySinir).map((s) => s.deneme_id)));
      const ayDenemeler = denemeler.filter((d) => ayDenemeAdlari.includes(d.deneme_id ?? ""));
      const ayOrt = ayDenemeler.length === 0 ? null : ayDenemeler.reduce((a, d) => a + d.net, 0) / ayDenemeler.length;

      const gorevToplam = haftaGorevTam + haftaGorevKalan;
      const haftaGorevYuzde = gorevToplam === 0 ? 0 : Math.round((haftaGorevTam / gorevToplam) * 100);

      return {
        bugunSure,
        bugunSoru,
        haftaSure,
        haftaSoru,
        haftaGorevTam,
        haftaGorevKalan,
        haftaGorevYuzde,
        haftaDeneme,
        aySure,
        aySoru,
        ayDenemeAdet: ayDenemeAdlari.length,
        ayOrt,
      };
    })();

    const son14Gun: { tarih: string; kisa: string; sure: number; soru: number }[] = (() => {
      const map = new Map<string, { sure: number; soru: number }>();
      for (const c of veri.calismalar) {
        const o = map.get(c.tarih) ?? { sure: 0, soru: 0 };
        o.sure += c.sure_dk || 0;
        o.soru += c.soru_sayisi || 0;
        map.set(c.tarih, o);
      }
      const arr: { tarih: string; kisa: string; sure: number; soru: number }[] = [];
      const bugun = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(bugun);
        d.setDate(bugun.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        const o = map.get(iso) ?? { sure: 0, soru: 0 };
        arr.push({ tarih: iso, kisa: iso.slice(8), sure: o.sure, soru: o.soru });
      }
      return arr;
    })();

    const konuIlerleme = (() => {
      const tamlanan = new Set(veri.konuIlerlemeleri.filter((k) => k.tamamlandi).map((k) => k.konu_id));
      const toplam = veri.konular.length;
      const biten = veri.konular.filter((k) => tamlanan.has(k.id)).length;
      return { toplam, biten, yuzde: toplam === 0 ? 0 : Math.round((biten / toplam) * 100) };
    })();

    const gelecekGorusmeler = veri.gorusmeler
      .filter((g) => g.durum !== "iptal" && new Date(g.tarih).getTime() >= Date.now())
      .sort((a, b) => a.tarih.localeCompare(b.tarih));

    const hatirlatmalar: Hatirlatma[] = (() => {
      const liste: Hatirlatma[] = [];
      const bugun = bugunIso();

      const bugunGorevler = veri.gorevler.filter((g) => g.tarih === bugun);
      if (bugunGorevler.length > 0) {
        const kalan = bugunGorevler.filter((g) => !g.tamamlandi);
        if (kalan.length === 0) {
          liste.push({ ikon: "🎉", baslik: "Program tamamlandı", detay: `Bugünün ${bugunGorevler.length} görevi tamamlandı.`, oncelik: "normal" });
        } else {
          liste.push({ ikon: "⏰", baslik: `${kalan.length} bugünkü program yapılmadı`, detay: kalan.map((g) => g.baslik).join(" · "), oncelik: "yuksek" });
        }
      }

      const son7 = new Set(sonuclar.filter((s) => s.tarih >= sonGunIso(7)).map((s) => s.deneme_id));
      if (son7.size > 0) {
        liste.push({ ikon: "📄", baslik: `${son7.size} deneme eklendi`, detay: "Son 7 günde yeni deneme sonucu yüklendi.", oncelik: "normal" });
      }

      const bugunkuTekrar = veri.tekrarPlanlari.filter((p) => p.plan_tarihi === bugun && !p.yapildi);
      if (bugunkuTekrar.length > 0) {
        liste.push({ ikon: "🔁", baslik: `${bugunkuTekrar.length} tekrar bugün sırada`, detay: bugunkuTekrar.map((p) => p.aciklama).join(" · "), oncelik: "normal" });
      }

      const cozulmemisKitap = veri.kitaplar.filter((k) => k.toplam > k.ilerleme).length;
      if (cozulmemisKitap > 0) {
        liste.push({ ikon: "📚", baslik: `${cozulmemisKitap} kaynak henüz bitmemiş`, detay: "Kitap/kaynak ilerlemeleri takip ediliyor.", oncelik: "normal" });
      }

      if (ozet.haftaSure === 0 && sonuclar.length > 0) {
        liste.push({ ikon: "💤", baslik: "Bu hafta çalışma kaydı yok", detay: "Çocuğun bu hafta hiç çalışma kaydı girmemiş.", oncelik: "yuksek" });
      }

      return liste;
    })();

    return { denemeler, ort, dersler, ozet, son14Gun, konuIlerleme, gelecekGorusmeler, hatirlatmalar };
  }, [veri, sonuclar]);
}
