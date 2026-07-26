import { useState } from "react";
import DersKonuYonetimi from "./pages/ogretmen/DersKonuYonetimi";
import SablonOlustur from "./pages/ogretmen/SablonOlustur";
import DenemeOlustur from "./pages/ogretmen/DenemeOlustur";

type Sekme = "ders-konu" | "sablon" | "deneme";

function App() {
  const [sekme, setSekme] = useState<Sekme>("ders-konu");

  const sekmeler: { id: Sekme; etiket: string }[] = [
    { id: "ders-konu", etiket: "Ders / Konu Yönetimi" },
    { id: "sablon", etiket: "Deneme Şablonu Oluştur" },
    { id: "deneme", etiket: "Deneme Oluştur" },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ display: "flex", gap: 8, justifyContent: "center", padding: 16, borderBottom: "1px solid #eee" }}>
        {sekmeler.map((s) => (
          <button
            key={s.id}
            onClick={() => setSekme(s.id)}
            style={{ fontWeight: sekme === s.id ? 700 : 400 }}
          >
            {s.etiket}
          </button>
        ))}
      </nav>
      {sekme === "ders-konu" && <DersKonuYonetimi />}
      {sekme === "sablon" && <SablonOlustur />}
      {sekme === "deneme" && <DenemeOlustur />}
    </div>
  );
}

export default App;
