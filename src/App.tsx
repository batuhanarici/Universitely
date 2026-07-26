import { useState } from "react";
import DersKonuYonetimi from "./pages/ogretmen/DersKonuYonetimi";
import SablonOlustur from "./pages/ogretmen/SablonOlustur";

type Sekme = "ders-konu" | "sablon";

function App() {
  const [sekme, setSekme] = useState<Sekme>("ders-konu");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ display: "flex", gap: 8, justifyContent: "center", padding: 16, borderBottom: "1px solid #eee" }}>
        <button onClick={() => setSekme("ders-konu")} style={{ fontWeight: sekme === "ders-konu" ? 700 : 400 }}>
          Ders / Konu Yönetimi
        </button>
        <button onClick={() => setSekme("sablon")} style={{ fontWeight: sekme === "sablon" ? 700 : 400 }}>
          Deneme Şablonu Oluştur
        </button>
      </nav>
      {sekme === "ders-konu" ? <DersKonuYonetimi /> : <SablonOlustur />}
    </div>
  );
}

export default App;
