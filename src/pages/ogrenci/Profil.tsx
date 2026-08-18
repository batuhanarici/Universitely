import { useToast } from "../../components/useToast";
import { useEffect, useRef, useState } from "react";
import {
  profiliGetir,
  profiliKaydet,
  ogrenciAdSoyadGetir,
  ogrenciAdSoyadKaydet,
} from "../../lib/profilQueries";
import {
  ogrenciHedefiEkle,
  ogrenciHedefiSil,
  ogrenciHedefleriniGetir,
  programlariGetir,
  universiteleriGetir,
  type ProgramKatalogKaydi,
  type UniversiteKatalogKaydi,
} from "../../lib/universiteQueries";
import { avatarYukle, avatarSil } from "../../lib/avatarQueries";
import type { OgrenciHedefi, OgrenciProfili, SinavTuru } from "../../types/database";
import { Card, Btn, Input, Label, FormGroup, Badge, Select } from "../../components/ui";
import ProfilAvatar from "../../components/ProfilAvatar";
import { AdSoyadBolumu, GuvvenlikBolumu, BildirimBolumu } from "../../components/ProfilBolumleri";
import { useAuth } from "../../lib/authContext";

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
  const [sinavTuru, setSinavTuru] = useState<SinavTuru>("tyt");
  const [hedefNet, setHedefNet] = useState("");
  const [emailBildirim, setEmailBildirim] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [avatarYol, setAvatarYol] = useState<string | null>(null);
  const [avatarYukleniyor, setAvatarYukleniyor] = useState(false);
  const [hedefler, setHedefler] = useState<OgrenciHedefi[]>([]);
  const [hedefTuru, setHedefTuru] = useState<"lisans" | "onlisans">("lisans");
  const [universiteler, setUniversiteler] = useState<UniversiteKatalogKaydi[]>([]);
  const [programlar, setProgramlar] = useState<ProgramKatalogKaydi[]>([]);
  const [universiteKodu, setUniversiteKodu] = useState("");
  const [programKodu, setProgramKodu] = useState("");
  const [hedefKatalogYukleniyor, setHedefKatalogYukleniyor] = useState(false);
  const [programlarYukleniyor, setProgramlarYukleniyor] = useState(false);
  const [hedefKaydediliyor, setHedefKaydediliyor] = useState(false);
  const [hedefHatasi, setHedefHatasi] = useState("");

  useEffect(() => {
    Promise.all([profiliGetir(), ogrenciAdSoyadGetir(), ogrenciHedefleriniGetir()])
      .then(([p, ad, kayitliHedefler]) => {
        if (p) {
          setProfil(p);
          setOkul(p.okul ?? "");
          setSinif(p.sinif ?? "");
          setSinavTuru(p.sinav_turu);
          setHedefNet(p.hedef_net != null ? String(p.hedef_net) : "");
          setEmailBildirim(p.email_bildirim);
          setAvatarYol(p.avatar_url ?? null);
        }
        setAdSoyad(ad);
        setHedefler(kayitliHedefler);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    let aktif = true;
    setHedefKatalogYukleniyor(true);
    setHedefHatasi("");
    setUniversiteKodu("");
    setProgramKodu("");
    setProgramlar([]);
    universiteleriGetir(hedefTuru)
      .then((liste) => {
        if (aktif) setUniversiteler(liste);
      })
      .catch(() => {
        if (aktif) setHedefHatasi("Üniversite listesi alınamadı. Lütfen tekrar dene.");
      })
      .finally(() => {
        if (aktif) setHedefKatalogYukleniyor(false);
      });
    return () => { aktif = false; };
  }, [hedefTuru]);

  useEffect(() => {
    if (!universiteKodu) {
      setProgramlar([]);
      setProgramKodu("");
      return;
    }
    let aktif = true;
    setProgramlarYukleniyor(true);
    setHedefHatasi("");
    programlariGetir(hedefTuru, universiteKodu)
      .then((liste) => {
        if (aktif) {
          setProgramlar(liste);
          setProgramKodu("");
        }
      })
      .catch(() => {
        if (aktif) setHedefHatasi("Bu üniversitenin bölüm listesi alınamadı. Lütfen tekrar dene.");
      })
      .finally(() => {
        if (aktif) setProgramlarYukleniyor(false);
      });
    return () => { aktif = false; };
  }, [hedefTuru, universiteKodu]);

  async function handleKaydet(e: React.FormEvent) {
    e.preventDefault();
    setKaydediliyor(true);
    try {
      const kaydedilen = await profiliKaydet({
        okul: okul.trim() || undefined,
        sinif: sinif.trim() || undefined,
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

  async function hedefEkle() {
    const program = programlar.find((kayit) => kayit.kod === programKodu);
    const universite = universiteler.find((kayit) => kayit.kod === universiteKodu);
    if (!program || !universite) return;
    setHedefKaydediliyor(true);
    setHedefHatasi("");
    try {
      const yeni = await ogrenciHedefiEkle(program, universite.ad);
      const kaydedilenProfil = await profiliKaydet({
        hedef_universite: yeni.universite_adi,
        hedef_bolum: yeni.program_adi,
      });
      setHedefler((mevcut) => [yeni, ...mevcut]);
      setProfil(kaydedilenProfil);
      setUniversiteKodu("");
      setProgramKodu("");
      setProgramlar([]);
      show("Üniversite hedefi eklendi ✓");
    } catch (error) {
      setHedefHatasi(error instanceof Error && (error.message.includes("duplicate") || error.message.includes("23505")) ? "Bu bölümü hedeflerine zaten ekledin." : "Hedef eklenemedi. Lütfen tekrar dene.");
    } finally {
      setHedefKaydediliyor(false);
    }
  }

  async function hedefSil(hedef: OgrenciHedefi) {
    const eskiHedefler = hedefler;
    const kalanlar = hedefler.filter((kayit) => kayit.id !== hedef.id);
    setHedefler(kalanlar);
    setHedefHatasi("");
    try {
      await ogrenciHedefiSil(hedef.id);
      if (eskiHedefler[0]?.id === hedef.id) {
        const sonraki = kalanlar[0];
        const kaydedilenProfil = await profiliKaydet({
          hedef_universite: sonraki?.universite_adi ?? null,
          hedef_bolum: sonraki?.program_adi ?? null,
        });
        setProfil(kaydedilenProfil);
      }
      show("Üniversite hedefi kaldırıldı.");
    } catch {
      setHedefler(eskiHedefler);
      setHedefHatasi("Hedef kaldırılamadı. Lütfen tekrar dene.");
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
        <div style={{ marginBottom: 14 }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Üniversite hedefleri</h2>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 12, lineHeight: 1.5 }}>Hedef bölüm ve üniversitelerini YÖK Atlas kataloğundan seç. Tercih sıralaması veya yerleşme garantisi içermez.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "150px 1.3fr 1.7fr auto", gap: 10, alignItems: "end" }}>
          <FormGroup>
            <Label>Program türü</Label>
            <Select value={hedefTuru} onChange={(e) => setHedefTuru(e.target.value as "lisans" | "onlisans")}>
              <option value="lisans">Lisans</option>
              <option value="onlisans">Ön lisans</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Üniversite</Label>
            <Select value={universiteKodu} onChange={(e) => setUniversiteKodu(e.target.value)} disabled={hedefKatalogYukleniyor || universiteler.length === 0}>
              <option value="">{hedefKatalogYukleniyor ? "Üniversiteler yükleniyor…" : "Üniversite seç"}</option>
              {universiteler.map((uni) => <option key={uni.kod} value={uni.kod}>{uni.ad}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Bölüm / program</Label>
            <Select value={programKodu} onChange={(e) => setProgramKodu(e.target.value)} disabled={!universiteKodu || programlarYukleniyor || programlar.length === 0}>
              <option value="">{programlarYukleniyor ? "Bölümler yükleniyor…" : "Bölüm seç"}</option>
              {programlar.map((program) => <option key={program.kod} value={program.kod}>{program.ad}</option>)}
            </Select>
          </FormGroup>
          <Btn variant="primary" type="button" onClick={() => void hedefEkle()} disabled={!programKodu || hedefKaydediliyor}>
            {hedefKaydediliyor ? "Ekleniyor…" : "Hedefe ekle"}
          </Btn>
        </div>
        {hedefHatasi && <p style={{ color: "#C4503A", fontSize: 12, margin: "10px 0 0" }}>{hedefHatasi}</p>}
        {!hedefKatalogYukleniyor && !hedefHatasi && universiteler.length === 0 && <p style={{ color: "rgba(15,27,45,0.45)", fontSize: 12, margin: "10px 0 0" }}>Katalogda üniversite bulunamadı.</p>}
        {hedefler.length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(15,27,45,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
              <p style={{ fontSize: 11, fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.42)" }}>Kayıtlı hedefler</p>
              <Badge variant="ink">{hedefler.length} hedef</Badge>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {hedefler.map((hedef) => (
                <div key={hedef.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, border: "1px solid rgba(15,27,45,0.08)", background: "rgba(228,187,96,0.07)" }}>
                  <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, background: "#16283F", color: "#F4EFE4", fontSize: 10, fontWeight: 800 }}>{hedef.tur === "lisans" ? "4Y" : "2Y"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#16283F", fontWeight: 700, fontSize: 12.5 }}>{hedef.program_adi}</div>
                    <div style={{ color: "rgba(15,27,45,0.5)", fontSize: 11, marginTop: 2 }}>{hedef.universite_adi} · {hedef.program_kodu}</div>
                  </div>
                  <Btn variant="ghost" size="sm" type="button" onClick={() => void hedefSil(hedef)}>Kaldır</Btn>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

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
