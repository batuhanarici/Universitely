import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/authContext";
import { Card, Btn, Input, Label, FormGroup } from "../components/ui";

export default function SifreSifirlama() {
  const { setSifreSifirlama } = useAuth();
  const [sifre, setSifre] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata("");
    setBilgi("");
    if (sifre.length < 6) {
      setHata("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (sifre !== tekrar) {
      setHata("Şifreler eşleşmiyor.");
      return;
    }
    setGonderiliyor(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: sifre });
      if (error) throw error;
      setBilgi("Şifren güncellendi. Panele yönlendiriliyorsun…");
      window.location.hash = "";
      setTimeout(() => setSifreSifirlama(false), 1200);
    } catch (e: any) {
      setHata(e.message ?? "Bir hata oluştu.");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F4EFE4", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="rule-lines" style={{ position: "fixed", inset: 0, pointerEvents: "none" }} />

      <div className="anim-slide" style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, background: "#fff", border: "1px solid rgba(15,27,45,0.08)", borderRadius: 12, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/icon.svg" alt="Universitely" style={{ width: 48, height: 48, objectFit: "cover" }} />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, color: "#0F1B2D", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Universitely
          </h1>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.5)" }}>TYT/AYT sınavına giden yolunuz</p>
        </div>

        <Card style={{ borderRadius: 14 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#0F1B2D", marginBottom: 6 }}>Yeni Şifre Belirle</h2>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", marginBottom: 20 }}>Hesabın için yeni bir şifre oluştur.</p>

          <form onSubmit={kaydet} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormGroup>
              <Label>Yeni Şifre</Label>
              <Input type="password" placeholder="••••••••" value={sifre} onChange={(e) => setSifre(e.target.value)} required />
            </FormGroup>
            <FormGroup>
              <Label>Şifre Tekrar</Label>
              <Input type="password" placeholder="••••••••" value={tekrar} onChange={(e) => setTekrar(e.target.value)} required />
            </FormGroup>

            {hata && <p style={{ fontSize: 13, color: "#C4503A", fontWeight: 500 }}>{hata}</p>}
            {bilgi && <p style={{ fontSize: 13, color: "#2A9D8F", fontWeight: 500 }}>{bilgi}</p>}

            <Btn variant="primary" type="submit" disabled={gonderiliyor || !sifre || !tekrar} style={{ marginTop: 4, width: "100%" }}>
              {gonderiliyor ? "Kaydediliyor…" : "Şifreyi Güncelle"}
            </Btn>
          </form>
        </Card>
      </div>
    </div>
  );
}
