import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { StudentLayout } from "../../components/Layout";
import ProfilOverlay from "../../components/ProfilOverlay";
import Dashboard from "./Dashboard";
import Profil from "./Profil";
import Calisma from "./Calisma";
import Konular from "./Konular";
import Gorevler from "./Gorevler";
import Kaynaklar from "./Kaynaklar";
import Denemeler from "./Denemeler";
import Analiz from "./Analiz";
import Yanlislar from "./Yanlislar";
import Tekrar from "./Tekrar";
import Takvim from "./Takvim";
import Mesaj from "./Mesaj";
import Oneriler from "./Oneriler";
import HaftalikRapor from "./HaftalikRapor";
import Karsilastirma from "./Karsilastirma";
import Motivasyon from "./Motivasyon";
import BildirimMerkezi from "../BildirimMerkezi";

type Sekme =
  | "/student/dashboard" | "/student/study" | "/student/subjects" | "/student/tasks"
  | "/student/resources" | "/student/exams" | "/student/analysis" | "/student/wrongs" | "/student/repetition"
  | "/student/calendar" | "/student/messages" | "/student/notifications" | "/student/ai-coach" | "/student/weekly-report"
  | "/student/compare" | "/student/motivation";

export default function OgrenciPaneli() {
  const [sekme, setSekme] = useState<Sekme>("/student/dashboard");
  const [profilAcilik, setProfilAcilik] = useState(false);

  const git = (path: string) => {
    if (path === "/") {
      supabase.auth.signOut();
      return;
    }
    setSekme(path as Sekme);
  };

  return (
    <>
      <StudentLayout activePath={sekme} onNavigate={git} onProfilAcil={() => setProfilAcilik(true)}>
        <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {sekme === "/student/dashboard" && <Dashboard />}
          {sekme === "/student/study" && <Calisma />}
          {sekme === "/student/subjects" && <Konular />}
          {sekme === "/student/resources" && <Kaynaklar />}
          {sekme === "/student/exams" && <Denemeler />}
          {sekme === "/student/analysis" && <Analiz />}
          {sekme === "/student/wrongs" && <Yanlislar />}
          {sekme === "/student/repetition" && <Tekrar />}
          {sekme === "/student/calendar" && <Takvim />}
          {sekme === "/student/messages" && <Mesaj />}
          {sekme === "/student/notifications" && <BildirimMerkezi onNavigate={git} />}
          {sekme === "/student/ai-coach" && <Oneriler />}
          {sekme === "/student/weekly-report" && <HaftalikRapor />}
          {sekme === "/student/compare" && <Karsilastirma />}
          {sekme === "/student/motivation" && <Motivasyon />}
          {sekme === "/student/tasks" && <Gorevler />}
        </div>
      </StudentLayout>

      {profilAcilik && (
        <ProfilOverlay
          baslik="Profil"
          altBaslik="Hesap bilgilerini ve hedeflerini yönet"
          onKapat={() => setProfilAcilik(false)}
        >
          <Profil />
        </ProfilOverlay>
      )}
    </>
  );
}
