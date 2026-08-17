import { useEffect, useMemo, useState } from "react";
import { erkenUyarilariHesapla, type ErkenUyari } from "../lib/erkenUyariMotoru";
import { kocUyariKapatmalariniGetir, kocUyariyiKapat } from "../lib/erkenUyariQueries";
import type { KocAnalizVerisi } from "../lib/aiMotoru";
import { Badge, Btn, Card, EmptyState, Select, useToast } from "./ui";

const SEVIYE: Record<ErkenUyari["seviye"], { etiket: string; variant: "brick" | "gold" }> = {
  yuksek: { etiket: "Öncelikli görüşme", variant: "brick" },
  orta: { etiket: "Takip et", variant: "gold" },
  dusuk: { etiket: "Rutin", variant: "gold" },
};

function kaynakAnahtari(uyari: ErkenUyari) {
  return `${uyari.ogrenci_id}:${uyari.tur}:${uyari.kaynak_tarihi}`;
}

function tarihEtiketi(tarih: string) {
  return new Date(`${tarih}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function ErkenUyariPaneli({ veri, onOgrenciSec }: { veri: KocAnalizVerisi; onOgrenciSec: (id: string) => void }) {
  const { toast, show } = useToast();
  const [kapatmalar, setKapatmalar] = useState<Array<{ ogrenci_id: string; uyari_turu: string; kaynak_tarihi: string }>>([]);
  const [seviyeFiltresi, setSeviyeFiltresi] = useState<"tumu" | "yuksek" | "orta">("tumu");
  const [ogrenciFiltresi, setOgrenciFiltresi] = useState("tumu");
  const [sayfa, setSayfa] = useState(1);
  const [arsivGoster, setArsivGoster] = useState(false);
  const sayfaBoyutu = 6;

  useEffect(() => {
    kocUyariKapatmalariniGetir()
      .then((kayitlar) => setKapatmalar(kayitlar.map((kayit) => ({ ogrenci_id: kayit.ogrenci_id, uyari_turu: kayit.uyari_turu, kaynak_tarihi: kayit.kaynak_tarihi }))))
      .catch(() => setKapatmalar([]));
  }, [veri]);

  const uyarilar = useMemo(() => erkenUyarilariHesapla(veri), [veri]);
  const kapaliAnahtarlari = useMemo(() => new Set(kapatmalar.map((kayit) => `${kayit.ogrenci_id}:${kayit.uyari_turu}:${kayit.kaynak_tarihi}`)), [kapatmalar]);
  const gorunenUyarilar = useMemo(() => {
    return uyarilar.filter((uyari) => {
      const kapali = kapaliAnahtarlari.has(kaynakAnahtari(uyari));
      return (arsivGoster || !kapali)
        && (seviyeFiltresi === "tumu" || uyari.seviye === seviyeFiltresi)
        && (ogrenciFiltresi === "tumu" || uyari.ogrenci_id === ogrenciFiltresi);
    });
  }, [arsivGoster, kapaliAnahtarlari, ogrenciFiltresi, seviyeFiltresi, uyarilar]);

  useEffect(() => setSayfa(1), [ogrenciFiltresi, seviyeFiltresi, arsivGoster]);

  const sayfaSayisi = Math.max(1, Math.ceil(gorunenUyarilar.length / sayfaBoyutu));
  const sayfadakiler = gorunenUyarilar.slice((sayfa - 1) * sayfaBoyutu, sayfa * sayfaBoyutu);

  async function uyarilandi(uyari: ErkenUyari) {
    try {
      await kocUyariyiKapat(uyari.ogrenci_id, uyari.tur, uyari.kaynak_tarihi);
      setKapatmalar((liste) => [...liste.filter((kayit) => `${kayit.ogrenci_id}:${kayit.uyari_turu}:${kayit.kaynak_tarihi}` !== kaynakAnahtari(uyari)), { ogrenci_id: uyari.ogrenci_id, uyari_turu: uyari.tur, kaynak_tarihi: uyari.kaynak_tarihi }]);
      show("Sinyal incelendi olarak kapatıldı.");
    } catch {
      show("Sinyal kapatılamadı.");
    }
  }

  return (
    <Card>
      {toast}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <h3 className="section-title" style={{ fontSize: 16, marginBottom: 3 }}>Erken uyarı sinyalleri</h3>
          <p style={{ fontSize: 12, color: "rgba(15,27,45,0.5)" }}>Bu kartlar tanı veya kesin hüküm değil, koçun iletişim sırasını belirleyen açıklanabilir çalışma sinyalleridir.</p>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <Select value={seviyeFiltresi} onChange={(e) => setSeviyeFiltresi(e.target.value as typeof seviyeFiltresi)} style={{ minWidth: 125 }}>
            <option value="tumu">Tüm öncelikler</option>
            <option value="yuksek">Öncelikli</option>
            <option value="orta">Takip et</option>
          </Select>
          <Select value={ogrenciFiltresi} onChange={(e) => setOgrenciFiltresi(e.target.value)} style={{ minWidth: 150 }}>
            <option value="tumu">Tüm öğrenciler</option>
            {veri.ogrenciler.filter((ogrenci) => ogrenci.aktif).map((ogrenci) => <option key={ogrenci.id} value={ogrenci.id}>{ogrenci.ad_soyad}</option>)}
          </Select>
          <Btn variant="ghost" size="sm" onClick={() => setArsivGoster((goster) => !goster)}>{arsivGoster ? "Aktif sinyalleri göster" : "Kapatılanları göster"}</Btn>
        </div>
      </div>

      {gorunenUyarilar.length === 0 ? (
        <EmptyState icon="◎" title={arsivGoster ? "Bu filtrede sinyal yok" : "Açık erken uyarı yok"} desc={arsivGoster ? "Seçili öncelik ve öğrenci filtresini değiştirebilirsiniz." : "Yeni bir kaynak sinyali oluştuğunda burada görünecek."} />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sayfadakiler.map((uyari) => {
              const seviye = SEVIYE[uyari.seviye];
              const kapali = kapaliAnahtarlari.has(kaynakAnahtari(uyari));
              return (
                <div key={uyari.id} style={{ padding: "11px 12px", borderRadius: 8, border: "1px solid rgba(22,40,63,0.08)", background: kapali ? "rgba(15,27,45,0.025)" : "rgba(228,187,96,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 13, color: "#16283F" }}>{uyari.ad_soyad}</strong>
                    <Badge variant={seviye.variant}>{seviye.etiket}</Badge>
                    {kapali && <Badge variant="gray">İncelendi</Badge>}
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(15,27,45,0.42)" }}>{tarihEtiketi(uyari.kaynak_tarihi)}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 650, marginTop: 6 }}>{uyari.baslik}</p>
                  <p style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(15,27,45,0.65)", marginTop: 3 }}>{uyari.aciklama}</p>
                  <p style={{ fontSize: 11, color: "rgba(15,27,45,0.45)", marginTop: 5 }}><strong>Kaynak:</strong> {uyari.kaynak_etiketi}</p>
                  <p style={{ fontSize: 12, lineHeight: 1.45, color: "#16283F", marginTop: 6 }}><strong>Önerilen iletişim adımı:</strong> {uyari.onerilen_aksiyon}</p>
                  <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
                    <Btn variant="ghost" size="sm" onClick={() => onOgrenciSec(uyari.ogrenci_id)}>Öğrenci detayını aç</Btn>
                    {!kapali && <Btn variant="primary" size="sm" onClick={() => void uyarilandi(uyari)}>İncelendi olarak kapat</Btn>}
                  </div>
                </div>
              );
            })}
          </div>
          {sayfaSayisi > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 13 }}>
              <Btn variant="ghost" size="sm" disabled={sayfa === 1} onClick={() => setSayfa((s) => Math.max(1, s - 1))}>Önceki</Btn>
              <span style={{ fontSize: 12, color: "rgba(15,27,45,0.5)" }}>{sayfa}/{sayfaSayisi}</span>
              <Btn variant="ghost" size="sm" disabled={sayfa === sayfaSayisi} onClick={() => setSayfa((s) => Math.min(sayfaSayisi, s + 1))}>Sonraki</Btn>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
