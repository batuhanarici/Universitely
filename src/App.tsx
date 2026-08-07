import { useState, type ReactNode } from "react";
import { useAuth } from "./lib/AuthContext";
import { supabase, supabaseConfigurada } from "./lib/supabase";
import GirisEkrani from "./pages/GirisEkrani";
import SifreSifirlama from "./pages/SifreSifirlama";
import KurulumEkrani from "./pages/KurulumEkrani";
import OgrenciPaneli from "./pages/ogrenci/OgrenciPaneli";
import DersKonuYonetimi from "./pages/ogretmen/DersKonuYonetimi";
import SablonOlustur from "./pages/ogretmen/SablonOlustur";
import DenemeOlustur from "./pages/ogretmen/DenemeOlustur";
import SonucGir from "./pages/ogretmen/SonucGir";
import SinifGenel from "./pages/ogretmen/SinifGenel";
import SinifAnaliz from "./pages/ogretmen/SinifAnaliz";
import TopluSonucGir from "./pages/ogretmen/TopluSonucGir";
import OgretmenMesajlar from "./pages/ogretmen/OgretmenMesajlar";
import KocDashboard from "./pages/ogretmen/KocDashboard";
import OgrenciYonetimi from "./pages/ogretmen/OgrenciYonetimi";
import OgrenciDetay from "./pages/ogretmen/OgrenciDetay";
import KocNotlar from "./pages/ogretmen/KocNotlar";
import GorusmeYonetimi from "./pages/ogretmen/GorusmeYonetimi";
import TopluBildirim from "./pages/ogretmen/TopluBildirim";
import OgretmenRapor from "./pages/ogretmen/OgretmenRapor";
import KocAI from "./pages/ogretmen/KocAI";
import Muhasebe from "./pages/ogretmen/Muhasebe";
import ProgramYonetimi from "./pages/ogretmen/ProgramYonetimi";
import GorevYonetimi from "./pages/ogretmen/GorevYonetimi";
import KaynakAta from "./pages/ogretmen/KaynakAta";
import KonuAta from "./pages/ogretmen/KonuAta";
import VeliPaneli from "./pages/veli/VeliPaneli";
import { PanelLayout } from "./components/Layout";
import type { NavGroup } from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

type Sekme = "koc-dashboard" | "sinif" | "sinif-analiz" | "ogrenciler" | "ogrenci-detay" | "ders-konu" | "sablon" | "deneme" | "sonuc" | "toplu-sonuc" | "program" | "kaynak-ata" | "konu-ata" | "gorev-yonetim" | "mesajlar" | "koc-notlar" | "gorusme-yonetim" | "toplu-bildirim" | "ogretmen-rapor" | "koc-ai" | "muhasebe";

const KOC_NAV: NavGroup[] = [
  { group: "Genel", items: [
    { path: "koc-dashboard", label: "Koç Paneli", icon: "home" },
    { path: "koc-ai", label: "AI Risk", icon: "alert" },
    { path: "muhasebe", label: "Muhasebe", icon: "money" },
  ]},
  { group: "Sınıf", items: [
    { path: "sinif", label: "Sınıf Genel", icon: "chart" },
    { path: "sinif-analiz", label: "Sınıf Analiz", icon: "grid" },
    { path: "ogrenciler", label: "Öğrenciler", icon: "students" },
    { path: "program", label: "Haftalık Program", icon: "calendar" },
  ]},
  { group: "Atama", items: [
    { path: "gorev-yonetim", label: "Görev Yönetimi", icon: "task" },
    { path: "kaynak-ata", label: "Kaynak Ata", icon: "resource" },
    { path: "konu-ata", label: "Konu Ata", icon: "book" },
    { path: "ders-konu", label: "Ders / Konu", icon: "template" },
  ]},
  { group: "Denemeler", items: [
    { path: "sablon", label: "Deneme Şablonu", icon: "template" },
    { path: "deneme", label: "Deneme Oluştur", icon: "plus" },
    { path: "sonuc", label: "Sonuç Gir", icon: "check" },
    { path: "toplu-sonuc", label: "Toplu Sonuç", icon: "grid" },
  ]},
  { group: "İletişim", items: [
    { path: "mesajlar", label: "Mesajlar", icon: "message" },
    { path: "koc-notlar", label: "Koç Notları", icon: "note" },
    { path: "gorusme-yonetim", label: "Görüşme & Ödeme", icon: "meeting" },
    { path: "toplu-bildirim", label: "Toplu Bildirim", icon: "send" },
    { path: "ogretmen-rapor", label: "Sınıf Raporu", icon: "report" },
  ]},
];

function OgretmenUygulamasi() {
  const [sekme, setSekme] = useState<Sekme>("koc-dashboard");
  const [seciliOgrenci, setSeciliOgrenci] = useState<string | null>(null);

  function ogrenciDetayinaGit(id: string) {
    setSeciliOgrenci(id);
    setSekme("ogrenci-detay");
  }

  function git(path: string) {
    if (path === "/") {
      supabase.auth.signOut();
      return;
    }
    setSekme(path as Sekme);
  }

  return (
    <PanelLayout
      navConfig={KOC_NAV}
      roleLabel="Koç Paneli"
      activePath={sekme === "ogrenci-detay" ? "ogrenciler" : sekme}
      onNavigate={git}
    >
      <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {sekme === "koc-dashboard" && <KocDashboard onOgrenciSec={ogrenciDetayinaGit} />}
        {sekme === "sinif" && <SinifGenel />}
        {sekme === "sinif-analiz" && <SinifAnaliz />}
        {sekme === "ogrenciler" && <OgrenciYonetimi onOgrenciSec={ogrenciDetayinaGit} />}
        {sekme === "ogrenci-detay" && <OgrenciDetay ogrenciId={seciliOgrenci ?? ""} onGeri={() => setSekme("ogrenciler")} />}
        {sekme === "ders-konu" && <DersKonuYonetimi />}
        {sekme === "sablon" && <SablonOlustur />}
        {sekme === "deneme" && <DenemeOlustur />}
        {sekme === "sonuc" && <SonucGir />}
        {sekme === "toplu-sonuc" && <TopluSonucGir />}
        {sekme === "program" && <ProgramYonetimi />}
        {sekme === "gorev-yonetim" && <GorevYonetimi />}
        {sekme === "kaynak-ata" && <KaynakAta />}
        {sekme === "konu-ata" && <KonuAta />}
        {sekme === "mesajlar" && <OgretmenMesajlar />}
        {sekme === "koc-notlar" && <KocNotlar />}
        {sekme === "gorusme-yonetim" && <GorusmeYonetimi />}
        {sekme === "toplu-bildirim" && <TopluBildirim />}
        {sekme === "ogretmen-rapor" && <OgretmenRapor />}
        {sekme === "koc-ai" && <KocAI onOgrenciSec={ogrenciDetayinaGit} />}
        {sekme === "muhasebe" && <Muhasebe />}
      </div>
    </PanelLayout>
  );
}

function App() {
  const { session, yukleniyor, ogrenciMi, veliMi, sifreSifirlama } = useAuth();

  let icerik: ReactNode;
  if (!supabaseConfigurada) {
    icerik = <KurulumEkrani />;
  } else if (yukleniyor) {
    icerik = <p style={{ textAlign: "center", marginTop: 100 }}>Yükleniyor…</p>;
  } else if (sifreSifirlama) {
    icerik = <SifreSifirlama />;
  } else if (!session) {
    icerik = <GirisEkrani />;
  } else if (veliMi) {
    icerik = <VeliPaneli />;
  } else if (ogrenciMi === null) {
    icerik = <p style={{ textAlign: "center", marginTop: 100 }}>Yükleniyor…</p>;
  } else if (ogrenciMi) {
    icerik = <OgrenciPaneli />;
  } else {
    icerik = <OgretmenUygulamasi />;
  }

  return <ErrorBoundary>{icerik}</ErrorBoundary>;
}

export default App;
