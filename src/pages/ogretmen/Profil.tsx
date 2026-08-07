import { useEffect, useRef, useState } from "react";
import {
  ogretmenProfilGetir,
  ogretmenProfilKaydet,
  ogretmenAdSoyadKaydet,
} from "../../lib/ogretmenProfilQueries";
import { avatarYukle, avatarSil } from "../../lib/avatarQueries";
import { Card, Btn, Input, Textarea, Label, FormGroup, useToast } from "../../components/ui";
import ProfilAvatar from "../../components/ProfilAvatar";
import { AdSoyadBolumu, GuvvenlikBolumu, BildirimBolumu } from "../../components/ProfilBolumleri";
import { useAuth } from "../../lib/AuthContext";

export default function Profil() {
  const { toast, show } = useToast();
  const { session } = useAuth();
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [adSoyad, setAdSoyad] = useState("");
  const [brans, setBrans] = useState("");
  const [telefon, setTelefon] = useState("");
  const [kurum, setKurum] = useState("");
  const [biyografi, setBiyografi] = useState("");
  const [emailBildirim, setEmailBildirim] = useState(false);
  const [avatarYol, setAvatarYol] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [avatarYukleniyor, setAvatarYukleniyor] = useState(false);

  useEffect(() => {
    ogretmenProfilGetir()
      .then((p) => {
        if (p) {
          setAdSoyad(p.ad_soyad ?? "");
          setBrans(p.brans ?? "");
          setTelefon(p.telefon ?? "");
          setKurum(p.kurum ?? "");
          setBiyografi(p.biyografi ?? "");
          setEmailBildirim(p.email_bildirim);
          setAvatarYol(p.avatar_url ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  async function handleKaydet(e: React.FormEvent) {
    e.preventDefault();
    setKaydediliyor(true);
    try {
      await ogretmenProfilKaydet({
        brans: brans.trim() || undefined,
        telefon: telefon.trim() || undefined,
        kurum: kurum.trim() || undefined,
        biyografi: biyografi.trim() || undefined,
      });
      show("Profil kaydedildi ✓");
    } catch {
      show("Kaydederken bir hata oluştu.");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function adSoyadiKaydet(yeni: string) {
    await ogretmenAdSoyadKaydet(yeni);
    setAdSoyad(yeni);
  }

  async function fotoYukle(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setAvatarYukleniyor(true);
    try {
      const yol = await avatarYukle(dosya);
      setAvatarYol(yol);
      await ogretmenProfilKaydet({ avatar_url: yol });
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
      await ogretmenProfilKaydet({ avatar_url: null });
      show("Profil fotoğrafı kaldırıldı.");
    } catch {
      show("Fotoğraf kaldırılamadı.");
    } finally {
      setAvatarYukleniyor(false);
    }
  }

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <>
      {toast}

      <Card>
        <h2 className="section-title" style={{ marginBottom: 16 }}>Profil Fotoğrafı</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <ProfilAvatar adSoyad={adSoyad || "Koç"} tohum={session?.user?.id ?? ""} yol={avatarYol} boyut={72} />
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
            <FormGroup style={{ flex: 1, minWidth: 180 }}>
              <Label>Branş</Label>
              <Input placeholder="Örn: Matematik, Fizik…" value={brans} onChange={(e) => setBrans(e.target.value)} />
            </FormGroup>
            <FormGroup style={{ flex: 1, minWidth: 180 }}>
              <Label>Kurum</Label>
              <Input placeholder="Örn: Dershane / Kurum adı" value={kurum} onChange={(e) => setKurum(e.target.value)} />
            </FormGroup>
          </div>
          <FormGroup>
            <Label>Telefon</Label>
            <Input placeholder="Örn: 05XX XXX XX XX" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Biyografi</Label>
            <Textarea
              placeholder="Kısaca kendinden ve çalışma tarzından bahset…"
              value={biyografi}
              onChange={(e) => setBiyografi(e.target.value)}
            />
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
          await ogretmenProfilKaydet({ email_bildirim: v });
          setEmailBildirim(v);
        }}
        aciklama="Öğrencilerle ilgili günlük özet ve bildirim e-postaları"
        show={show}
      />
    </>
  );
}
