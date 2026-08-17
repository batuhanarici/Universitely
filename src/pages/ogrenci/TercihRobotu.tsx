import { useEffect, useMemo, useState } from "react";
import {
  tercihKatalogunuGetir,
  puaniBicimlendir,
  riskEtiketi,
  riskHesapla,
  riskRengi,
  sayiyiBicimlendir,
  type TercihPuanTuru,
  type TercihProgrami,
  type TercihRisk,
} from "../../lib/tercihRobotuQueries";
import { Badge, Card, Input, Label, FormGroup, Select } from "../../components/ui";

type TurFiltresi = "hepsi" | "lisans" | "onlisans";

type Katalog = Awaited<ReturnType<typeof tercihKatalogunuGetir>>;

function riskSirasi(risk: TercihRisk) {
  return risk === "guvenli" ? 0 : risk === "dengeli" ? 1 : 2;
}

function programGorunumu(program: TercihProgrami) {
  const universite = program.universite ?? "Üniversite bilgisi yok";
  return `${program.ad} — ${universite}`;
}

export default function TercihRobotu() {
  const [katalog, setKatalog] = useState<Katalog | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [puanTuru, setPuanTuru] = useState<TercihPuanTuru>("TYT");
  const [tur, setTur] = useState<TurFiltresi>("hepsi");
  const [arama, setArama] = useState("");
  const [universite, setUniversite] = useState("");
  const [adaySirasi, setAdaySirasi] = useState("");
  const [riskFiltresi, setRiskFiltresi] = useState<"hepsi" | TercihRisk>("hepsi");
  const [yalnizcaKontenjanli, setYalnizcaKontenjanli] = useState(true);

  useEffect(() => {
    tercihKatalogunuGetir()
      .then(setKatalog)
      .catch(() => setHata("Tercih kataloğu yüklenemedi. Lütfen sayfayı yenile veya daha sonra tekrar dene."))
      .finally(() => setYukleniyor(false));
  }, []);

  const adaySirasiSayisi = Number(adaySirasi.replace(/\D/g, ""));

  const universiteSecenekleri = useMemo(() => {
    if (!katalog) return [];
    return Array.from(new Set(katalog.programlar.map((p) => p.universite).filter((u): u is string => Boolean(u)))).sort((a, b) => a.localeCompare(b, "tr"));
  }, [katalog]);

  const sonuclar = useMemo(() => {
    if (!katalog || !adaySirasiSayisi) return [];
    const aramaKucuk = arama.trim().toLocaleLowerCase("tr-TR");
    return katalog.programlar
      .filter((program) => program.puanTuru === puanTuru)
      .filter((program) => tur === "hepsi" || program.tur === tur)
      .filter((program) => programGorunumu(program).toLocaleLowerCase("tr-TR").includes(aramaKucuk))
      .filter((program) => !universite || program.universite === universite)
      .filter((program) => !yalnizcaKontenjanli || (program.kontenjan ?? 0) > 0)
      .filter((program) => program.gecmisBasariSirasi != null)
      .map((program) => ({ ...program, risk: riskHesapla(adaySirasiSayisi, program.gecmisBasariSirasi as number) }))
      .filter((program) => riskFiltresi === "hepsi" || program.risk === riskFiltresi)
      .sort((a, b) => {
        const riskFarki = riskSirasi(a.risk) - riskSirasi(b.risk);
        return riskFarki || (a.gecmisBasariSirasi ?? Number.MAX_SAFE_INTEGER) - (b.gecmisBasariSirasi ?? Number.MAX_SAFE_INTEGER);
      })
      .slice(0, 100);
  }, [adaySirasiSayisi, arama, katalog, puanTuru, riskFiltresi, tur, universite, yalnizcaKontenjanli]);

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Üniversite Tercih Robotu</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Başarı sıranı 2025 yerleşme verileriyle karşılaştır; seçenekleri güvenli, dengeli ve iddialı olarak incele.</p>
      </div>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.5fr", gap: 12, alignItems: "end" }}>
          <FormGroup>
            <Label>Başarı sırası</Label>
            <Input value={adaySirasi} onChange={(e) => setAdaySirasi(e.target.value.replace(/\D/g, ""))} placeholder="Örn. 125000" inputMode="numeric" />
          </FormGroup>
          <FormGroup>
            <Label>Puan türü</Label>
            <Select value={puanTuru} onChange={(e) => setPuanTuru(e.target.value as TercihPuanTuru)}>
              <option value="TYT">TYT</option>
              <option value="SAY">SAY</option>
              <option value="EA">EA</option>
              <option value="SÖZ">SÖZ</option>
              <option value="DİL">DİL</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Öğrenim türü</Label>
            <Select value={tur} onChange={(e) => setTur(e.target.value as TurFiltresi)}>
              <option value="hepsi">Lisans + ön lisans</option>
              <option value="lisans">Lisans</option>
              <option value="onlisans">Ön lisans</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Bölüm veya üniversite ara</Label>
            <Input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Örn. bilgisayar, Ankara…" />
          </FormGroup>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr auto", gap: 12, marginTop: 12, alignItems: "end" }}>
          <FormGroup>
            <Label>Üniversiteyi daralt</Label>
            <Select value={universite} onChange={(e) => setUniversite(e.target.value)}>
              <option value="">Tüm üniversiteler</option>
              {universiteSecenekleri.map((ad) => <option key={ad} value={ad}>{ad}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Tercih profili</Label>
            <Select value={riskFiltresi} onChange={(e) => setRiskFiltresi(e.target.value as "hepsi" | TercihRisk)}>
              <option value="hepsi">Tüm profiller</option>
              <option value="guvenli">Daha güvenli</option>
              <option value="dengeli">Dengeli</option>
              <option value="iddiali">İddialı</option>
            </Select>
          </FormGroup>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "rgba(15,27,45,0.65)", paddingBottom: 9 }}>
            <input type="checkbox" checked={yalnizcaKontenjanli} onChange={(e) => setYalnizcaKontenjanli(e.target.checked)} />
            Kontenjanı olanlar
          </label>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: 17, marginBottom: 4 }}>Önerilen programlar</h2>
            <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 12, margin: 0 }}>
              {yukleniyor ? "Resmî kılavuz verisi yükleniyor…" : adaySirasiSayisi ? `${sonuclar.length} sonuç gösteriliyor` : "Sonuç görmek için başarı sıranı gir."}
            </p>
          </div>
          <Badge variant="ink">{katalog?.programlar.length.toLocaleString("tr-TR") ?? "—"} program</Badge>
        </div>

        {hata && <p style={{ color: "#C4503A", fontSize: 13 }}>{hata}</p>}
        {!hata && !yukleniyor && !adaySirasiSayisi && (
          <div style={{ padding: "20px 0", color: "rgba(15,27,45,0.55)", fontSize: 13 }}>Başarı sıranı girince geçmiş yerleşme sıralamasına göre öneriler burada görünecek.</div>
        )}
        {!hata && !yukleniyor && adaySirasiSayisi > 0 && sonuclar.length === 0 && (
          <div style={{ padding: "20px 0", color: "rgba(15,27,45,0.55)", fontSize: 13 }}>Bu filtrelerle geçmiş başarı sırası bulunan program bulunamadı. Puan türünü, program türünü veya arama filtresini değiştir.</div>
        )}
        {sonuclar.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sonuclar.map((program) => (
              <div key={program.kod} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 120px 120px 96px", gap: 12, alignItems: "center", padding: "12px", border: "1px solid rgba(15,27,45,0.08)", borderRadius: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "#16283F", fontWeight: 700, fontSize: 13 }}>{program.ad}</div>
                  <div style={{ color: "rgba(15,27,45,0.5)", fontSize: 11, marginTop: 3 }}>{program.universite ?? "Üniversite bilgisi yok"} · {program.tur === "lisans" ? "Lisans" : "Ön lisans"}</div>
                </div>
                <div><span style={{ display: "block", fontSize: 10, color: "rgba(15,27,45,0.45)" }}>2025 başarı sırası</span><strong style={{ fontSize: 13 }}>{sayiyiBicimlendir(program.gecmisBasariSirasi)}</strong></div>
                <div><span style={{ display: "block", fontSize: 10, color: "rgba(15,27,45,0.45)" }}>2025 en küçük puan</span><strong style={{ fontSize: 13 }}>{puaniBicimlendir(program.gecmisEnKucukPuan)}</strong></div>
                <Badge variant={program.risk === "guvenli" ? "teal" : program.risk === "dengeli" ? "gold" : "brick"}>{riskEtiketi(program.risk)}</Badge>
                <div style={{ gridColumn: "1 / -1", fontSize: 11, color: riskRengi(program.risk) }}>
                  Senin sıran {sayiyiBicimlendir(adaySirasiSayisi)} · Son yerleşen sıra {sayiyiBicimlendir(program.gecmisBasariSirasi)} · Kontenjan {program.kontenjan == null ? "—" : sayiyiBicimlendir(program.kontenjan)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16, padding: "12px", borderRadius: 8, background: "rgba(228,187,96,0.12)", color: "rgba(15,27,45,0.65)", fontSize: 11, lineHeight: 1.55 }}>
          <strong>Önemli:</strong> Bu ekran 2026 ÖSYM kılavuzundaki 2025-YKS başarı sırası ve en küçük puan alanlarını karşılaştırır. “Güvenli”, “dengeli” ve “iddialı” etiketleri yalnızca geçmiş veriye dayalı yönlendirmedir; yerleşme garantisi değildir. Tercih yapmadan önce programın güncel koşullarını ve ÖSYM’nin yayımladığı son kılavuzu kontrol et.
          <br /><a href="https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/TERCIH/kontkilavuz_yktd21072026.pdf" target="_blank" rel="noreferrer" style={{ color: "#2A9D8F", fontWeight: 700 }}>2026 ÖSYM tercih kılavuzunu aç</a>
        </div>
      </Card>
    </div>
  );
}
