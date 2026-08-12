import { useEffect, useState } from "react";
import { kocOgrencileri, davetKoduUret, ogrenciAktifYap, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { subeleriGetir, subeOlustur, subeAdiGuncelle, subeSil, ogrenciyiSubeyeAta, type Sube } from "../../lib/subeQueries";
import { Card, Input, Select, Btn, Label, FormGroup, Badge, StatusDot, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";

export default function OgrenciYonetimi({ onOgrenciSec }: { onOgrenciSec: (id: string) => void }) {
  const { toast, show } = useToast();
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [subeler, setSubeler] = useState<Sube[]>([]);
  const [ad, setAd] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [uretilenKod, setUretilenKod] = useState("");
  const [hata, setHata] = useState("");
  const [isleniyor, setIsleniyor] = useState(false);

  const [yeniSubeAdi, setYeniSubeAdi] = useState("");
  const [subeIsleniyor, setSubeIsleniyor] = useState(false);
  const [duzenlenenSubeId, setDuzenlenenSubeId] = useState<string | null>(null);
  const [duzenlenenAd, setDuzenlenenAd] = useState("");

  async function verileriYenile() {
    try {
      const [o, s] = await Promise.all([kocOgrencileri(), subeleriGetir()]);
      setOgrenciler(o);
      setSubeler(s);
    } catch (e: any) {
      setHata(e.message ?? "Bir hata oluştu.");
    }
  }

  useEffect(() => {
    verileriYenile().finally(() => setYukleniyor(false));
  }, []);

  async function handleSubeEkle() {
    if (!yeniSubeAdi.trim()) return;
    setSubeIsleniyor(true);
    try {
      await subeOlustur(yeniSubeAdi.trim());
      setYeniSubeAdi("");
      await verileriYenile();
      show("Şube oluşturuldu ✓");
    } catch (e: any) {
      setHata(e.message ?? "Şube oluşturulamadı.");
    } finally {
      setSubeIsleniyor(false);
    }
  }

  function handleSubeDuzenlemeBaslat(s: Sube) {
    setDuzenlenenSubeId(s.id);
    setDuzenlenenAd(s.ad);
  }

  async function handleSubeAdiKaydet() {
    if (!duzenlenenSubeId || !duzenlenenAd.trim()) return;
    try {
      await subeAdiGuncelle(duzenlenenSubeId, duzenlenenAd.trim());
      setDuzenlenenSubeId(null);
      await verileriYenile();
    } catch (e: any) {
      setHata(e.message ?? "Şube güncellenemedi.");
    }
  }

  async function handleSubeSil(subeId: string) {
    try {
      await subeSil(subeId);
      await verileriYenile();
      show("Şube silindi, öğrenciler şubesiz kaldı ✓");
    } catch (e: any) {
      setHata(e.message ?? "Şube silinemedi.");
    }
  }

  async function handleOgrenciSubeDegistir(ogrenciId: string, subeId: string) {
    try {
      await ogrenciyiSubeyeAta(ogrenciId, subeId || null);
      await verileriYenile();
    } catch (e: any) {
      setHata(e.message ?? "Şube ataması yapılamadı.");
    }
  }

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
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Şubeler</h3>
        {subeler.length === 0 && (
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13, marginBottom: 14 }}>
            Henüz şube yok. "12-A" gibi bir isimle ilk şubeni oluşturabilirsin.
          </p>
        )}
        {subeler.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 14 }}>
            {subeler.map((s) => {
              const uyeSayisi = ogrenciler.filter((o) => o.sube_id === s.id).length;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                  <Icon name="grid" size={15} />
                  {duzenlenenSubeId === s.id ? (
                    <>
                      <Input
                        autoFocus
                        value={duzenlenenAd}
                        onChange={(e) => setDuzenlenenAd(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubeAdiKaydet()}
                        style={{ flex: 1, maxWidth: 240 }}
                      />
                      <Btn variant="ghost" size="sm" onClick={handleSubeAdiKaydet}><Icon name="check" size={13} /> Kaydet</Btn>
                      <Btn variant="ghost" size="sm" onClick={() => setDuzenlenenSubeId(null)}>Vazgeç</Btn>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{s.ad}</span>
                      <span style={{ fontSize: 12, color: "rgba(15,27,45,0.45)" }}>{uyeSayisi} öğrenci</span>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleSubeDuzenlemeBaslat(s)} title="Adını değiştir"><Icon name="pen" size={13} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleSubeSil(s.id)} title="Şubeyi sil"><Icon name="trash" size={13} /></button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <FormGroup style={{ flex: 1, minWidth: 200 }}>
            <Label>Yeni Şube Adı</Label>
            <Input placeholder="ör. 12-A" value={yeniSubeAdi} onChange={(e) => setYeniSubeAdi(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubeEkle()} />
          </FormGroup>
          <Btn variant="gold" onClick={handleSubeEkle} disabled={!yeniSubeAdi.trim() || subeIsleniyor}><Icon name="plus" size={14} /> Şube Ekle</Btn>
        </div>
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
              <Select
                value={o.sube_id ?? ""}
                onChange={(e) => handleOgrenciSubeDegistir(o.id, e.target.value)}
                style={{ maxWidth: 150 }}
                title="Şube"
              >
                <option value="">Şubesiz</option>
                {subeler.map((s) => (
                  <option key={s.id} value={s.id}>{s.ad}</option>
                ))}
              </Select>
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
