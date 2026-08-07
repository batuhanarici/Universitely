import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { ParentLayout } from "../../components/Layout";
import ProfilOverlay from "../../components/ProfilOverlay";
import { VeliVeriProvider } from "./VeliVeri";
import GenelDurum from "./GenelDurum";
import Grafikler from "./Grafikler";
import Takvim from "./Takvim";
import Bildirimler from "./Bildirimler";
import Rapor from "./Rapor";
import AIOzet from "./AIOzet";
import Mesaj from "./Mesaj";
import Profil from "./Profil";

type Sekme =
  | "/parent/overview" | "/parent/charts" | "/parent/calendar" | "/parent/notifications"
  | "/parent/report" | "/parent/ai-summary" | "/parent/message";

export default function VeliPaneli() {
  const [sekme, setSekme] = useState<Sekme>("/parent/overview");
  const [profilAcilik, setProfilAcilik] = useState(false);

  const git = (path: string) => {
    if (path === "/") {
      supabase.auth.signOut();
      return;
    }
    setSekme(path as Sekme);
  };

  return (
    <VeliVeriProvider>
      <ParentLayout activePath={sekme} onNavigate={git} onProfilAcil={() => setProfilAcilik(true)}>
        <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {sekme === "/parent/overview" && <GenelDurum />}
          {sekme === "/parent/charts" && <Grafikler />}
          {sekme === "/parent/calendar" && <Takvim />}
          {sekme === "/parent/notifications" && <Bildirimler />}
          {sekme === "/parent/report" && <Rapor />}
          {sekme === "/parent/ai-summary" && <AIOzet />}
          {sekme === "/parent/message" && <Mesaj />}
        </div>
      </ParentLayout>

      {profilAcilik && (
        <ProfilOverlay
          baslik="Profil"
          altBaslik="Hesap bilgilerini yönet"
          onKapat={() => setProfilAcilik(false)}
        >
          <Profil />
        </ProfilOverlay>
      )}
    </VeliVeriProvider>
  );
}
