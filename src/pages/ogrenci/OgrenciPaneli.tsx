import { lazy, Suspense, useState } from "react";
import { supabase } from "../../lib/supabase";
import { StudentLayout } from "../../components/Layout";
import ProfilOverlay from "../../components/ProfilOverlay";
import PageLoading from "../../components/PageLoading";

const Dashboard = lazy(() => import("./Dashboard"));
const Profil = lazy(() => import("./Profil"));
const Calisma = lazy(() => import("./Calisma"));
const Konular = lazy(() => import("./Konular"));
const Gorevler = lazy(() => import("./Gorevler"));
const Kaynaklar = lazy(() => import("./Kaynaklar"));
const Denemeler = lazy(() => import("./Denemeler"));
const Analiz = lazy(() => import("./Analiz"));
const Yanlislar = lazy(() => import("./Yanlislar"));
const Tekrar = lazy(() => import("./Tekrar"));
const Takvim = lazy(() => import("./Takvim"));
const Mesaj = lazy(() => import("./Mesaj"));
const Oneriler = lazy(() => import("./Oneriler"));
const HaftalikRapor = lazy(() => import("./HaftalikRapor"));
const Karsilastirma = lazy(() => import("./Karsilastirma"));
const Motivasyon = lazy(() => import("./Motivasyon"));
const BildirimMerkezi = lazy(() => import("../BildirimMerkezi"));
const AyarlarSayfasi = lazy(() => import("../ayarlar/AyarlarSayfasi"));

type Sekme =
  | "/student/dashboard" | "/student/study" | "/student/subjects" | "/student/tasks"
  | "/student/resources" | "/student/exams" | "/student/analysis" | "/student/wrongs" | "/student/repetition"
  | "/student/calendar" | "/student/messages" | "/student/notifications" | "/student/ai-coach" | "/student/weekly-report"
  | "/student/compare" | "/student/motivation";

export default function OgrenciPaneli() {
  const [sekme, setSekme] = useState<Sekme>("/student/dashboard");
  const [profilAcilik, setProfilAcilik] = useState(false);
  const [ayarlarAcilik, setAyarlarAcilik] = useState(false);

  const git = (path: string) => {
    if (path === "/") {
      supabase.auth.signOut();
      return;
    }
    if (ayarlarAcilik) setAyarlarAcilik(false);
    setSekme(path as Sekme);
  };

  return (
    <>
      <StudentLayout
        activePath={sekme}
        onNavigate={git}
        onProfilAcil={() => setProfilAcilik(true)}
        onAyarlarAcil={() => setAyarlarAcilik(true)}
      >
        {ayarlarAcilik ? (
          <Suspense fallback={<PageLoading />}><AyarlarSayfasi /></Suspense>
        ) : (
        <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Suspense fallback={<PageLoading />}>
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
          </Suspense>
        </div>
        )}
      </StudentLayout>

      {profilAcilik && (
        <ProfilOverlay
          baslik="Profil"
          altBaslik="Hesap bilgilerini ve hedeflerini yönet"
          onKapat={() => setProfilAcilik(false)}
        >
          <Suspense fallback={<PageLoading />}><Profil /></Suspense>
        </ProfilOverlay>
      )}
    </>
  );
}
