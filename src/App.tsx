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

type Sekme = "ders-konu" | "sablon" | "deneme" | "sonuc" | "sinif";

function OgretmenUygulamasi() {
  const [sekme, setSekme] = useState<Sekme>("sinif");

  const sekmeler: { id: Sekme; etiket: string }[] = [
    { id: "sinif", etiket: "Sınıf Genel Durumu" },
    { id: "ders-konu", etiket: "Ders / Konu Yönetimi" },
    { id: "sablon", etiket: "Deneme Şablonu Oluştur" },
    { id: "deneme", etiket: "Deneme Oluştur" },
    { id: "sonuc", etiket: "Sonuç Gir" },
  ];

  return (
    <div>
      <nav style={{ display: "flex", gap: 8, justifyContent: "center", padding: 16, borderBottom: "1px solid #eee" }}>
        {sekmeler.map((s) => (
          <button key={s.id} onClick={() => setSekme(s.id)} style={{ fontWeight: sekme === s.id ? 700 : 400 }}>
            {s.etiket}
          </button>
        ))}
      </nav>
      {sekme === "ders-konu" && <DersKonuYonetimi />}
      {sekme === "sablon" && <SablonOlustur />}
      {sekme === "deneme" && <DenemeOlustur />}
      {sekme === "sonuc" && <SonucGir />}
      {sekme === "sinif" && <SinifGenel />}
    </div>
  );
}

function App() {
  const { session, yukleniyor, ogrenciMi } = useAuth();

  if (yukleniyor) return <p style={{ textAlign: "center", marginTop: 100 }}>Yükleniyor…</p>;
  if (!session) return <GirisEkrani />;
  if (ogrenciMi === null) return <p style={{ textAlign: "center", marginTop: 100 }}>Yükleniyor…</p>;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px" }}>
        <button onClick={() => supabase.auth.signOut()} style={{ fontSize: 13, color: "#999", border: "none", background: "none", cursor: "pointer" }}>
          Çıkış Yap
        </button>
      </div>
      {ogrenciMi ? <OgrenciPaneli /> : <OgretmenUygulamasi />}
    </div>
  );
}

export default App;
