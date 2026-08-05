import { useState, type ReactNode } from "react";
import { useAuth } from "./lib/AuthContext";
import { supabase, supabaseConfigurada } from "./lib/supabase";
import GirisEkrani from "./pages/GirisEkrani";
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
import ProgramYonetimi from "./pages/ogretmen/ProgramYonetimi";
import GorevYonetimi from "./pages/ogretmen/GorevYonetimi";
import KaynakAta from "./pages/ogretmen/KaynakAta";
import KonuAta from "./pages/ogretmen/KonuAta";
import VeliPaneli from "./pages/veli/VeliPaneli";
import UYArrow from "./components/UYArrow";
import ErrorBoundary from "./components/ErrorBoundary";

type Sekme = "koc-dashboard" | "sinif" | "sinif-analiz" | "ogrenciler" | "ogrenci-detay" | "ders-konu" | "sablon" | "deneme" | "sonuc" | "toplu-sonuc" | "program" | "kaynak-ata" | "konu-ata" | "gorev-yonetim" | "mesajlar" | "koc-notlar" | "gorusme-yonetim" | "toplu-bildirim" | "ogretmen-rapor";

const SEKMELER: { id: Sekme; etiket: string; icon: string }[] = [
  { id: "koc-dashboard", etiket: "Koç Paneli", icon: "🏠" },
  { id: "sinif", etiket: "Sınıf Genel Durumu", icon: "📊" },
  { id: "sinif-analiz", etiket: "Sınıf Analiz", icon: "📈" },
  { id: "ogrenciler", etiket: "Öğrenciler", icon: "🎓" },
  { id: "program", etiket: "Haftalık Program", icon: "📅" },
  { id: "gorev-yonetim", etiket: "Görev Yönetimi", icon: "📝" },
  { id: "kaynak-ata", etiket: "Kaynak Ata", icon: "📚" },
  { id: "konu-ata", etiket: "Konu Ata", icon: "🎯" },
  { id: "ders-konu", etiket: "Ders / Konu Yönetimi", icon: "🗂️" },
  { id: "sablon", etiket: "Deneme Şablonu Oluştur", icon: "🧩" },
  { id: "deneme", etiket: "Deneme Oluştur", icon: "🗓️" },
  { id: "sonuc", etiket: "Sonuç Gir", icon: "✍️" },
  { id: "toplu-sonuc", etiket: "Toplu Sonuç Gir", icon: "🧮" },
  { id: "mesajlar", etiket: "Mesajlar", icon: "✉️" },
  { id: "koc-notlar", etiket: "Koç Notları", icon: "📝" },
  { id: "gorusme-yonetim", etiket: "Görüşme & Ödeme", icon: "🗓️" },
  { id: "toplu-bildirim", etiket: "Toplu Bildirim", icon: "📣" },
  { id: "ogretmen-rapor", etiket: "Sınıf Raporu", icon: "📄" },
];
function OgretmenUygulamasi() {
  const [sekme, setSekme] = useState<Sekme>("koc-dashboard");
  const [seciliOgrenci, setSeciliOgrenci] = useState<string | null>(null);

  function ogrenciDetayinaGit(id: string) {
    setSeciliOgrenci(id);
    setSekme("ogrenci-detay");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="mark"><UYArrow size={20} color="#E4BB60" /></span>
          <span className="sidebar-logo-text">Universitely</span>
        </div>
        <nav className="sidebar-nav">
          {SEKMELER.map((s) => (
            <button
              key={s.id}
              onClick={() => setSekme(s.id)}
              className={`sidebar-item${sekme === s.id ? " active" : ""}`}
            >
              <span>{s.icon}</span>
              <span>{s.etiket}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={() => supabase.auth.signOut()}>Çıkış Yap</button>
        </div>
      </aside>
      <main className="main-area">
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
      </main>
    </div>
  );
}

function App() {
  const { session, yukleniyor, ogrenciMi, veliMi } = useAuth();

  let icerik: ReactNode;
  if (!supabaseConfigurada) {
    icerik = <KurulumEkrani />;
  } else if (yukleniyor) {
    icerik = <p style={{ textAlign: "center", marginTop: 100 }}>Yükleniyor…</p>;
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
