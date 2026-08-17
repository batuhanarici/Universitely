import { useToast } from "../../components/useToast";
import { useEffect, useState } from "react";
import { Card, Btn, Input, Label, FormGroup } from "../../components/ui";
import { useAuth } from "../../lib/authContext";
import { supabase } from "../../lib/supabase";
import { kendiTalepDurumum, talepOlustur, hesapSil } from "../../lib/ayarlarQueries";
import type { HesapSilmeTalebi } from "../../types/database";

export default function HesapSilmeBolumu() {
  const { toast, show } = useToast();
  const { session, ogrenciMi, veliMi } = useAuth();
  const email = session?.user.email ?? "";

  const [talep, setTalep] = useState<HesapSilmeTalebi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [onayEmail, setOnayEmail] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState("");

  const ogrenci = ogrenciMi === true;
  const dogrudan = ogrenciMi === false; // koç veya veli: e-postayla doğrudan silme

  useEffect(() => {
    if (ogrenciMi === null) return; // rol henüz belli değil
    if (!ogrenci) {
      setYukleniyor(false);
      return;
    }
    kendiTalepDurumum()
      .then((t) => setTalep(t))
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, [ogrenciMi, ogrenci]);

  const emailUyuyor = onayEmail.trim().toLowerCase() === email.toLowerCase();

  async function yeniTalep() {
    if (!emailUyuyor) {
      setHata("Yazdığın e-posta hesabının e-postasıyla eşleşmiyor.");
      return;
    }
    setGonderiliyor(true);
    setHata("");
    try {
      const id = await talepOlustur();
      if (!id) {
        setHata("Talep oluşturulamadı. Koçun atanmış olmalı.");
        return;
      }
      setTalep({ id, kullanici_id: session?.user.id ?? "", durum: "bekliyor", onaylayan_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      setOnayEmail("");
      show("Onay talebin koçuna iletildi ✓");
    } catch (err: any) {
      const m: string = err?.message ?? "";
      setHata(
        /does not exist|talep_olustur|schema cache|relation .*hesap_silme_talepleri/i.test(m)
          ? "Talep altyapısı henüz kurulmamış. Supabase > SQL Editor'de faz13_ayarlar.sql'i çalıştırın."
          : m || "Talep oluşturulamadı."
      );
    } finally {
      setGonderiliyor(false);
    }
  }

  async function hesabiSil() {
    if (!emailUyuyor) {
      setHata("Yazdığın e-posta hesabının e-postasıyla eşleşmiyor.");
      return;
    }
    setGonderiliyor(true);
    setHata("");
    try {
      await hesapSil({ tur: veliMi ? "veli" : "ogretmen", onay_email: onayEmail });
      show("Hesabın silindi ✓");
      setTimeout(() => supabase.auth.signOut(), 600);
    } catch (err: any) {
      setHata(err.message ?? "Silme işlemi başarısız oldu.");
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) {
    return (
      <Card>
        <p style={{ fontSize: 13, color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>
      </Card>
    );
  }

  const dogrudanUyari = veliMi
    ? "Hesabını silersen; veli kaydın, mesajların ve bildirimlerin kalıcı olarak silinir. Çocuğunun öğrenci hesabı etkilenmez. Bu işlem geri alınamaz."
    : "Hesabını silersen; profil bilgilerin, öğrenci ve veli kayıtların, mesajların, bildirimlerin kalıcı olarak silinir. Bu işlem geri alınamaz.";

  return (
    <Card>
      <h2 className="section-title" style={{ marginBottom: 14 }}>Hesap Silme</h2>

      {dogrudan && (
        <>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", lineHeight: 1.6, margin: "0 0 12px" }}>
            {dogrudanUyari}
          </p>
          <FormGroup style={{ marginBottom: 10 }}>
            <Label>E-posta adresini yazarak onayla</Label>
            <Input
              type="email"
              placeholder={email}
              value={onayEmail}
              onChange={(e) => {
                setOnayEmail(e.target.value);
                setHata("");
              }}
            />
          </FormGroup>
          {hata && <p style={{ fontSize: 13, color: "#C4503A", fontWeight: 500, margin: "0 0 10px" }}>{hata}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="danger" onClick={hesabiSil} disabled={gonderiliyor || !emailUyuyor}>
              {gonderiliyor ? "Siliniyor…" : "Hesabımı Kalıcı Olarak Sil"}
            </Btn>
          </div>
        </>
      )}

      {ogrenci && talep?.durum === "bekliyor" && (
        <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", lineHeight: 1.6, margin: 0 }}>
          Onay talebin <strong>koçunun onayına</strong> gönderildi. Koçun onayladığında hesabın ve tüm
          verilerin kalıcı olarak silinir. Talebi dilediğin gibi koçunla konuşabilirsin.
        </p>
      )}

      {ogrenci && talep?.durum === "onaylandi" && (
        <p style={{ fontSize: 13, color: "#C4503A", lineHeight: 1.6, margin: "0 0 12px" }}>
          Hesabın silinmesi onaylandı ancak işlem tamamlanamadı. Lütfen aşağıdan yeni bir talep oluştur.
        </p>
      )}

      {ogrenci && (!talep || talep.durum !== "bekliyor") && (
        <>
          {talep?.durum === "reddedildi" && (
            <p style={{ fontSize: 13, color: "#C4503A", lineHeight: 1.6, margin: "0 0 12px" }}>
              Önceki onay talebin koçun tarafından <strong>reddedildi</strong>. İstersen yeni bir talep
              oluşturabilirsin.
            </p>
          )}
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", lineHeight: 1.6, margin: "0 0 12px" }}>
            Hesabını silmek istiyorsan önce e-posta adresini yazarak doğrula; ardından koçuna bir
            <strong> onay talebi</strong> iletilir. Koçun onayladığında hesabın ve tüm verilerin kalıcı
            olarak silinir.
          </p>
          <FormGroup style={{ marginBottom: 10 }}>
            <Label>E-posta adresini yazarak onayla</Label>
            <Input
              type="email"
              placeholder={email}
              value={onayEmail}
              onChange={(e) => {
                setOnayEmail(e.target.value);
                setHata("");
              }}
            />
          </FormGroup>
          {hata && <p style={{ fontSize: 13, color: "#C4503A", fontWeight: 500, margin: "0 0 10px" }}>{hata}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="danger" onClick={yeniTalep} disabled={gonderiliyor || !emailUyuyor}>
              {gonderiliyor ? "Gönderiliyor…" : "Onay Talebi Oluştur"}
            </Btn>
          </div>
        </>
      )}

      {toast}
    </Card>
  );
}
