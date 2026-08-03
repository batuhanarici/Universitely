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
import UYArrow from "./components/UYArrow";
import ErrorBoundary from "./components/ErrorBoundary";
type Sekme = "sinif" | "ders-konu" | "sablon" | "deneme" | "sonuc";

const SEKMELER: { id: Sekme; etiket: string; icon: string }[] = [
  { id: "sinif", etiket: "Sınıf Genel Durumu", icon: "📊" },
  { id: "ders-konu", etiket: "Ders / Konu Yönetimi", icon: "📚" },
  { id: "sablon", etiket: "Deneme Şablonu Oluştur", icon: "🧩" },
  { id: "deneme", etiket: "Deneme Oluştur", icon: "🗓️" },
  { id: "sonuc", etiket: "Sonuç Gir", icon: "✍️" },
];

function OgretmenUygulamasi() {
  const [sekme, setSekme] = useState<Sekme>("sinif");

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
        {sekme === "sinif" && <SinifGenel />}
        {sekme === "ders-konu" && <DersKonuYonetimi />}
        {sekme === "sablon" && <SablonOlustur />}
        {sekme === "deneme" && <DenemeOlustur />}
        {sekme === "sonuc" && <SonucGir />}
      </main>
    </div>
  );
}

function App() {
  const { session, yukleniyor, ogrenciMi } = useAuth();

  let icerik: ReactNode;
  if (!supabaseConfigurada) {
    icerik = <KurulumEkrani />;
  } else if (yukleniyor || ogrenciMi === null) {
    icerik = <p style={{ textAlign: "center", marginTop: 100 }}>Yükleniyor…</p>;
  } else if (!session) {
    icerik = <GirisEkrani />;
  } else if (ogrenciMi) {
    icerik = <OgrenciPaneli />;
  } else {
    icerik = <OgretmenUygulamasi />;
  }

  return <ErrorBoundary>{icerik}</ErrorBoundary>;
}

export default App;
