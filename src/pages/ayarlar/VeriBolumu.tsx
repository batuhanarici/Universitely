import { useState } from "react";
import { Card, Btn, useToast } from "../../components/ui";
import { verileriTopla, jsonIndir } from "../../lib/ayarlarQueries";
import HesapSilmeBolumu from "./HesapSilmeBolumu";

export default function VeriBolumu() {
  const { toast, show } = useToast();
  const [indiriliyor, setIndiriliyor] = useState(false);

  async function indir() {
    setIndiriliyor(true);
    try {
      const veri = await verileriTopla();
      jsonIndir(`universitely-verilerim-${new Date().toISOString().slice(0, 10)}`, veri);
      show("Verilerin indirildi ✓");
    } catch {
      show("Veriler indirilemedi.");
    } finally {
      setIndiriliyor(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <h2 className="section-title" style={{ marginBottom: 14 }}>Verilerini İndir</h2>
        <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", lineHeight: 1.6, margin: "0 0 12px" }}>
          Hesabındaki tüm verilerin bir kopyasını (çalışmalar, sınav sonuçları, görevler, tekrar planları,
          mesajlar vb.) JSON dosyası olarak indirebilirsin.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn variant="primary" onClick={indir} disabled={indiriliyor}>
            {indiriliyor ? "Hazırlanıyor…" : "Verilerimi İndir"}
          </Btn>
        </div>
      </Card>

      <HesapSilmeBolumu />

      <Card>
        <h2 className="section-title" style={{ marginBottom: 14 }}>Hakkında</h2>
        <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", lineHeight: 1.6, margin: 0 }}>
          <strong>Universitely</strong> — koçların, öğrencilerin ve velilerin çalışma, deneme ve iletişim
          süreçlerini tek panelde toplayan bir sınav hazırlık platformudur. Verilerin yalnızca sen ve
          yetkilendirdiğin kişilerce görüntülenir.
        </p>
      </Card>

      {toast}
    </div>
  );
}
