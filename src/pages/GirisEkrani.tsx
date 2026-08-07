import { useState } from "react";
import { supabase } from "../lib/supabase";
import { davetKodunuDogrula } from "../lib/ogrenciYonetimQueries";
import { Card, Btn, Input, Label, FormGroup, Tabs } from "../components/ui";

type Mod = "Giriş Yap" | "Öğrenci Kaydı" | "Veli Kaydı";
type AltMod = "yok" | "sifre" | "dogrulama";

export default function GirisEkrani() {
  const [tab, setTab] = useState<Mod>("Giriş Yap");
  const [alt, setAlt] = useState<AltMod>("yok");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [adSoyad, setAdSoyad] = useState("");
  const [kod, setKod] = useState("");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  function mesajTemizle() {
    setHata("");
    setBilgi("");
  }

  async function handleGonder(e: React.FormEvent) {
    e.preventDefault();
    mesajTemizle();
    setGonderiliyor(true);
    try {
      if (tab === "Giriş Yap") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: sifre });
        if (error) throw error;
      } else if (tab === "Öğrenci Kaydı") {
        if (!adSoyad.trim()) {
          setHata("Ad soyad gerekli.");
          return;
        }
        if (!kod.trim()) {
          setHata("Davet kodu gerekli — koçundan alabilirsin.");
          return;
        }
        const gecerli = await davetKodunuDogrula(kod.trim().toUpperCase());
        if (!gecerli) {
          setHata("Davet kodu geçersiz veya daha önce kullanılmış.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password: sifre,
          options: {
            data: { ad_soyad: adSoyad.trim(), davet_kodu: kod.trim().toUpperCase() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.session) {
          setBilgi("Kayıt oluşturuldu. Şimdi giriş yapabilirsin — koçuna otomatik bağlanacaksın.");
          setTab("Giriş Yap");
        } else {
          setAlt("dogrulama");
        }
      } else {
        if (!adSoyad.trim()) {
          setHata("Ad soyad gerekli.");
          return;
        }
        if (!kod.trim()) {
          setHata("Bağlantı kodu gerekli — koç ya da çocuğunun hesabından alabilirsin.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password: sifre,
          options: {
            data: { rol: "veli", ad_soyad: adSoyad.trim(), veli_kodu: kod.trim().toUpperCase() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.session) {
          setBilgi("Veli kaydı oluşturuldu. Şimdi giriş yapabilirsin — çocuğunun hesabına bağlanacaksın.");
          setTab("Giriş Yap");
        } else {
          setAlt("dogrulama");
        }
      }
    } catch (e: any) {
      setHata(e.message ?? "Bir hata oluştu.");
    } finally {
      setGonderiliyor(false);
    }
  }

  async function dogrulamayiYenidenGonder() {
    mesajTemizle();
    setGonderiliyor(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setBilgi("Doğrulama e-postası tekrar gönderildi ✓");
    } catch (e: any) {
      setHata(e.message ?? "E-posta gönderilemedi.");
    } finally {
      setGonderiliyor(false);
    }
  }

  async function sifreSifirla(e: React.FormEvent) {
    e.preventDefault();
    mesajTemizle();
    setGonderiliyor(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      setBilgi("Şifre sıfırlama bağlantısı e-postana gönderildi. Gelen kutusunu kontrol et.");
    } catch (e: any) {
      setHata(e.message ?? "E-posta gönderilemedi.");
    } finally {
      setGonderiliyor(false);
    }
  }

  const logo = (
    <div style={{ textAlign: "center", marginBottom: 40 }}>
      <div style={{ width: 48, height: 48, background: "#fff", border: "1px solid rgba(15,27,45,0.08)", borderRadius: 12, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <img src="/icon.svg" alt="Universitely" style={{ width: 48, height: 48, objectFit: "cover" }} />
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, color: "#0F1B2D", letterSpacing: "-0.03em", marginBottom: 6 }}>
        Universitely
      </h1>
      <p style={{ fontSize: 13, color: "rgba(15,27,45,0.5)" }}>TYT/AYT sınavına giden yolunuz</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F4EFE4", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="rule-lines" style={{ position: "fixed", inset: 0, pointerEvents: "none" }} />

      <div className="anim-slide" style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {logo}

        {alt === "dogrulama" ? (
          <Card style={{ borderRadius: 14 }}>
            <div style={{ textAlign: "center", padding: "8px 4px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#0F1B2D", marginBottom: 8 }}>E-postanı doğrula</h2>
              <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", lineHeight: 1.6, marginBottom: 20 }}>
                <strong style={{ color: "#0F1B2D" }}>{email}</strong> adresine bir doğrulama bağlantısı gönderdik. Linke tıkladığında hesabın aktifleşir.
              </p>
              {hata && <p style={{ fontSize: 13, color: "#C4503A", fontWeight: 500, marginBottom: 10 }}>{hata}</p>}
              {bilgi && <p style={{ fontSize: 13, color: "#2A9D8F", fontWeight: 500, marginBottom: 10 }}>{bilgi}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Btn variant="primary" onClick={dogrulamayiYenidenGonder} disabled={gonderiliyor}>
                  {gonderiliyor ? "Gönderiliyor…" : "E-postayı Yeniden Gönder"}
                </Btn>
                <Btn variant="ghost" onClick={() => { setAlt("yok"); setTab("Giriş Yap"); mesajTemizle(); }}>
                  Girişe Dön
                </Btn>
              </div>
            </div>
          </Card>
        ) : alt === "sifre" ? (
          <Card style={{ borderRadius: 14 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#0F1B2D", marginBottom: 6 }}>Şifremi Unuttum</h2>
            <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", marginBottom: 20 }}>
              E-posta adresine şifre sıfırlama bağlantısı göndereceğiz.
            </p>
            <form onSubmit={sifreSifirla} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FormGroup>
                <Label>E-posta</Label>
                <Input type="email" placeholder="ornek@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </FormGroup>
              {hata && <p style={{ fontSize: 13, color: "#C4503A", fontWeight: 500 }}>{hata}</p>}
              {bilgi && <p style={{ fontSize: 13, color: "#2A9D8F", fontWeight: 500 }}>{bilgi}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Btn variant="primary" type="submit" disabled={gonderiliyor || !email}>
                  {gonderiliyor ? "Gönderiliyor…" : "Sıfırlama Bağlantısı Gönder"}
                </Btn>
                <Btn variant="ghost" onClick={() => { setAlt("yok"); setTab("Giriş Yap"); mesajTemizle(); }}>
                  Girişe Dön
                </Btn>
              </div>
            </form>
          </Card>
        ) : (
          <Card style={{ borderRadius: 14 }}>
            <Tabs
              tabs={["Giriş Yap", "Öğrenci Kaydı", "Veli Kaydı"]}
              active={tab}
              onChange={(t) => {
                setTab(t as Mod);
                setAlt("yok");
                mesajTemizle();
              }}
            />

            <form onSubmit={handleGonder} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              {(tab === "Öğrenci Kaydı" || tab === "Veli Kaydı") && (
                <FormGroup>
                  <Label>Ad Soyad</Label>
                  <Input placeholder="Adınız Soyadınız" value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} required />
                </FormGroup>
              )}
              <FormGroup>
                <Label>E-posta</Label>
                <Input type="email" placeholder="ornek@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </FormGroup>
              <FormGroup>
                <Label>Şifre</Label>
                <Input type="password" placeholder="••••••••" value={sifre} onChange={(e) => setSifre(e.target.value)} required />
              </FormGroup>
              {tab === "Öğrenci Kaydı" && (
                <FormGroup>
                  <Label>Davet Kodu</Label>
                  <Input placeholder="Koçunuzdan alınan kod" value={kod} onChange={(e) => setKod(e.target.value.toUpperCase())} required />
                </FormGroup>
              )}
              {tab === "Veli Kaydı" && (
                <FormGroup>
                  <Label>Bağlantı Kodu</Label>
                  <Input placeholder="Koçtan veya çocuğunuzdan alınan kod" value={kod} onChange={(e) => setKod(e.target.value.toUpperCase())} required />
                </FormGroup>
              )}

              {hata && <p style={{ fontSize: 13, color: "#C4503A", fontWeight: 500 }}>{hata}</p>}
              {bilgi && <p style={{ fontSize: 13, color: "#2A9D8F", fontWeight: 500 }}>{bilgi}</p>}

              <Btn variant="primary" type="submit" disabled={gonderiliyor || !email || !sifre} style={{ marginTop: 4, width: "100%" }}>
                {gonderiliyor ? "Gönderiliyor…" : tab}
              </Btn>

              {tab === "Giriş Yap" && (
                <button
                  type="button"
                  onClick={() => { setAlt("sifre"); mesajTemizle(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: "rgba(15,27,45,0.55)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3, alignSelf: "center", marginTop: 4 }}
                >
                  Şifremi Unuttum?
                </button>
              )}
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
