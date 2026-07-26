import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function GirisEkrani() {
  const [mod, setMod] = useState<"giris" | "kayit">("giris");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [adSoyad, setAdSoyad] = useState("");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function handleGonder() {
    setHata("");
    setBilgi("");
    setGonderiliyor(true);
    try {
      if (mod === "giris") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: sifre });
        if (error) throw error;
      } else {
        if (!adSoyad.trim()) {
          setHata("Ad soyad gerekli.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password: sifre,
          options: { data: { ad_soyad: adSoyad.trim() } },
        });
        if (error) throw error;
        setBilgi("Kayıt oluşturuldu. Şimdi giriş yapabilirsin.");
        setMod("giris");
      }
    } catch (e: any) {
      setHata(e.message ?? "Bir hata oluştu.");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "100px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, textAlign: "center" }}>Deneme Takip Sistemi</h1>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "16px 0" }}>
        <button onClick={() => setMod("giris")} style={{ fontWeight: mod === "giris" ? 700 : 400 }}>Giriş Yap</button>
        <button onClick={() => setMod("kayit")} style={{ fontWeight: mod === "kayit" ? 700 : 400 }}>Öğrenci Kaydı</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mod === "kayit" && (
          <input
            value={adSoyad}
            onChange={(e) => setAdSoyad(e.target.value)}
            placeholder="Ad Soyad"
            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta"
          type="email"
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <input
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          placeholder="Şifre"
          type="password"
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <button
          onClick={handleGonder}
          disabled={gonderiliyor || !email || !sifre}
          style={{ padding: "10px 18px", borderRadius: 6, background: "#1B2A4A", color: "white", border: "none" }}
        >
          {gonderiliyor ? "Gönderiliyor…" : mod === "giris" ? "Giriş Yap" : "Kayıt Ol"}
        </button>
        {hata && <p style={{ color: "#b5482a", fontSize: 13 }}>{hata}</p>}
        {bilgi && <p style={{ color: "#2e7d6b", fontSize: 13 }}>{bilgi}</p>}
      </div>
    </div>
  );
}
