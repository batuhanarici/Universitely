import { useToast } from "../../components/useToast";
import { useEffect, useRef, useState } from "react";
import { veliProfilGetir, veliProfilKaydet, veliAdSoyadKaydet } from "../../lib/veliQueries";
import { avatarYukle, avatarSil } from "../../lib/avatarQueries";
import { Card, Btn, Input, Label, FormGroup } from "../../components/ui";
import ProfilAvatar from "../../components/ProfilAvatar";
import { AdSoyadBolumu, GuvvenlikBolumu, BildirimBolumu } from "../../components/ProfilBolumleri";
import { useAuth } from "../../lib/authContext";

const YAKINLIK_SECENEKLERI = ["Anne", "Baba", "Yasal Vasi", "Diğer"];

export default function Profil() {
  const { toast, show } = useToast();
  const { session } = useAuth();
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [adSoyad, setAdSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [yakinlik, setYakinlik] = useState("");
  const [emailBildirim, setEmailBildirim] = useState(false);
  const [avatarYol, setAvatarYol] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [avatarYukleniyor, setAvatarYukleniyor] = useState(false);

  useEffect(() => {
    veliProfilGetir()
      .then((p) => {
        if (p) {
          setAdSoyad(p.ad_soyad ?? "");
          setTelefon(p.telefon ?? "");
          setYakinlik(p.yakinlik ?? "");
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
      await veliProfilKaydet({
        telefon: telefon.trim() || undefined,
        yakinlik: yakinlik || undefined,
      });
      show("Profil kaydedildi ✓");
    } catch {
      show("Kaydederken bir hata oluştu.");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function adSoyadiKaydet(yeni: string) {
    await veliAdSoyadKaydet(yeni);
    setAdSoyad(yeni);
  }

  async function fotoYukle(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setAvatarYukleniyor(true);
    try {
      const yol = await avatarYukle(dosya);
      setAvatarYol(yol);
      await veliProfilKaydet({ avatar_url: yol });
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
      await veliProfilKaydet({ avatar_url: null });
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
          <ProfilAvatar adSoyad={adSoyad || "Veli"} tohum={session?.user?.id ?? ""} yol={avatarYol} boyut={72} />
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
          <FormGroup>
            <Label>Çocuğuna Yakınlık</Label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {YAKINLIK_SECENEKLERI.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setYakinlik(s)}
                  style={{
                    padding: "6px 16px", borderRadius: 8,
                    border: yakinlik === s ? "1.5px solid #E4BB60" : "1.5px solid rgba(15,27,45,0.15)",
                    background: yakinlik === s ? "rgba(228,187,96,0.12)" : "transparent",
                    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
                    color: yakinlik === s ? "#A07C20" : "#0F1B2D", cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </FormGroup>
          <FormGroup>
            <Label>Telefon</Label>
            <Input placeholder="Örn: 05XX XXX XX XX" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
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
          await veliProfilKaydet({ email_bildirim: v });
          setEmailBildirim(v);
        }}
        aciklama="Çocuğunun gelişimiyle ilgili e-posta özetleri"
        show={show}
      />
    </>
  );
}
