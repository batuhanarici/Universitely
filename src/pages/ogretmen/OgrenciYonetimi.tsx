import { useEffect, useState } from "react";
import { kocOgrencileri, davetKoduUret, ogrenciAktifYap, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { Card, Input, Btn, Label, FormGroup, Badge, StatusDot, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";

export default function OgrenciYonetimi({ onOgrenciSec }: { onOgrenciSec: (id: string) => void }) {
  const { toast, show } = useToast();
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [ad, setAd] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [uretilenKod, setUretilenKod] = useState("");
  const [hata, setHata] = useState("");
  const [isleniyor, setIsleniyor] = useState(false);

  async function verileriYenile() {
    try {
      const o = await kocOgrencileri();
      setOgrenciler(o);
    } catch (e: any) {
      setHata(e.message ?? "Bir hata oluştu.");
    }
  }

  useEffect(() => {
    verileriYenile().finally(() => setYukleniyor(false));
  }, []);

  async function handleDavetUret() {
    if (!ad.trim()) return;
    setHata("");
    setIsleniyor(true);
    try {
      const kod = await davetKoduUret(ad.trim());
      setUretilenKod(kod);
      setAd("");
    } catch (e: any) {
      setHata(e.message ?? "Kod üretilemedi.");
    } finally {
      setIsleniyor(false);
    }
  }

  async function handleAktifDegistir(o: KocOgrencisi) {
    try {
      const sonuc = await ogrenciAktifYap(o.id, !o.aktif);
      if (sonuc) await verileriYenile();
    } catch (e: any) {
      setHata(e.message ?? "Güncellenemedi.");
    }
  }

  async function kopyala(kod: string) {
    try {
      await navigator.clipboard.writeText(kod);
      show("Kod kopyalandı ✓");
    } catch {}
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Öğrenciler</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>{ogrenciler.length} bağlı öğrenci</p>
      </div>

      <Card className="tape-accent">
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Yeni Öğrenci Davet Kodu</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <FormGroup style={{ flex: 1, minWidth: 220 }}>
            <Label>Öğrenci Adı Soyadı</Label>
            <Input placeholder="Ad Soyad" value={ad} onChange={(e) => setAd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleDavetUret()} />
          </FormGroup>
          <Btn variant="primary" onClick={handleDavetUret} disabled={!ad.trim() || isleniyor}>Kod Üret</Btn>
        </div>
        {uretilenKod && (
          <>
            <div className="anim-slide" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(228,187,96,0.1)", borderRadius: 8, border: "1.5px solid rgba(228,187,96,0.3)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "#0F1B2D", letterSpacing: "0.1em" }}>{uretilenKod}</span>
              <Btn variant="ghost" size="sm" onClick={() => kopyala(uretilenKod)}><Icon name="copy" size={14} /> Kopyala</Btn>
            </div>
            <p style={{ fontSize: 12, color: "rgba(15,27,45,0.5)", marginTop: 8 }}>Bu kodu öğrenciye ilet. Öğrenci kayıt sırasında kullanacak.</p>
          </>
        )}
        {hata && <p style={{ marginTop: 10, color: "#C4503A", fontSize: 13 }}>{hata}</p>}
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Öğrenci Listesi</h3>
        {ogrenciler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz bağlı öğrenci yok.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {ogrenciler.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <button onClick={() => handleAktifDegistir(o)} title="Aktif/Pasif değiştir" style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <StatusDot active={o.aktif} />
              </button>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{o.ad_soyad}</span>
              <Badge variant={o.aktif ? "teal" : "gray"}>{o.aktif ? "Aktif" : "Pasif"}</Badge>
              {o.davet_kodu && (
                <span style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontFamily: "var(--font-mono)" }}>{o.davet_kodu}</span>
              )}
              <Btn variant="ghost" size="sm" onClick={() => onOgrenciSec(o.id)}>
                <Icon name="user" size={13} /> Detay
              </Btn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
