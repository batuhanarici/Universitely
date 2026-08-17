import { useEffect, useState } from "react";
import type { Gorusme, SeansNotu, TakipMaddesi, TakipMaddesiDurumu, TakipMaddesiOnceligi } from "../types/database";
import {
  seansNotuKaydet,
  takipMaddesiEkle,
  takipMaddesiDurumGuncelle,
  takipMaddesiniGoreveDonustur,
} from "../lib/kocAraclariQueries";
import { Badge, Btn, Checkbox, FormGroup, Input, Label, Select, Textarea, useToast } from "./ui";

type Props = {
  ders: Gorusme;
  seansNotu: SeansNotu | null;
  takipMaddeleri: TakipMaddesi[];
  onNotKaydedildi: (not: SeansNotu) => void;
  onTakipEklendi: (takip: TakipMaddesi) => void;
  onTakipGuncellendi: (takip: TakipMaddesi) => void;
};

const DURUM_ETIKETLERI: Record<TakipMaddesiDurumu, string> = {
  bekliyor: "Bekliyor",
  devam_ediyor: "Devam ediyor",
  tamamlandi: "Tamamlandı",
  ertelendi: "Ertelendi",
};

const ONCELIK_ETIKETLERI: Record<TakipMaddesiOnceligi, string> = {
  dusuk: "Düşük",
  orta: "Orta",
  yuksek: "Yüksek",
};

function tarihEkle(tarih: string, gun: number) {
  const sonuc = new Date(`${tarih}T12:00:00`);
  sonuc.setDate(sonuc.getDate() + gun);
  return sonuc.toISOString().slice(0, 10);
}

function bugun() {
  return new Date().toISOString().slice(0, 10);
}

export function SeansKapanisPaneli({ ders, seansNotu, takipMaddeleri, onNotKaydedildi, onTakipEklendi, onTakipGuncellendi }: Props) {
  const { toast, show } = useToast();
  const [acik, setAcik] = useState(Boolean(seansNotu));
  const [ozet, setOzet] = useState(seansNotu?.ozet ?? "");
  const [gucluYonler, setGucluYonler] = useState(seansNotu?.guclu_yonler ?? "");
  const [gelisimAlanlari, setGelisimAlanlari] = useState(seansNotu?.gelisim_alanlari ?? "");
  const [notVeliGorur, setNotVeliGorur] = useState(seansNotu?.veli_gorur ?? false);
  const [notKaydediliyor, setNotKaydediliyor] = useState(false);
  const [takipBaslik, setTakipBaslik] = useState("");
  const [takipAciklama, setTakipAciklama] = useState("");
  const [takipTarih, setTakipTarih] = useState(() => tarihEkle(bugun(), 7));
  const [takipOncelik, setTakipOncelik] = useState<TakipMaddesiOnceligi>("orta");
  const [takipVeliGorur, setTakipVeliGorur] = useState(false);
  const [takipKaydediliyor, setTakipKaydediliyor] = useState(false);
  const [islemId, setIslemId] = useState<string | null>(null);

  useEffect(() => {
    setAcik(Boolean(seansNotu));
    setOzet(seansNotu?.ozet ?? "");
    setGucluYonler(seansNotu?.guclu_yonler ?? "");
    setGelisimAlanlari(seansNotu?.gelisim_alanlari ?? "");
    setNotVeliGorur(seansNotu?.veli_gorur ?? false);
  }, [seansNotu]);

  async function handleNotKaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!ozet.trim()) {
      show("Seans özeti boş bırakılamaz.");
      return;
    }
    setNotKaydediliyor(true);
    try {
      const kayit = await seansNotuKaydet({
        gorusme_id: ders.id,
        ogrenci_id: ders.ogrenci_id,
        ozet,
        guclu_yonler: gucluYonler,
        gelisim_alanlari: gelisimAlanlari,
        veli_gorur: notVeliGorur,
      });
      onNotKaydedildi(kayit);
      show("Seans kapanış notu kaydedildi.");
    } catch {
      show("Seans notu kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setNotKaydediliyor(false);
    }
  }

  async function handleTakipEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!seansNotu?.id) {
      show("Önce seans notunu kaydedin.");
      return;
    }
    if (!takipBaslik.trim() || !takipTarih) return;
    setTakipKaydediliyor(true);
    try {
      const kayit = await takipMaddesiEkle({
        gorusme_id: ders.id,
        seans_notu_id: seansNotu.id,
        ogrenci_id: ders.ogrenci_id,
        baslik: takipBaslik,
        aciklama: takipAciklama,
        son_tarih: takipTarih,
        oncelik: takipOncelik,
        veli_gorur: takipVeliGorur,
      });
      onTakipEklendi(kayit);
      setTakipBaslik("");
      setTakipAciklama("");
      setTakipTarih(tarihEkle(bugun(), 7));
      setTakipOncelik("orta");
      setTakipVeliGorur(false);
      show("Takip maddesi oluşturuldu ve öğrenciye bildirildi.");
    } catch {
      show("Takip maddesi oluşturulamadı. Lütfen alanları kontrol edin.");
    } finally {
      setTakipKaydediliyor(false);
    }
  }

  async function durumDegistir(takip: TakipMaddesi, durum: TakipMaddesiDurumu) {
    setIslemId(takip.id);
    try {
      const basarili = await takipMaddesiDurumGuncelle(takip.id, durum);
      if (basarili) onTakipGuncellendi({ ...takip, durum, updated_at: new Date().toISOString() });
    } catch {
      show("Takip maddesi güncellenemedi.");
    } finally {
      setIslemId(null);
    }
  }

  async function goreveDonustur(takip: TakipMaddesi) {
    setIslemId(takip.id);
    try {
      const gorevId = await takipMaddesiniGoreveDonustur(takip.id);
      onTakipGuncellendi({ ...takip, gorev_id: gorevId, updated_at: new Date().toISOString() });
      show("Takip maddesi görev listesine bağlandı.");
    } catch {
      show("Takip maddesi göreve dönüştürülemedi.");
    } finally {
      setIslemId(null);
    }
  }

  return (
    <div style={{ marginTop: 12, borderTop: "1px solid rgba(15,27,45,0.08)", paddingTop: 10 }}>
      {toast}
      <Btn variant="ghost" size="sm" onClick={() => setAcik((deger) => !deger)}>
        {acik ? "Kapanış panelini gizle" : seansNotu ? "Kapanış notunu görüntüle" : "Seans kapanışını yaz"}
      </Btn>

      {acik && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
          <form onSubmit={handleNotKaydet} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <FormGroup>
              <Label>Seans özeti *</Label>
              <Textarea value={ozet} onChange={(e) => setOzet(e.target.value)} placeholder="Bugünkü görüşmede hangi kararları aldınız?" style={{ minHeight: 66 }} required />
            </FormGroup>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <FormGroup>
                <Label>Güçlü yönler</Label>
                <Textarea value={gucluYonler} onChange={(e) => setGucluYonler(e.target.value)} placeholder="Öğrencinin iyi yaptığı şeyler" style={{ minHeight: 54 }} />
              </FormGroup>
              <FormGroup>
                <Label>Gelişim alanları</Label>
                <Textarea value={gelisimAlanlari} onChange={(e) => setGelisimAlanlari(e.target.value)} placeholder="Bir sonraki seansa kadar odak" style={{ minHeight: 54 }} />
              </FormGroup>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(15,27,45,0.68)" }}>
              <Checkbox checked={notVeliGorur} onChange={(e) => setNotVeliGorur(e.target.checked)} />
              Bu özeti veli panelinde göster
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn variant="primary" size="sm" type="submit" disabled={notKaydediliyor}>{notKaydediliyor ? "Kaydediliyor…" : "Kapanış notunu kaydet"}</Btn>
            </div>
          </form>

          <div style={{ borderTop: "1px solid rgba(15,27,45,0.08)", paddingTop: 12 }}>
            <h4 style={{ fontSize: 13, margin: "0 0 8px", color: "#16283F" }}>Takip maddeleri</h4>
            {takipMaddeleri.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
                {takipMaddeleri.map((takip) => (
                  <div key={takip.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px", borderRadius: 7, background: "rgba(42,157,143,0.05)", border: "1px solid rgba(42,157,143,0.14)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: 12 }}>{takip.baslik}</strong>
                        <Badge variant={takip.oncelik === "yuksek" ? "brick" : takip.oncelik === "orta" ? "gold" : "gray"}>{ONCELIK_ETIKETLERI[takip.oncelik]}</Badge>
                        <Badge variant={takip.durum === "tamamlandi" ? "teal" : "gray"}>{DURUM_ETIKETLERI[takip.durum]}</Badge>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(15,27,45,0.5)", margin: "3px 0 0" }}>Son tarih: {new Date(`${takip.son_tarih}T12:00:00`).toLocaleDateString("tr-TR")}{takip.gorev_id ? " · Görev listesine bağlı" : ""}</p>
                      {takip.aciklama && <p style={{ fontSize: 11, color: "rgba(15,27,45,0.64)", margin: "3px 0 0", whiteSpace: "pre-wrap" }}>{takip.aciklama}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {takip.durum !== "tamamlandi" && <Btn variant="ghost" size="sm" disabled={islemId === takip.id} onClick={() => durumDegistir(takip, "tamamlandi")}>Tamamla</Btn>}
                      {!takip.gorev_id && <Btn variant="ghost" size="sm" disabled={islemId === takip.id} onClick={() => goreveDonustur(takip)}>Göreve bağla</Btn>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleTakipEkle} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
              <FormGroup style={{ gridColumn: "1 / -1" }}>
                <Label>Yeni takip maddesi *</Label>
                <Input value={takipBaslik} onChange={(e) => setTakipBaslik(e.target.value)} placeholder="Örn. Her gün 20 problem sorusu çöz" required />
              </FormGroup>
              <FormGroup>
                <Label>Açıklama</Label>
                <Input value={takipAciklama} onChange={(e) => setTakipAciklama(e.target.value)} placeholder="Nasıl yapılacak?" />
              </FormGroup>
              <FormGroup>
                <Label>Son tarih</Label>
                <Input type="date" value={takipTarih} onChange={(e) => setTakipTarih(e.target.value)} required />
              </FormGroup>
              <FormGroup>
                <Label>Öncelik</Label>
                <Select value={takipOncelik} onChange={(e) => setTakipOncelik(e.target.value as TakipMaddesiOnceligi)}>
                  <option value="dusuk">Düşük</option>
                  <option value="orta">Orta</option>
                  <option value="yuksek">Yüksek</option>
                </Select>
              </FormGroup>
              <label style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(15,27,45,0.68)" }}>
                <Checkbox checked={takipVeliGorur} onChange={(e) => setTakipVeliGorur(e.target.checked)} />
                Bu takip maddesini veliye göster
              </label>
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
                <Btn variant="primary" size="sm" type="submit" disabled={takipKaydediliyor || !seansNotu}>{takipKaydediliyor ? "Ekleniyor…" : "Takip maddesi ekle"}</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
