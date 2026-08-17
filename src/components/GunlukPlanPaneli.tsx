import { useEffect, useMemo, useState } from "react";
import {
  blokSaatiniKaydir,
  blokSuresiDakika,
  calismaBlokuDurumGuncelle,
  gunlukPlanOlustur,
  gununCalismaPlaniniGetir,
  musaitlikGetir,
  musaitlikKaydet,
  type MusaitlikGirdisi,
} from "../lib/calismaPlanQueries";
import { dersleriGetir, takipMaddeleriniGetir, takipMaddesiDurumGuncelle } from "../lib/kocAraclariQueries";
import { gorevleriGetir, gorevTamamla } from "../lib/gorevQueries";
import { okulDersPrograminiGetir } from "../lib/programQueries";
import { tekrarPlanlariniGetir, tekrarPlanYapildi } from "../lib/tekrarPlanQueries";
import type { CalismaBloku, Gorev, Gorusme, OgrenciMusaitligi, TakipMaddesi, TekrarPlan } from "../types/database";
import { Badge, Btn, Card, FormGroup, Input, Label, ProgressBar, useToast } from "./ui";

function bugunIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function tarihEkle(tarih: string, gun: number) {
  const d = new Date(`${tarih}T12:00:00`);
  d.setDate(d.getDate() + gun);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function gunNumarasi(tarih: string) {
  const gun = new Date(`${tarih}T12:00:00`).getDay();
  return gun === 0 ? 7 : gun;
}

function yerelTarih(tarih: string) {
  const d = new Date(tarih);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function saat(tarih: string) {
  return new Date(tarih).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function gunEtiketi(tarih: string) {
  return new Date(`${tarih}T12:00:00`).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
}

type KaynakVerisi = {
  gorevler: Gorev[];
  takipler: TakipMaddesi[];
  tekrarlar: TekrarPlan[];
  dersler: Gorusme[];
  okulDersleri: Array<{ id: string; gun: number; baslangic: string; bitis: string; ders_adi: string }>;
  musaitlikler: OgrenciMusaitligi[];
};

export function GunlukPlanPaneli() {
  const { toast, show } = useToast();
  const [tarih, setTarih] = useState(bugunIso);
  const [bloklar, setBloklar] = useState<CalismaBloku[]>([]);
  const [kaynak, setKaynak] = useState<KaynakVerisi>({ gorevler: [], takipler: [], tekrarlar: [], dersler: [], okulDersleri: [], musaitlikler: [] });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [planOlusturuluyor, setPlanOlusturuluyor] = useState(false);
  const [islemId, setIslemId] = useState<string | null>(null);
  const [musaitlikAcik, setMusaitlikAcik] = useState(false);
  const [musaitlikBaslangic, setMusaitlikBaslangic] = useState("09:00");
  const [musaitlikBitis, setMusaitlikBitis] = useState("22:00");
  const [musaitlikKaydediliyor, setMusaitlikKaydediliyor] = useState(false);

  async function verileriYukle(guncelTarih = tarih) {
    setYukleniyor(true);
    try {
      const [b, gorevler, takipler, tekrarlar, dersler, okulDersleri, musaitlikler] = await Promise.all([
        gununCalismaPlaniniGetir(guncelTarih),
        gorevleriGetir(),
        takipMaddeleriniGetir(),
        tekrarPlanlariniGetir(),
        dersleriGetir(),
        okulDersPrograminiGetir(),
        musaitlikGetir(),
      ]);
      setBloklar(b);
      setKaynak({ gorevler, takipler, tekrarlar, dersler, okulDersleri, musaitlikler });
      const mevcut = musaitlikler.find((kayit) => kayit.gun === gunNumarasi(guncelTarih));
      setMusaitlikBaslangic(mevcut?.baslangic.slice(0, 5) ?? "09:00");
      setMusaitlikBitis(mevcut?.bitis.slice(0, 5) ?? "22:00");
    } catch {
      show("Günlük plan verileri yüklenemedi.");
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    void verileriYukle();
  }, [tarih]);

  const bugunDersleri = useMemo(() => kaynak.dersler.filter((ders) => ders.tur === "ders" && yerelTarih(ders.tarih) === tarih), [kaynak.dersler, tarih]);
  const bugunOkulDersleri = useMemo(() => kaynak.okulDersleri.filter((ders) => ders.gun === gunNumarasi(tarih)), [kaynak.okulDersleri, tarih]);
  const tamamlanan = bloklar.filter((blok) => blok.durum === "tamamlandi").length;
  const planlanan = bloklar.filter((blok) => blok.durum === "planlandi").length;

  async function planOlustur() {
    setPlanOlusturuluyor(true);
    try {
      const yeniBloklar = await gunlukPlanOlustur(tarih);
      setBloklar(yeniBloklar);
      show(yeniBloklar.length > 0 ? "Bugünün planı kaynaklara göre oluşturuldu." : "Bugün için uygun bir çalışma bloğu bulunamadı.");
    } catch {
      show("Günlük plan oluşturulamadı.");
    } finally {
      setPlanOlusturuluyor(false);
    }
  }

  async function blokTamamla(blok: CalismaBloku) {
    setIslemId(blok.id);
    try {
      const durum = blok.durum === "tamamlandi" ? "planlandi" : "tamamlandi";
      const guncel = await calismaBlokuDurumGuncelle(blok.id, durum);
      setBloklar((liste) => liste.map((x) => (x.id === blok.id ? guncel : x)));
      if (durum === "tamamlandi") {
        if (blok.gorev_id) await gorevTamamla(blok.gorev_id, true);
        if (blok.tekrar_plan_id) await tekrarPlanYapildi(blok.tekrar_plan_id, true);
        if (blok.takip_maddesi_id) await takipMaddesiDurumGuncelle(blok.takip_maddesi_id, "tamamlandi");
      } else if (blok.gorev_id) {
        await gorevTamamla(blok.gorev_id, false);
      }
      show(durum === "tamamlandi" ? "Çalışma bloğu tamamlandı." : "Çalışma bloğu yeniden açıldı.");
      await verileriYukle();
    } catch {
      show("Çalışma bloğu güncellenemedi.");
    } finally {
      setIslemId(null);
    }
  }

  async function blokErtele(blok: CalismaBloku) {
    setIslemId(blok.id);
    try {
      const yeniTarih = tarihEkle(blok.plan_tarihi, 1);
      const yeni = await calismaBlokuDurumGuncelle(blok.id, "ertelendi", yeniTarih, blok.baslangic, blok.bitis);
      setBloklar((liste) => liste.filter((x) => x.id !== blok.id).concat(yeni.plan_tarihi === tarih ? yeni : []));
      show(`Blok ${new Date(`${yeniTarih}T12:00:00`).toLocaleDateString("tr-TR")} için yeniden önerildi.`);
    } catch {
      show("Blok ertelenemedi. Yeni günün müsaitliğini kontrol et.");
    } finally {
      setIslemId(null);
    }
  }

  async function sureyiDegistir(blok: CalismaBloku, dakika: number) {
    setIslemId(blok.id);
    try {
      const yeniSaat = blokSaatiniKaydir(blok, dakika);
      const guncel = await calismaBlokuDurumGuncelle(blok.id, "planlandi", blok.plan_tarihi, yeniSaat.baslangic, yeniSaat.bitis);
      setBloklar((liste) => liste.map((x) => (x.id === blok.id ? guncel : x)));
    } catch {
      show("Süre değiştirilemedi; çalışma saati başka bir blokla çakışıyor olabilir.");
    } finally {
      setIslemId(null);
    }
  }

  async function musaitlikKaydetClick(e: React.FormEvent) {
    e.preventDefault();
    const girdi: MusaitlikGirdisi = { gun: gunNumarasi(tarih), baslangic: musaitlikBaslangic, bitis: musaitlikBitis, aktif: true };
    setMusaitlikKaydediliyor(true);
    try {
      const kayit = await musaitlikKaydet(girdi);
      setKaynak((mevcut) => ({ ...mevcut, musaitlikler: [...mevcut.musaitlikler.filter((x) => x.gun !== kayit.gun), kayit] }));
      show("Müsaitlik aralığın kaydedildi.");
    } catch {
      show("Müsaitlik aralığı kaydedilemedi.");
    } finally {
      setMusaitlikKaydediliyor(false);
    }
  }

  if (yukleniyor) return <Card><p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Bugünün planı hazırlanıyor…</p></Card>;

  return (
    <Card className="tape-accent">
      {toast}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <h2 className="section-title" style={{ fontSize: 18, marginBottom: 4 }}>Bugünün planı</h2>
          <p style={{ color: "rgba(15,27,45,0.52)", fontSize: 13 }}>{gunEtiketi(tarih)} · Plan sırası, son tarih ve önceliğe göre açıklanır.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ width: 145 }} />
          <Btn variant="primary" size="sm" disabled={planOlusturuluyor} onClick={() => void planOlustur()}>{planOlusturuluyor ? "Hazırlanıyor…" : "Planı oluştur"}</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 15 }}>
        <Badge variant={planlanan > 0 ? "gold" : "gray"}>{tamamlanan}/{bloklar.length} blok tamamlandı</Badge>
        <ProgressBar pct={bloklar.length === 0 ? 0 : Math.round((tamamlanan / bloklar.length) * 100)} color="#2A9D8F" />
      </div>

      {bloklar.length === 0 ? (
        <div style={{ padding: "16px 14px", borderRadius: 8, background: "rgba(22,40,63,0.04)", color: "rgba(15,27,45,0.58)", fontSize: 13 }}>
          Plan oluşturduğunda bugünkü görev, takip maddesi ve tekrar kayıtları uygun müsaitlik aralıklarına yerleştirilecek.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {bloklar.map((blok) => (
            <div key={blok.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 11px", borderRadius: 8, background: blok.durum === "tamamlandi" ? "rgba(42,157,143,0.07)" : "rgba(228,187,96,0.08)", border: "1px solid rgba(22,40,63,0.08)" }}>
              <div style={{ minWidth: 62, fontSize: 12, fontWeight: 750, color: blok.durum === "tamamlandi" ? "#2A9D8F" : "#A07C20" }}>{blok.baslangic.slice(0, 5)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 13, textDecoration: blok.durum === "tamamlandi" ? "line-through" : "none", color: blok.durum === "tamamlandi" ? "rgba(15,27,45,0.38)" : "#16283F" }}>{blok.baslik}</strong>
                  <Badge variant={blok.durum === "tamamlandi" ? "teal" : blok.durum === "ertelendi" ? "gray" : "gold"}>{blokSuresiDakika(blok)} dk</Badge>
                  {blok.kilitli && <Badge variant="ink">Koçun önerisi</Badge>}
                </div>
                <p style={{ fontSize: 11, lineHeight: 1.4, color: "rgba(15,27,45,0.52)", margin: "4px 0 0" }}>Neden şimdi? {blok.neden}</p>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {blok.durum !== "tamamlandi" && blok.durum !== "iptal" && <Btn variant="primary" size="sm" disabled={islemId === blok.id} onClick={() => void blokTamamla(blok)}>Tamamla</Btn>}
                {blok.durum === "tamamlandi" && <Btn variant="ghost" size="sm" disabled={islemId === blok.id} onClick={() => void blokTamamla(blok)}>Geri al</Btn>}
                {blok.durum === "planlandi" && (
                  <>
                    <Btn variant="ghost" size="sm" disabled={islemId === blok.id} onClick={() => void sureyiDegistir(blok, -15)}>−15 dk</Btn>
                    <Btn variant="ghost" size="sm" disabled={islemId === blok.id} onClick={() => void sureyiDegistir(blok, 15)}>+15 dk</Btn>
                    <Btn variant="ghost" size="sm" disabled={islemId === blok.id} onClick={() => void blokErtele(blok)}>Yarına ertele</Btn>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(bugunDersleri.length > 0 || bugunOkulDersleri.length > 0) && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(15,27,45,0.08)" }}>
          <p style={{ fontSize: 11, fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 8 }}>Çalışma dışı sabitler</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {bugunDersleri.map((ders) => <Badge key={ders.id} variant="teal">{saat(ders.tarih)} · Koçluk: {ders.baslik}</Badge>)}
            {bugunOkulDersleri.map((ders) => <Badge key={ders.id} variant="ink">{ders.baslangic.slice(0, 5)}–{ders.bitis.slice(0, 5)} · Okul: {ders.ders_adi}</Badge>)}
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, paddingTop: 11, borderTop: "1px solid rgba(15,27,45,0.08)" }}>
        <button type="button" onClick={() => setMusaitlikAcik((acik) => !acik)} style={{ border: 0, padding: 0, background: "none", color: "#2A9D8F", fontSize: 12, fontWeight: 650, cursor: "pointer" }}>
          {musaitlikAcik ? "Müsaitlik ayarını gizle" : "Müsaitlik aralığımı düzenle"}
        </button>
        {musaitlikAcik && (
          <form onSubmit={musaitlikKaydetClick} style={{ display: "flex", alignItems: "flex-end", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <FormGroup><Label>Başlangıç</Label><Input type="time" value={musaitlikBaslangic} onChange={(e) => setMusaitlikBaslangic(e.target.value)} required /></FormGroup>
            <FormGroup><Label>Bitiş</Label><Input type="time" value={musaitlikBitis} onChange={(e) => setMusaitlikBitis(e.target.value)} required /></FormGroup>
            <Btn variant="ghost" size="sm" type="submit" disabled={musaitlikKaydediliyor}>{musaitlikKaydediliyor ? "…" : "Kaydet"}</Btn>
          </form>
        )}
      </div>
    </Card>
  );
}
