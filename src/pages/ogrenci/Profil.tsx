import { useEffect, useRef, useState } from "react";
import {
  profiliGetir,
  profiliKaydet,
  ogrenciAdSoyadGetir,
  ogrenciAdSoyadKaydet,
} from "../../lib/profilQueries";
import { avatarYukle, avatarSil } from "../../lib/avatarQueries";
import type { OgrenciProfili, SinavTuru } from "../../types/database";
import { Card, Btn, Input, Label, FormGroup, Badge, useToast } from "../../components/ui";
import ProfilAvatar from "../../components/ProfilAvatar";
import { AdSoyadBolumu, GuvvenlikBolumu, BildirimBolumu } from "../../components/ProfilBolumleri";
import { useAuth } from "../../lib/AuthContext";

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
  const { session } = useAuth();
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [profil, setProfil] = useState<OgrenciProfili | null>(null);
  const [adSoyad, setAdSoyad] = useState("");
  const [okul, setOkul] = useState("");
  const [sinif, setSinif] = useState("");
  const [hedefUniversite, setHedefUniversite] = useState("");
  const [hedefBolum, setHedefBolum] = useState("");
  const [sinavTuru, setSinavTuru] = useState<SinavTuru>("tyt");
  const [hedefNet, setHedefNet] = useState("");
  const [emailBildirim, setEmailBildirim] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [avatarYol, setAvatarYol] = useState<string | null>(null);
  const [avatarYukleniyor, setAvatarYukleniyor] = useState(false);

  useEffect(() => {
    Promise.all([profiliGetir(), ogrenciAdSoyadGetir()])
      .then(([p, ad]) => {
        if (p) {
          setProfil(p);
          setOkul(p.okul ?? "");
          setSinif(p.sinif ?? "");
          setHedefUniversite(p.hedef_universite ?? "");
          setHedefBolum(p.hedef_bolum ?? "");
          setSinavTuru(p.sinav_turu);
          setHedefNet(p.hedef_net != null ? String(p.hedef_net) : "");
          setEmailBildirim(p.email_bildirim);
          setAvatarYol(p.avatar_url ?? null);
        }
        setAdSoyad(ad);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  async function handleKaydet(e: React.FormEvent) {
    e.preventDefault();
    setKaydediliyor(true);
    try {
      const kaydedilen = await profiliKaydet({
        okul: okul.trim() || undefined,
        sinif: sinif.trim() || undefined,
        hedef_universite: hedefUniversite.trim() || undefined,
        hedef_bolum: hedefBolum.trim() || undefined,
        sinav_turu: sinavTuru,
        hedef_net: hedefNet.trim() === "" ? null : Number(hedefNet),
      });
      setProfil(kaydedilen);
      show("Profil kaydedildi ✓");
    } catch {
      show("Kaydederken bir hata oluştu.");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function adSoyadiKaydet(yeni: string) {
    await ogrenciAdSoyadKaydet(yeni);
    setAdSoyad(yeni);
  }

  async function fotoYukle(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setAvatarYukleniyor(true);
    try {
      const yol = await avatarYukle(dosya);
      setAvatarYol(yol);
      await profiliKaydet({ avatar_url: yol });
      show("Profil fotoğrafı güncellendi ✓");
    } catch {
      show("Fotoğraf yüklenemedi.");
    } finally {
      setAvatarYukleniyor(false);
    }
  }

  async function fotoSil() {
    setAvatarYukleniyor(true);
    try {
      await avatarSil();
      setAvatarYol(null);
      await profiliKaydet({ avatar_url: null });
      show("Profil fotoğrafı kaldırıldı.");
    } catch {
      show("Fotoğraf kaldırılamadı.");
    } finally {
      setAvatarYukleniyor(false);
    }
  }

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  const ozetVar = !!profil && (profil.hedef_universite || profil.hedef_bolum || profil.hedef_net != null);

  return (
    <>
      {toast}

      {ozetVar && (
        <Card className="tape-accent" style={{ background: "#F0EBE0" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 10 }}>
            Hedef Özeti
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {profil!.hedef_universite && <Badge variant="ink">🏛 {profil!.hedef_universite}</Badge>}
            {profil!.hedef_bolum && <Badge variant="ink">📐 {profil!.hedef_bolum}</Badge>}
            <Badge variant="gold">📋 {sinavEtiketi(profil!.sinav_turu)}</Badge>
            {profil!.hedef_net != null && <Badge variant="teal">🎯 Hedef: {profil!.hedef_net} net</Badge>}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="section-title" style={{ marginBottom: 16 }}>Profil Fotoğrafı</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <ProfilAvatar adSoyad={adSoyad || "Öğrenci"} tohum={session?.user?.id ?? ""} yol={avatarYol} boyut={72} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={() => fotoInputRef.current?.click()} disabled={avatarYukleniyor}>
              Fotoğraf Yükle
            </Btn>
            {avatarYol && (
              <Btn variant="ghost" size="sm" onClick={fotoSil} disabled={avatarYukleniyor}>
                Fotoğrafı Kaldır
              </Btn>
            )}
            <input ref={fotoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={fotoYukle} />
          </div>
        </div>
      </Card>

      <AdSoyadBolumu adSoyad={adSoyad} onKaydet={adSoyadiKaydet} show={show} />

      <Card>
        <h2 className="section-title" style={{ marginBottom: 20 }}>Bilgileri Düzenle</h2>
        <form onSubmit={handleKaydet} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <FormGroup style={{ flex: 1, minWidth: 200 }}>
              <Label>Okul</Label>
              <Input placeholder="Örn: Anadolu Lisesi" value={okul} onChange={(e) => setOkul(e.target.value)} />
            </FormGroup>
            <FormGroup style={{ flex: 1, minWidth: 120 }}>
              <Label>Sınıf</Label>
              <Input placeholder="Örn: 12-A" value={sinif} onChange={(e) => setSinif(e.target.value)} />
            </FormGroup>
          </div>
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
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <Btn variant="primary" type="submit" disabled={kaydediliyor}>
              {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
            </Btn>
          </div>
        </form>
      </Card>

      <GuvvenlikBolumu show={show} />

      <BildirimBolumu
        emailBildirim={emailBildirim}
        onChange={async (v) => {
          await profiliKaydet({ email_bildirim: v });
          setEmailBildirim(v);
        }}
        aciklama="Her sabah görev, tekrar ve çözülmemiş yanlış özeti"
        show={show}
      />
    </>
  );
}
