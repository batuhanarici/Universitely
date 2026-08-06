import { useEffect, useState } from "react";
import { kocOgrencileri, davetKoduUret, ogrenciAktifYap, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { Card, Input, Btn, Badge } from "../../components/ui";

export default function OgrenciYonetimi({ onOgrenciSec }: { onOgrenciSec: (id: string) => void }) {
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [ad, setAd] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [uretilenKod, setUretilenKod] = useState("");
  const [kopyalandi, setKopyalandi] = useState(false);
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
    setKopyalandi(false);
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
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 1500);
    } catch {}
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Öğrenciler</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>{ogrenciler.length} bağlı öğrenci</p>
      </div>

      <Card className="tape-accent">
        <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Yeni Öğrenci Davet Kodu</h3>
        <p style={{ fontSize: 12.5, color: "rgba(15,27,45,0.5)", marginBottom: 10, lineHeight: 1.5 }}>
          Öğrencinin adını yaz, bir davet kodu üret. Öğrenci "Öğrenci Kaydı" yaparken bu kodu girer ve sana otomatik bağlanır.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Input style={{ flex: 1 }} value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Öğrencinin adı soyadı" onKeyDown={(e) => e.key === "Enter" && handleDavetUret()} />
          <Btn onClick={handleDavetUret} disabled={!ad.trim() || isleniyor}>Kod Üret</Btn>
        </div>
        {uretilenKod && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "rgba(228,187,96,0.12)", border: "1px solid rgba(160,124,32,0.4)" }}>
            <p className="mono" style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)", marginBottom: 4 }}>DAVET KODU</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>{uretilenKod}</span>
              <Btn variant="gold" size="sm" onClick={() => kopyala(uretilenKod)}>
                {kopyalandi ? "Kopyalandı" : "Kopyala"}
              </Btn>
            </div>
          </div>
        )}
        {hata && <p style={{ marginTop: 10, color: "#C4503A", fontSize: 13 }}>{hata}</p>}
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Öğrenci Listesi</h3>
        {ogrenciler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz bağlı öğrenci yok.</p>}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {ogrenciler.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <span
                style={{
                  width: 9, height: 9, borderRadius: 99, flexShrink: 0, cursor: "pointer",
                  background: o.aktif ? "#2A9D8F" : "#cfcfcf",
                }}
                title="Aktif/pasif değiştir"
                onClick={() => handleAktifDegistir(o)}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{o.ad_soyad}</p>
                <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)", marginTop: 1 }}>
                  {o.aktif ? <Badge variant="teal">Aktif</Badge> : <Badge variant="gray">Pasif</Badge>}
                  {o.davet_kodu ? ` · veli bağlantı kodu: ${o.davet_kodu}` : ""}
                </p>
              </div>
              <Btn variant="gold" size="sm" onClick={() => onOgrenciSec(o.id)}>Detay</Btn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
