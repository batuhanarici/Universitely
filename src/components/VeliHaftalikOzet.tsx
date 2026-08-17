import { useMemo } from "react";
import type { VeliCocukVerisi } from "../lib/veliQueries";
import { Badge, Card, ProgressBar } from "./ui";

function isoOf(tarih: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${tarih.getFullYear()}-${pad(tarih.getMonth() + 1)}-${pad(tarih.getDate())}`;
}

function gunEkle(iso: string, gun: number) {
  const tarih = new Date(`${iso}T12:00:00`);
  tarih.setDate(tarih.getDate() + gun);
  return isoOf(tarih);
}

function tarihKarsilastir(tarih: string) {
  return tarih.slice(0, 10);
}

function tarihEtiketi(tarih: string) {
  return new Date(`${tarih.slice(0, 10)}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function VeliHaftalikOzet({ veri }: { veri: VeliCocukVerisi }) {
  const ozet = useMemo(() => {
    const bugun = isoOf(new Date());
    const haftaBasi = gunEkle(bugun, -6);
    const gelecekHafta = gunEkle(bugun, 7);
    const haftaCalismalari = veri.calismalar.filter((kayit) => tarihKarsilastir(kayit.tarih) >= haftaBasi && tarihKarsilastir(kayit.tarih) <= bugun);
    const haftaGorevleri = veri.gorevler.filter((gorev) => gorev.tarih >= haftaBasi && gorev.tarih <= bugun);
    const tamamlananGorev = haftaGorevleri.filter((gorev) => gorev.tamamlandi).length;
    const gelecekGorevler = veri.gorevler.filter((gorev) => !gorev.tamamlandi && gorev.tarih > bugun && gorev.tarih <= gelecekHafta).sort((a, b) => a.tarih.localeCompare(b.tarih));
    const gecikenGorevler = veri.gorevler.filter((gorev) => !gorev.tamamlandi && gorev.tarih < bugun);
    const paylasilanNotlar = veri.seansNotlari
      .filter((not) => tarihKarsilastir(not.updated_at) >= haftaBasi && tarihKarsilastir(not.updated_at) <= bugun)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const paylasilanTakipler = veri.takipMaddeleri
      .filter((takip) => takip.son_tarih >= haftaBasi && takip.son_tarih <= gelecekHafta)
      .sort((a, b) => a.son_tarih.localeCompare(b.son_tarih));
    const yaklasanGorusmeler = veri.gorusmeler
      .filter((gorusme) => gorusme.durum === "planlandi" && gorusme.tarih.slice(0, 10) >= bugun && gorusme.tarih.slice(0, 10) <= gelecekHafta)
      .sort((a, b) => a.tarih.localeCompare(b.tarih));
    const sure = haftaCalismalari.reduce((toplam, kayit) => toplam + kayit.sure_dk, 0);
    const soru = haftaCalismalari.reduce((toplam, kayit) => toplam + (kayit.soru_sayisi ?? 0), 0);
    const oran = haftaGorevleri.length === 0 ? 0 : Math.round((tamamlananGorev / haftaGorevleri.length) * 100);
    const oneriler: string[] = [];
    if (sure < 120) oneriler.push("Bu hafta çalışma süresi sınırlı görünüyor. Birlikte her gün uygulanabilir 20–30 dakikalık tek bir başlangıç bloğu belirleyebilirsiniz.");
    if (gecikenGorevler.length > 0) oneriler.push(`${gecikenGorevler.length} görev gecikmiş görünüyor. Yeni görev eklemek yerine önce en kritik görevin tamamlanmasına destek olun.`);
    if (yaklasanGorusmeler.length > 0) oneriler.push(`Yaklaşan koçluk görüşmesi için ${yaklasanGorusmeler[0].baslik.toLocaleLowerCase("tr-TR")} gündemini ve öğrencinin sormak istediği tek soruyu not etmek faydalı olabilir.`);
    if (oneriler.length === 0) oneriler.push("Bu haftaki ritmi korumak için çalışma saatini ve dinlenme aralarını birlikte planlamaya devam edin.");
    return { bugun, haftaBasi, haftaCalismalari, haftaGorevleri, tamamlananGorev, gelecekGorevler, gecikenGorevler, paylasilanNotlar, paylasilanTakipler, yaklasanGorusmeler, sure, soru, oran, oneriler };
  }, [veri]);

  return (
    <Card className="tape-accent">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <h2 className="section-title" style={{ fontSize: 18, marginBottom: 4 }}>Veli haftalık özeti</h2>
          <p style={{ fontSize: 12.5, color: "rgba(15,27,45,0.52)" }}>{tarihEtiketi(ozet.haftaBasi)}–{tarihEtiketi(ozet.bugun)} · {veri.cocuk_adi}</p>
        </div>
        <Badge variant="teal">Uygulama içi özet</Badge>
      </div>

      <div className="grid-4" style={{ gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, textTransform: "uppercase" }}>Çalışma</p>
          <p className="metric-value" style={{ fontSize: 22, fontWeight: 700 }}>{Math.round((ozet.sure / 60) * 10) / 10} <span style={{ fontSize: 12, color: "rgba(15,27,45,0.45)" }}>saat</span></p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, textTransform: "uppercase" }}>Soru</p>
          <p className="metric-value" style={{ fontSize: 22, fontWeight: 700 }}>{ozet.soru}</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, textTransform: "uppercase" }}>Görev</p>
          <p className="metric-value" style={{ fontSize: 22, fontWeight: 700 }}>%{ozet.oran}</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, textTransform: "uppercase" }}>Koç güncellemesi</p>
          <p className="metric-value" style={{ fontSize: 22, fontWeight: 700 }}>{ozet.paylasilanNotlar.length + ozet.paylasilanTakipler.length}</p>
        </div>
      </div>
      <div style={{ marginTop: 12 }}><ProgressBar pct={ozet.oran} color="#2A9D8F" /></div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div style={{ padding: "10px 11px", borderRadius: 8, background: "rgba(42,157,143,0.06)" }}>
          <p style={{ fontSize: 11, fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.43)", marginBottom: 7 }}>Yaklaşanlar</p>
          {ozet.yaklasanGorusmeler.length === 0 && ozet.gelecekGorevler.length === 0 ? <p style={{ fontSize: 12, color: "rgba(15,27,45,0.55)" }}>Önümüzdeki hafta için paylaşılacak önemli tarih yok.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ozet.yaklasanGorusmeler.slice(0, 2).map((gorusme) => <p key={gorusme.id} style={{ fontSize: 12 }}><strong>{tarihEtiketi(gorusme.tarih)}</strong> · Koçluk görüşmesi</p>)}
              {ozet.gelecekGorevler.slice(0, 3).map((gorev) => <p key={gorev.id} style={{ fontSize: 12 }}><strong>{tarihEtiketi(gorev.tarih)}</strong> · {gorev.baslik}</p>)}
            </div>
          )}
        </div>
        <div style={{ padding: "10px 11px", borderRadius: 8, background: "rgba(228,187,96,0.09)" }}>
          <p style={{ fontSize: 11, fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.43)", marginBottom: 7 }}>Evde destek önerisi</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{ozet.oneriler.slice(0, 2).map((oneri) => <p key={oneri} style={{ fontSize: 12, lineHeight: 1.5 }}>{oneri}</p>)}</div>
        </div>
      </div>

      {ozet.paylasilanNotlar.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(15,27,45,0.08)" }}>
          <p style={{ fontSize: 11, fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.43)", marginBottom: 7 }}>Koçun paylaştığı seans notu</p>
          {ozet.paylasilanNotlar.slice(0, 2).map((not) => <div key={not.id} style={{ padding: "8px 10px", borderLeft: "3px solid #2A9D8F", background: "rgba(42,157,143,0.05)", marginBottom: 6 }}><p style={{ fontSize: 12, lineHeight: 1.5 }}>{not.ozet}</p></div>)}
        </div>
      )}

      {ozet.paylasilanTakipler.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.43)", marginBottom: 7 }}>Paylaşılan takip adımları</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{ozet.paylasilanTakipler.slice(0, 4).map((takip) => <div key={takip.id} style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ flex: 1, fontSize: 12 }}>{takip.baslik}</span><Badge variant={takip.durum === "tamamlandi" ? "teal" : "gold"}>{takip.durum === "tamamlandi" ? "Tamamlandı" : tarihEtiketi(takip.son_tarih)}</Badge></div>)}</div>
        </div>
      )}

      <p style={{ fontSize: 10.5, lineHeight: 1.45, color: "rgba(15,27,45,0.4)", marginTop: 14 }}>Bu özet yalnızca uygulamadaki kayıtlı etkinlikleri ve koçun paylaşmayı seçtiği içerikleri gösterir. Akademik veya psikolojik teşhis ve kesin başarı tahmini içermez.</p>
    </Card>
  );
}
