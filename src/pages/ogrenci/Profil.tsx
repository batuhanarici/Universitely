import { useEffect, useState } from "react";
import { profiliGetir, profiliKaydet } from "../../lib/profilQueries";
import type { OgrenciProfili, SinavTuru } from "../../types/database";
import { Card, Btn, Input, Label, FormGroup, Badge, useToast } from "../../components/ui";

const SINAV_SECENEKLERI: { deger: SinavTuru; etiket: string }[] = [
  { deger: "tyt", etiket: "TYT" },
  { deger: "ayt", etiket: "AYT" },
  { deger: "her_ikisi", etiket: "TYT+AYT" },
];

function sinavEtiketi(t: SinavTuru): string {
  return t === "her_ikisi" ? "TYT+AYT" : t.toUpperCase();
}

export default function Profil() {
  const { toast, show } = useToast();
  const [profil, setProfil] = useState<OgrenciProfili | null>(null);
  const [hedefUniversite, setHedefUniversite] = useState("");
  const [hedefBolum, setHedefBolum] = useState("");
  const [sinavTuru, setSinavTuru] = useState<SinavTuru>("tyt");
  const [hedefNet, setHedefNet] = useState("");
  const [emailBildirim, setEmailBildirim] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    profiliGetir().then((p) => {
      if (p) {
        setProfil(p);
        setHedefUniversite(p.hedef_universite ?? "");
        setHedefBolum(p.hedef_bolum ?? "");
        setSinavTuru(p.sinav_turu);
        setHedefNet(p.hedef_net != null ? String(p.hedef_net) : "");
        setEmailBildirim(p.email_bildirim);
      }
    }).catch(() => {}).finally(() => setYukleniyor(false));
  }, []);

  async function handleKaydet(e: React.FormEvent) {
    e.preventDefault();
    setKaydediliyor(true);
    try {
      const kaydedilen = await profiliKaydet({
        hedef_universite: hedefUniversite.trim() || undefined,
        hedef_bolum: hedefBolum.trim() || undefined,
        sinav_turu: sinavTuru,
        hedef_net: hedefNet.trim() === "" ? null : Number(hedefNet),
        email_bildirim: emailBildirim,
      });
      setProfil(kaydedilen);
      show("Profil kaydedildi ✓");
    } catch {
      show("Kaydederken bir hata oluştu.");
    } finally {
      setKaydediliyor(false);
    }
  }

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  const ozetVar = !!profil && (profil.hedef_universite || profil.hedef_bolum || profil.hedef_net != null);

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      {toast}
      <div>
        <h1 className="page-title">Profil & Hedefler</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Hedeflerini belirle, AI koçun sana özel plan yapsın.</p>
      </div>

      {ozetVar && (
        <Card className="tape-accent" style={{ background: "#F0EBE0" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 10 }}>Hedef Özeti</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {profil!.hedef_universite && <Badge variant="ink">🏛 {profil!.hedef_universite}</Badge>}
            {profil!.hedef_bolum && <Badge variant="ink">📐 {profil!.hedef_bolum}</Badge>}
            <Badge variant="gold">📋 {sinavEtiketi(profil!.sinav_turu)}</Badge>
            {profil!.hedef_net != null && <Badge variant="teal">🎯 Hedef: {profil!.hedef_net} net</Badge>}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="section-title" style={{ marginBottom: 20 }}>Bilgileri Düzenle</h2>
        <form onSubmit={handleKaydet} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FormGroup>
            <Label>Hedef Üniversite</Label>
            <Input placeholder="Örn: İTÜ, ODTÜ, Boğaziçi…" value={hedefUniversite} onChange={(e) => setHedefUniversite(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Hedef Bölüm</Label>
            <Input placeholder="Örn: Bilgisayar Mühendisliği" value={hedefBolum} onChange={(e) => setHedefBolum(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Sınav Türü</Label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {SINAV_SECENEKLERI.map((s) => (
                <button
                  key={s.deger}
                  type="button"
                  onClick={() => setSinavTuru(s.deger)}
                  style={{
                    padding: "6px 16px", borderRadius: 8,
                    border: sinavTuru === s.deger ? "1.5px solid #E4BB60" : "1.5px solid rgba(15,27,45,0.15)",
                    background: sinavTuru === s.deger ? "rgba(228,187,96,0.12)" : "transparent",
                    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                    color: sinavTuru === s.deger ? "#A07C20" : "#0F1B2D", cursor: "pointer",
                  }}
                >
                  {s.etiket}
                </button>
              ))}
            </div>
          </FormGroup>
          <FormGroup>
            <Label>Hedef Net</Label>
            <Input type="number" step="0.5" placeholder="Örn: 85.5" value={hedefNet} onChange={(e) => setHedefNet(e.target.value)} style={{ maxWidth: 160 }} />
          </FormGroup>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13 }}>
            <input type="checkbox" className="checkbox" checked={emailBildirim} onChange={(e) => setEmailBildirim(e.target.checked)} />
            <span>
              <strong>E-posta hatırlatmaları</strong>
              <span style={{ color: "rgba(15,27,45,0.5)", fontSize: 12, display: "block" }}>Her sabah görev, tekrar ve çözülmemiş yanlış özeti</span>
            </span>
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <Btn variant="primary" type="submit" disabled={kaydediliyor}>
              {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
