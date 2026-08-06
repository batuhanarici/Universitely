import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { StudentLayout } from "../../components/Layout";
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
import Bildirimler from "./Bildirimler";
import Oneriler from "./Oneriler";
import HaftalikRapor from "./HaftalikRapor";
import Karsilastirma from "./Karsilastirma";
import Motivasyon from "./Motivasyon";

type Sekme =
  | "/student/dashboard" | "/student/profile" | "/student/study" | "/student/subjects" | "/student/tasks"
  | "/student/resources" | "/student/exams" | "/student/analysis" | "/student/wrongs" | "/student/repetition"
  | "/student/calendar" | "/student/messages" | "/student/notifications" | "/student/ai-coach" | "/student/weekly-report"
  | "/student/compare" | "/student/motivation";

export default function OgrenciPaneli() {
  const [sekme, setSekme] = useState<Sekme>("/student/dashboard");

  const git = (path: string) => {
    if (path === "/") {
      supabase.auth.signOut();
      return;
    }
    setSekme(path as Sekme);
  };

  return (
    <StudentLayout activePath={sekme} onNavigate={git}>
      <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {sekme === "/student/dashboard" && <Dashboard />}
        {sekme === "/student/profile" && <Profil />}
        {sekme === "/student/study" && <Calisma />}
        {sekme === "/student/subjects" && <Konular />}
        {sekme === "/student/resources" && <Kaynaklar />}
        {sekme === "/student/exams" && <Denemeler />}
        {sekme === "/student/analysis" && <Analiz />}
        {sekme === "/student/wrongs" && <Yanlislar />}
        {sekme === "/student/repetition" && <Tekrar />}
        {sekme === "/student/calendar" && <Takvim />}
        {sekme === "/student/messages" && <Mesaj />}
        {sekme === "/student/notifications" && <Bildirimler />}
        {sekme === "/student/ai-coach" && <Oneriler />}
        {sekme === "/student/weekly-report" && <HaftalikRapor />}
        {sekme === "/student/compare" && <Karsilastirma />}
        {sekme === "/student/motivation" && <Motivasyon />}
        {sekme === "/student/tasks" && <Gorevler />}
      </div>
    </StudentLayout>
  );
}
