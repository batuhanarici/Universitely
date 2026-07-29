import { useState } from "react";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabase";
import GirisEkrani from "./pages/GirisEkrani";
import OgrenciPaneli from "./pages/ogrenci/OgrenciPaneli";
import DersKonuYonetimi from "./pages/ogretmen/DersKonuYonetimi";
import SablonOlustur from "./pages/ogretmen/SablonOlustur";
import DenemeOlustur from "./pages/ogretmen/DenemeOlustur";
import SonucGir from "./pages/ogretmen/SonucGir";
import SinifGenel from "./pages/ogretmen/SinifGenel";
import UYArrow from "./components/UYArrow";

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

  if (yukleniyor) return <p style={{ textAlign: "center", marginTop: 100 }}>Yükleniyor…</p>;
  if (!session) return <GirisEkrani />;
  if (ogrenciMi === null) return <p style={{ textAlign: "center", marginTop: 100 }}>Yükleniyor…</p>;

  if (ogrenciMi) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 20px" }}>
          <button onClick={() => supabase.auth.signOut()} style={{ fontSize: 13, color: "var(--muted)", border: "none", background: "none" }}>
            Çıkış Yap
          </button>
        </div>
        <OgrenciPaneli />
      </div>
    );
  }

  return <OgretmenUygulamasi />;
}

export default App;
