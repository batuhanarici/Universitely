import { useToast } from "../../components/useToast";
import { useEffect, useState } from "react";
import { Tabs, Card } from "../../components/ui";
import { GuvvenlikBolumu, BildirimBolumu } from "../../components/ProfilBolumleri";
import { emailBildirimGetir, emailBildirimKaydet } from "../../lib/ayarlarQueries";
import { useAuth } from "../../lib/authContext";
import VeriBolumu from "./VeriBolumu";
import SikayetFormu from "../../components/SikayetFormu";

export default function AyarlarSayfasi() {
  const { toast, show } = useToast();
  const { ogrenciMi, veliMi } = useAuth();
  const [aktif, setAktif] = useState("bildirimler");
  const [emailBildirim, setEmailBildirim] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    emailBildirimGetir()
      .then(setEmailBildirim)
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const aciklama =
    ogrenciMi === true
      ? "Sınav sonuçların, görev hatırlatmaları ve koç mesajların için e-posta."
      : veliMi
        ? "Çocuğunun sınav sonuçları ve koç mesajları için e-posta."
        : "Öğrencilerinden gelen mesajlar ve görev hatırlatmaları için e-posta.";

  return (
    <div className="anim-fade" style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 64px" }}>
      <h1 className="page-title">Ayarlar</h1>
      <p style={{ fontSize: 13, color: "rgba(15,27,45,0.5)", margin: "2px 0 20px" }}>
        Hesap, bildirim ve gizlilik tercihlerini buradan yönetebilirsin.
      </p>

      <Tabs
        tabs={[
          { label: "Bildirimler", value: "bildirimler" },
          { label: "Güvenlik", value: "guvenlik" },
          { label: "Veri & Gizlilik", value: "veri" },
          { label: "Destek", value: "destek" },
        ]}
        active={aktif}
        onChange={setAktif}
      />

      {yukleniyor ? (
        <Card style={{ marginTop: 16 }}>
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>
        </Card>
      ) : (
        aktif === "bildirimler" && (
          <div style={{ marginTop: 16 }}>
            <BildirimBolumu
              emailBildirim={emailBildirim}
              onChange={emailBildirimKaydet}
              aciklama={aciklama}
              show={show}
            />
          </div>
        )
      )}
      {aktif === "guvenlik" && <div style={{ marginTop: 16 }}><GuvvenlikBolumu show={show} /></div>}
      {aktif === "veri" && <div style={{ marginTop: 16 }}><VeriBolumu /></div>}
      {aktif === "destek" && <div style={{ marginTop: 16 }}><SikayetFormu /></div>}

      {toast}
    </div>
  );
}
