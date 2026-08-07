import { useEffect, useState } from "react";
import { Card, Btn, Input, Label, FormGroup, useToast } from "../../components/ui";
import { useAuth } from "../../lib/AuthContext";
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
  const dogrudan = !ogrenci && !veliMi; // koç

  useEffect(() => {
    if (!ogrenci) {
      setYukleniyor(false);
      return;
    }
    kendiTalepDurumum()
      .then((t) => setTalep(t))
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, [ogrenci]);

  async function yeniTalep() {
    setGonderiliyor(true);
    setHata("");
    try {
      const id = await talepOlustur();
      if (!id) {
        setHata("Talep oluşturulamadı. Koçun atanmış olmalı.");
        return;
      }
      setTalep({ id, kullanici_id: session?.user.id ?? "", durum: "bekliyor", onaylayan_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      show("Silme talebi koçuna iletildi ✓");
    } catch (err: any) {
      setHata(err.message ?? "Talep oluşturulamadı.");
    } finally {
      setGonderiliyor(false);
    }
  }

  async function hesabiSil() {
    if (onayEmail.trim().toLowerCase() !== email.toLowerCase()) {
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

  return (
    <Card>
      <h2 className="section-title" style={{ marginBottom: 14 }}>Hesap Silme</h2>

      {dogrudan && (
        <>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", lineHeight: 1.6, margin: "0 0 12px" }}>
            Hesabını silersen; profil bilgilerin, öğrenci/veli kayıtların, mesajların, bildirimlerin ve
            öğrencilerine ait veriler kalıcı olarak silinir. Bu işlem <strong>geri alınamaz</strong>.
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
            <Btn variant="danger" onClick={hesabiSil} disabled={gonderiliyor || onayEmail.trim().toLowerCase() !== email.toLowerCase()}>
              {gonderiliyor ? "Siliniyor…" : "Hesabımı Kalıcı Olarak Sil"}
            </Btn>
          </div>
        </>
      )}

      {ogrenci && talep?.durum === "bekliyor" && (
        <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", lineHeight: 1.6, margin: 0 }}>
          Hesabını silme talebin <strong>koçunun onayına</strong> gönderildi. Koçun onayladığında hesabın ve
          tüm verilerin kalıcı olarak silinir. Talebi dilediğin gibi koçunla konuşabilirsin.
        </p>
      )}

      {ogrenci && talep?.durum === "onaylandi" && (
        <p style={{ fontSize: 13, color: "#2A9D8F", fontWeight: 600, margin: 0 }}>
          Hesabın siliniyor…
        </p>
      )}

      {ogrenci && talep?.durum === "reddedildi" && (
        <>
          <p style={{ fontSize: 13, color: "#C4503A", lineHeight: 1.6, margin: "0 0 12px" }}>
            Önceki hesap silme talebin koçun tarafından <strong>reddedildi</strong>. İstersen yeni bir talep
            oluşturabilirsin.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="danger" onClick={yeniTalep} disabled={gonderiliyor}>
              {gonderiliyor ? "Oluşturuluyor…" : "Yeni Talep Oluştur"}
            </Btn>
          </div>
        </>
      )}

      {ogrenci && !talep && (
        <>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", lineHeight: 1.6, margin: "0 0 12px" }}>
            Hesabını silmek istersen koçuna bir <strong>hesap silme talebi</strong> iletilir. Talebin
            koçun tarafından onaylandığında hesabın ve tüm verilerin kalıcı olarak silinir.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="danger" onClick={yeniTalep} disabled={gonderiliyor}>
              {gonderiliyor ? "Oluşturuluyor…" : "Hesap Silme Talebi Oluştur"}
            </Btn>
          </div>
        </>
      )}

      {toast}
    </Card>
  );
}
