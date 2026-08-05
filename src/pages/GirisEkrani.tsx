import { useState } from "react";
import { supabase } from "../lib/supabase";
import { davetKodunuDogrula } from "../lib/ogrenciYonetimQueries";
import UYArrow from "../components/UYArrow";

type Mod = "giris" | "ogrenci" | "veli";

export default function GirisEkrani() {
  const [mod, setMod] = useState<Mod>("giris");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [adSoyad, setAdSoyad] = useState("");
  const [kod, setKod] = useState("");
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
      } else if (mod === "ogrenci") {
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
        const { error } = await supabase.auth.signUp({
          email,
          password: sifre,
          options: { data: { ad_soyad: adSoyad.trim(), davet_kodu: kod.trim().toUpperCase() } },
        });
        if (error) throw error;
        setBilgi("Kayıt oluşturuldu. Şimdi giriş yapabilirsin — koçuna otomatik bağlanacaksın.");
        setMod("giris");
      } else {
        if (!adSoyad.trim()) {
          setHata("Ad soyad gerekli.");
          return;
        }
        if (!kod.trim()) {
          setHata("Bağlantı kodu gerekli — koç ya da çocuğunun hesabından alabilirsin.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password: sifre,
          options: { data: { rol: "veli", ad_soyad: adSoyad.trim(), veli_kodu: kod.trim().toUpperCase() } },
        });
        if (error) throw error;
        setBilgi("Veli kaydı oluşturuldu. Şimdi giriş yapabilirsin — çocuğunun hesabına bağlanacaksın.");
        setMod("giris");
      }
    } catch (e: any) {
      setHata(e.message ?? "Bir hata oluştu.");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 30%, rgba(228,187,96,0.14), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ width: "100%", maxWidth: 360, padding: 24, position: "relative" }}>
        <div className="stagger-item" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28, animationDelay: "0s" }}>
          <UYArrow size={44} animateDraw color="#E4BB60" />
          <h1 className="display" style={{ color: "white", fontSize: 24, marginTop: 12 }}>
            Universitely
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>Deneme Takip Sistemi</p>
        </div>

        <div
          className="stagger-item"
          style={{
            background: "var(--ink-surface)",
            border: "1px solid var(--ink-border)",
            borderRadius: "var(--radius)",
            padding: 24,
            animationDelay: "0.1s",
          }}
        >
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(0,0,0,0.2)", padding: 4, borderRadius: 10 }}>
            {(
              [
                { id: "giris", etiket: "Giriş Yap" },
                { id: "ogrenci", etiket: "Öğrenci Kaydı" },
                { id: "veli", etiket: "Veli Kaydı" },
              ] as { id: Mod; etiket: string }[]
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setMod(s.id)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 7, border: "none", fontSize: 12.5, fontWeight: 600,
                  background: mod === s.id ? "var(--gold)" : "transparent",
                  color: mod === s.id ? "var(--ink)" : "rgba(255,255,255,0.6)",
                  transition: "all 0.2s var(--ease)",
                }}
              >
                {s.etiket}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mod !== "giris" && (
              <input
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
                placeholder="Ad Soyad"
                className="input"
                style={{ background: "rgba(255,255,255,0.06)", borderColor: "var(--ink-border)", color: "white" }}
              />
            )}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              type="email"
              className="input"
              style={{ background: "rgba(255,255,255,0.06)", borderColor: "var(--ink-border)", color: "white" }}
            />
            <input
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="Şifre"
              type="password"
              className="input"
              style={{ background: "rgba(255,255,255,0.06)", borderColor: "var(--ink-border)", color: "white" }}
            />
            {mod !== "giris" && (
              <input
                value={kod}
                onChange={(e) => setKod(e.target.value.toUpperCase())}
                placeholder={mod === "ogrenci" ? "Davet kodu (koçundan al)" : "Bağlantı kodu (çocuğunun hesabından)"}
                className="input"
                style={{ background: "rgba(255,255,255,0.06)", borderColor: "var(--ink-border)", color: "white", textTransform: "uppercase" }}
              />
            )}
            <button
              onClick={handleGonder}
              disabled={gonderiliyor || !email || !sifre}
              className="btn btn-gold"
              style={{ marginTop: 6 }}
            >
              {gonderiliyor ? "Gönderiliyor…" : mod === "giris" ? "Giriş Yap" : "Kayıt Ol"}
            </button>
            {hata && <p style={{ color: "#E88B76", fontSize: 12.5 }}>{hata}</p>}
            {bilgi && <p style={{ color: "#7FD9BC", fontSize: 12.5 }}>{bilgi}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
