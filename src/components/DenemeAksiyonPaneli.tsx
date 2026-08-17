import { useCallback, useEffect, useState } from "react";
import {
  denemeAksiyonlariniGetir,
  denemeAksiyonuDurumGuncelle,
  denemeAksiyonunuGoreveDonustur,
  denemeAksiyonunuTekraraDonustur,
} from "../lib/denemeAksiyonQueries";
import type { DenemeAksiyonu, Ogrenci } from "../types/database";
import { Badge, Btn, Card, EmptyState, useToast } from "./ui";

const ONCELIK: Record<DenemeAksiyonu["oncelik"], { metin: string; variant: "brick" | "gold" | "teal" }> = {
  yuksek: { metin: "Öncelikli", variant: "brick" },
  orta: { metin: "Dikkat", variant: "gold" },
  dusuk: { metin: "Rutin", variant: "teal" },
};

const DURUM: Record<DenemeAksiyonu["durum"], string> = {
  taslak: "Koç incelemesinde",
  onaylandi: "Koç onayladı",
  reddedildi: "Koç reddetti",
  uygulandi: "Plana bağlandı",
  tamamlandi: "Tamamlandı",
};

function tarihEtiketi(tarih: string) {
  return new Date(`${tarih}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

function aksiyonTuruEtiketi(tur: DenemeAksiyonu["aksiyon_turu"]) {
  return tur === "gorev" ? "Görev taslağı" : "Tekrar taslağı";
}

export function DenemeAksiyonOgrenciPaneli() {
  const [aksiyonlar, setAksiyonlar] = useState<DenemeAksiyonu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    setHata(false);
    try {
      setAksiyonlar(await denemeAksiyonlariniGetir());
    } catch {
      setHata(true);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  if (yukleniyor) return <Card><p style={{ fontSize: 13, color: "rgba(15,27,45,0.5)" }}>Koç aksiyonları yükleniyor…</p></Card>;
  if (hata) return <Card><p style={{ fontSize: 13, color: "#C4503A" }}>Koç aksiyonları şu anda yüklenemedi.</p></Card>;
  if (aksiyonlar.length === 0) return null;

  return (
    <Card className="tape-accent">
      <div style={{ marginBottom: 13 }}>
        <h2 className="section-title" style={{ fontSize: 18, marginBottom: 4 }}>Son denemeden sonraki aksiyonlar</h2>
        <p style={{ fontSize: 13, color: "rgba(15,27,45,0.53)" }}>Koçun onayladığı öneriler günlük görev ve tekrar akışına bağlanır.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {aksiyonlar.slice(0, 6).map((aksiyon) => (
          <div key={aksiyon.id} style={{ padding: "10px 11px", borderRadius: 8, background: aksiyon.durum === "tamamlandi" ? "rgba(42,157,143,0.07)" : "rgba(228,187,96,0.08)", border: "1px solid rgba(22,40,63,0.08)" }}>
            <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginBottom: 5 }}>
              <Badge variant={ONCELIK[aksiyon.oncelik].variant}>{ONCELIK[aksiyon.oncelik].metin}</Badge>
              <Badge variant="gray">{aksiyonTuruEtiketi(aksiyon.aksiyon_turu)}</Badge>
              <Badge variant={aksiyon.durum === "tamamlandi" ? "teal" : "gold"}>{DURUM[aksiyon.durum]}</Badge>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(15,27,45,0.45)" }}>{tarihEtiketi(aksiyon.onerilen_tarih)}</span>
            </div>
            <strong style={{ display: "block", fontSize: 13, color: "#16283F" }}>{aksiyon.baslik}</strong>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(15,27,45,0.67)", marginTop: 4 }}>{aksiyon.detay}</p>
            <p style={{ fontSize: 11, lineHeight: 1.4, color: "rgba(15,27,45,0.45)", marginTop: 5 }}><strong>Dayanak:</strong> {aksiyon.dayanak}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DenemeAksiyonKocPaneli({ denemeId, ogrenciler, yenilemeAnahtari = 0 }: { denemeId: string; ogrenciler: Ogrenci[]; yenilemeAnahtari?: number }) {
  const { toast, show } = useToast();
  const [aksiyonlar, setAksiyonlar] = useState<DenemeAksiyonu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);
  const [islemId, setIslemId] = useState<string | null>(null);
  const ogrenciAdi = new Map(ogrenciler.map((ogrenci) => [ogrenci.id, ogrenci.ad_soyad]));

  const yukle = useCallback(async () => {
    if (!denemeId) return;
    setYukleniyor(true);
    setHata(false);
    try {
      setAksiyonlar(await denemeAksiyonlariniGetir(denemeId));
    } catch {
      setHata(true);
    } finally {
      setYukleniyor(false);
    }
  }, [denemeId]);

  useEffect(() => {
    void yukle();
  }, [yukle, yenilemeAnahtari]);

  async function durumGuncelle(aksiyon: DenemeAksiyonu, durum: "onaylandi" | "reddedildi") {
    setIslemId(aksiyon.id);
    try {
      const guncel = await denemeAksiyonuDurumGuncelle(aksiyon.id, durum);
      setAksiyonlar((liste) => liste.map((x) => (x.id === guncel.id ? guncel : x)));
      show(durum === "onaylandi" ? "Aksiyon onaylandı ve öğrenciye bildirildi." : "Aksiyon reddedildi.");
    } catch {
      show("Aksiyon durumu güncellenemedi.");
    } finally {
      setIslemId(null);
    }
  }

  async function kaynağaBagla(aksiyon: DenemeAksiyonu) {
    setIslemId(aksiyon.id);
    try {
      const guncel = aksiyon.aksiyon_turu === "gorev"
        ? await denemeAksiyonunuGoreveDonustur(aksiyon.id)
        : await denemeAksiyonunuTekraraDonustur(aksiyon.id);
      setAksiyonlar((liste) => liste.map((x) => (x.id === guncel.id ? guncel : x)));
      show(aksiyon.aksiyon_turu === "gorev" ? "Aksiyon göreve bağlandı." : "Aksiyon tekrar planına bağlandı.");
    } catch {
      show("Aksiyon mevcut akışa bağlanamadı. Önce onaylandığından emin olun.");
    } finally {
      setIslemId(null);
    }
  }

  return (
    <Card>
      {toast}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div>
          <h3 className="section-title" style={{ fontSize: 16, marginBottom: 3 }}>Deneme aksiyon taslakları</h3>
          <p style={{ fontSize: 12, color: "rgba(15,27,45,0.48)" }}>Kural tabanlı önerileri öğrenciye göndermeden önce inceleyin.</p>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => void yukle()}>Yenile</Btn>
      </div>
      {yukleniyor ? (
        <p style={{ fontSize: 13, color: "rgba(15,27,45,0.5)" }}>Aksiyonlar yükleniyor…</p>
      ) : hata ? (
        <p style={{ fontSize: 13, color: "#C4503A" }}>Aksiyonlar yüklenemedi; yenileme ile tekrar deneyin.</p>
      ) : aksiyonlar.length === 0 ? (
        <EmptyState icon="🧭" title="Henüz aksiyon taslağı yok" desc="Sonuç kaydından sonra bu deneme için konu bazlı öneriler burada oluşur." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {aksiyonlar.map((aksiyon) => (
            <div key={aksiyon.id} style={{ padding: "10px 11px", borderRadius: 8, background: "rgba(15,27,45,0.025)", border: "1px solid rgba(15,27,45,0.08)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <strong style={{ fontSize: 13, color: "#16283F" }}>{ogrenciAdi.get(aksiyon.ogrenci_id) ?? "Öğrenci"}</strong>
                <Badge variant={ONCELIK[aksiyon.oncelik].variant}>{ONCELIK[aksiyon.oncelik].metin}</Badge>
                <Badge variant="gray">{aksiyonTuruEtiketi(aksiyon.aksiyon_turu)}</Badge>
                <Badge variant={aksiyon.durum === "taslak" ? "gold" : aksiyon.durum === "onaylandi" ? "teal" : "gray"}>{DURUM[aksiyon.durum]}</Badge>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{aksiyon.baslik}</p>
              <p style={{ fontSize: 12, lineHeight: 1.45, color: "rgba(15,27,45,0.63)", marginTop: 3 }}>{aksiyon.detay}</p>
              <p style={{ fontSize: 11, lineHeight: 1.4, color: "rgba(15,27,45,0.45)", marginTop: 5 }}><strong>Dayanak:</strong> {aksiyon.dayanak} · Önerilen tarih: {tarihEtiketi(aksiyon.onerilen_tarih)}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {aksiyon.durum === "taslak" && (
                  <>
                    <Btn variant="primary" size="sm" disabled={islemId === aksiyon.id} onClick={() => void durumGuncelle(aksiyon, "onaylandi")}>Onayla</Btn>
                    <Btn variant="danger" size="sm" disabled={islemId === aksiyon.id} onClick={() => void durumGuncelle(aksiyon, "reddedildi")}>Reddet</Btn>
                  </>
                )}
                {(aksiyon.durum === "onaylandi" || aksiyon.durum === "uygulandi") && !aksiyon.gorev_id && !aksiyon.tekrar_plan_id && (
                  <Btn variant="ghost" size="sm" disabled={islemId === aksiyon.id} onClick={() => void kaynağaBagla(aksiyon)}>{aksiyon.aksiyon_turu === "gorev" ? "Göreve bağla" : "Tekrara bağla"}</Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
