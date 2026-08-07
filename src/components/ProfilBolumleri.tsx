import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { Card, Btn, Input, Label, FormGroup } from "./ui";

function HataMetni({ mesaj }: { mesaj: string }) {
  if (!mesaj) return null;
  return <p style={{ fontSize: 13, color: "#C4503A", fontWeight: 500 }}>{mesaj}</p>;
}

// ── Ad Soyad düzenleme ─────────────────────────────────────────────────────
export function AdSoyadBolumu({ adSoyad, onKaydet, show }: {
  adSoyad: string;
  onKaydet: (yeni: string) => Promise<void>;
  show: (m: string) => void;
}) {
  const [deger, setDeger] = useState(adSoyad);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");

  useEffect(() => setDeger(adSoyad), [adSoyad]);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!deger.trim()) {
      setHata("Ad soyad gerekli.");
      return;
    }
    setKaydediliyor(true);
    setHata("");
    try {
      await onKaydet(deger.trim());
      show("Ad soyad güncellendi ✓");
    } catch (err: any) {
      setHata(err.message ?? "Kaydedilemedi.");
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <Card>
      <h2 className="section-title" style={{ marginBottom: 16 }}>Ad Soyad</h2>
      <form onSubmit={gonder} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <FormGroup>
          <Label>Ad Soyad</Label>
          <Input value={deger} onChange={(e) => setDeger(e.target.value)} placeholder="Adınız Soyadınız" />
        </FormGroup>
        <HataMetni mesaj={hata} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn variant="primary" type="submit" disabled={kaydediliyor}>
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </Btn>
        </div>
      </form>
    </Card>
  );
}

// ── Güvenlik: şifre + e-posta değiştirme ───────────────────────────────────
export function GuvvenlikBolumu({ show }: { show: (m: string) => void }) {
  const { session } = useAuth();

  const [mSifre, setMSifre] = useState("");
  const [ySifre, setYSifre] = useState("");
  const [ySifre2, setYSifre2] = useState("");
  const [sifreHata, setSifreHata] = useState("");
  const [sifreGonderiliyor, setSifreGonderiliyor] = useState(false);

  const [yeniEmail, setYeniEmail] = useState("");
  const [emailHata, setEmailHata] = useState("");
  const [emailGonderiliyor, setEmailGonderiliyor] = useState(false);

  async function sifreGonder(e: React.FormEvent) {
    e.preventDefault();
    setSifreHata("");
    if (!mSifre || !ySifre) {
      setSifreHata("Tüm alanları doldur.");
      return;
    }
    if (ySifre.length < 6) {
      setSifreHata("Yeni şifre en az 6 karakter olmalı.");
      return;
    }
    if (ySifre !== ySifre2) {
      setSifreHata("Yeni şifreler eşleşmiyor.");
      return;
    }
    setSifreGonderiliyor(true);
    try {
      const eposta = session?.user.email ?? "";
      const { error: dogrulama } = await supabase.auth.signInWithPassword({ email: eposta, password: mSifre });
      if (dogrulama) throw dogrulama;
      const { error } = await supabase.auth.updateUser({ password: ySifre });
      if (error) throw error;
      setMSifre("");
      setYSifre("");
      setYSifre2("");
      show("Şifren güncellendi ✓");
    } catch (err: any) {
      setSifreHata(err.message ?? "Şifre güncellenemedi.");
    } finally {
      setSifreGonderiliyor(false);
    }
  }

  async function emailGonder(e: React.FormEvent) {
    e.preventDefault();
    setEmailHata("");
    if (!yeniEmail.trim()) {
      setEmailHata("Yeni e-posta adresi gerekli.");
      return;
    }
    setEmailGonderiliyor(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: yeniEmail.trim() },
        { emailRedirectTo: window.location.origin }
      );
      if (error) throw error;
      setYeniEmail("");
      show("Yeni adresine onay bağlantısı gönderildi ✓");
    } catch (err: any) {
      setEmailHata(err.message ?? "E-posta güncellenemedi.");
    } finally {
      setEmailGonderiliyor(false);
    }
  }

  return (
    <Card>
      <h2 className="section-title" style={{ marginBottom: 18 }}>Güvenlik</h2>

      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 8 }}>
        Şifre Değiştir
      </p>
      <form onSubmit={sifreGonder} style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        <FormGroup>
          <Label>Mevcut Şifre</Label>
          <Input type="password" placeholder="••••••••" value={mSifre} onChange={(e) => setMSifre(e.target.value)} />
        </FormGroup>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <FormGroup style={{ flex: 1, minWidth: 180 }}>
            <Label>Yeni Şifre</Label>
            <Input type="password" placeholder="En az 6 karakter" value={ySifre} onChange={(e) => setYSifre(e.target.value)} />
          </FormGroup>
          <FormGroup style={{ flex: 1, minWidth: 180 }}>
            <Label>Yeni Şifre (Tekrar)</Label>
            <Input type="password" placeholder="••••••••" value={ySifre2} onChange={(e) => setYSifre2(e.target.value)} />
          </FormGroup>
        </div>
        <HataMetni mesaj={sifreHata} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn variant="primary" type="submit" disabled={sifreGonderiliyor}>
            {sifreGonderiliyor ? "Güncelleniyor…" : "Şifreyi Güncelle"}
          </Btn>
        </div>
      </form>

      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)", marginBottom: 8 }}>
        E-posta Değiştir
      </p>
      <form onSubmit={emailGonder} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <FormGroup>
          <Label>Yeni E-posta</Label>
          <Input type="email" placeholder="yeni@mail.com" value={yeniEmail} onChange={(e) => setYeniEmail(e.target.value)} />
        </FormGroup>
        <HataMetni mesaj={emailHata} />
        <p style={{ fontSize: 12, color: "rgba(15,27,45,0.5)", margin: 0 }}>
          Yeni adresine onay bağlantısı gönderilir; onaylayana kadar hesabın mevcut adresle çalışır.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn variant="primary" type="submit" disabled={emailGonderiliyor}>
            {emailGonderiliyor ? "Gönderiliyor…" : "E-postayı Değiştir"}
          </Btn>
        </div>
      </form>
    </Card>
  );
}

// ── Bildirim tercihi ────────────────────────────────────────────────────────
export function BildirimBolumu({ emailBildirim, onChange, aciklama, show }: {
  emailBildirim: boolean;
  onChange: (v: boolean) => Promise<void>;
  aciklama: string;
  show: (m: string) => void;
}) {
  const [deger, setDeger] = useState(emailBildirim);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => setDeger(emailBildirim), [emailBildirim]);

  async function degistir(v: boolean) {
    setDeger(v);
    setKaydediliyor(true);
    try {
      await onChange(v);
      show("Bildirim tercihi kaydedildi ✓");
    } catch {
      setDeger(!v);
      show("Kaydedilemedi.");
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <Card>
      <h2 className="section-title" style={{ marginBottom: 14 }}>Bildirimler</h2>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13 }}>
        <input type="checkbox" className="checkbox" checked={deger} disabled={kaydediliyor} onChange={(e) => degistir(e.target.checked)} style={{ marginTop: 2 }} />
        <span>
          <strong>E-posta bildirimleri</strong>
          <span style={{ color: "rgba(15,27,45,0.5)", fontSize: 12, display: "block", marginTop: 2 }}>{aciklama}</span>
        </span>
      </label>
    </Card>
  );
}
