import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./lib/authContext";
import { supabase, supabaseConfigurada } from "./lib/supabase";
import { turGosterilmeliMi, turGorulduIsaretle } from "./lib/ogretmenProfilQueries";
import { kocRehberGiris, kocRehberGruplari, kocRehberKapanis } from "./lib/kocRehberIcerik";
import KurulumEkrani from "./pages/KurulumEkrani";
import { PanelLayout } from "./components/Layout";
import { coachNav } from "./components/navigation";
import { useBrowserRoute } from "./lib/useBrowserRoute";
import ProfilOverlay from "./components/ProfilOverlay";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoading from "./components/PageLoading";

const GirisEkrani = lazy(() => import("./pages/GirisEkrani"));
const SifreSifirlama = lazy(() => import("./pages/SifreSifirlama"));
const HesapAskida = lazy(() => import("./pages/HesapAskida"));
const LandingPage = lazy(() => import("./pages/landing/LandingPage"));
const OgrenciPaneli = lazy(() => import("./pages/ogrenci/OgrenciPaneli"));
const VeliPaneli = lazy(() => import("./pages/veli/VeliPaneli"));
const AdminPaneli = lazy(() => import("./pages/admin/AdminPaneli"));
const DersKonuYonetimi = lazy(() => import("./pages/ogretmen/DersKonuYonetimi"));
const SablonOlustur = lazy(() => import("./pages/ogretmen/SablonOlustur"));
const DenemeOlustur = lazy(() => import("./pages/ogretmen/DenemeOlustur"));
const SonucGir = lazy(() => import("./pages/ogretmen/SonucGir"));
const SinifGenel = lazy(() => import("./pages/ogretmen/SinifGenel"));
const SinifAnaliz = lazy(() => import("./pages/ogretmen/SinifAnaliz"));
const TopluSonucGir = lazy(() => import("./pages/ogretmen/TopluSonucGir"));
const OgretmenMesajlar = lazy(() => import("./pages/ogretmen/OgretmenMesajlar"));
const KocDashboard = lazy(() => import("./pages/ogretmen/KocDashboard"));
const OgrenciYonetimi = lazy(() => import("./pages/ogretmen/OgrenciYonetimi"));
const OgrenciDetay = lazy(() => import("./pages/ogretmen/OgrenciDetay"));
const KocNotlar = lazy(() => import("./pages/ogretmen/KocNotlar"));
const GorusmeYonetimi = lazy(() => import("./pages/ogretmen/GorusmeYonetimi"));
const TopluBildirim = lazy(() => import("./pages/ogretmen/TopluBildirim"));
const OgretmenRapor = lazy(() => import("./pages/ogretmen/OgretmenRapor"));
const KocAI = lazy(() => import("./pages/ogretmen/KocAI"));
const Muhasebe = lazy(() => import("./pages/ogretmen/Muhasebe"));
const ProgramYonetimi = lazy(() => import("./pages/ogretmen/ProgramYonetimi"));
const DersTakvimi = lazy(() => import("./pages/ogretmen/DersTakvimi"));
const GorevYonetimi = lazy(() => import("./pages/ogretmen/GorevYonetimi"));
const KaynakAta = lazy(() => import("./pages/ogretmen/KaynakAta"));
const KonuAta = lazy(() => import("./pages/ogretmen/KonuAta"));
const KocProfil = lazy(() => import("./pages/ogretmen/Profil"));
const AyarlarSayfasi = lazy(() => import("./pages/ayarlar/AyarlarSayfasi"));
const BildirimMerkezi = lazy(() => import("./pages/BildirimMerkezi"));
const YardimSayfasi = lazy(() => import("./pages/ogretmen/YardimSayfasi"));
const OnboardingTuru = lazy(() => import("./components/OnboardingTuru"));

type Sekme =
  | "/coach/dashboard" | "/coach/risk" | "/coach/accounting" | "/coach/class-overview" | "/coach/class-analysis"
  | "/coach/students" | "/coach/student-detail" | "/coach/weekly-program" | "/coach/lesson-calendar" | "/coach/task-management"
  | "/coach/assign-resource" | "/coach/assign-subject" | "/coach/lesson-management" | "/coach/exam-template"
  | "/coach/create-exam" | "/coach/enter-result" | "/coach/bulk-result" | "/coach/messages"
  | "/coach/notifications" | "/coach/notes" | "/coach/meetings" | "/coach/bulk-notify" | "/coach/class-report";

const KOC_ROUTE_LISTESI = [
  "/coach/dashboard", "/coach/risk", "/coach/accounting", "/coach/class-overview", "/coach/class-analysis",
  "/coach/students", "/coach/student-detail", "/coach/weekly-program", "/coach/lesson-calendar", "/coach/task-management",
  "/coach/assign-resource", "/coach/assign-subject", "/coach/lesson-management", "/coach/exam-template",
  "/coach/create-exam", "/coach/enter-result", "/coach/bulk-result", "/coach/messages", "/coach/notifications",
  "/coach/notes", "/coach/meetings", "/coach/bulk-notify", "/coach/class-report",
] as const satisfies readonly Sekme[];

function OgretmenUygulamasi() {
  const [sekme, navigate] = useBrowserRoute(KOC_ROUTE_LISTESI, "/coach/dashboard");
  const [seciliOgrenci, setSeciliOgrenci] = useState<string | null>(null);
  const [profilAcilik, setProfilAcilik] = useState(false);
  const [ayarlarAcilik, setAyarlarAcilik] = useState(false);
  const [yardimAcilik, setYardimAcilik] = useState(false);
  const [turAcik, setTurAcik] = useState(false);

  useEffect(() => {
    turGosterilmeliMi()
      .then((goster) => setTurAcik(goster))
      .catch(() => {});
  }, []);

  async function turuKapat() {
    setTurAcik(false);
    try {
      await turGorulduIsaretle();
    } catch {
      // sessizce geç — tur bir sonraki girişte tekrar denenir
    }
  }

  function ogrenciDetayinaGit(id: string) {
    setSeciliOgrenci(id);
    navigate("/coach/student-detail");
  }

  function git(path: string) {
    if (path === "/") {
      supabase.auth.signOut();
      return;
    }
    if (ayarlarAcilik) setAyarlarAcilik(false);
    if (yardimAcilik) setYardimAcilik(false);
    if (KOC_ROUTE_LISTESI.includes(path as Sekme)) navigate(path as Sekme);
  }

  return (
    <>
      {turAcik && (
        <Suspense fallback={null}>
          <OnboardingTuru giris={kocRehberGiris} gruplar={kocRehberGruplari} kapanis={kocRehberKapanis} onTamamla={turuKapat} />
        </Suspense>
      )}
      <PanelLayout
        navConfig={coachNav}
        roleLabel="Koç Paneli"
        activePath={sekme === "/coach/student-detail" ? "/coach/students" : sekme}
        onNavigate={git}
        onProfilAcil={() => setProfilAcilik(true)}
        onAyarlarAcil={() => setAyarlarAcilik(true)}
        yardimAcik={yardimAcilik}
        onYardimToggle={() => setYardimAcilik((a) => !a)}
      >
        {ayarlarAcilik ? (
          <Suspense fallback={<PageLoading />}><AyarlarSayfasi /></Suspense>
        ) : (
        <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Suspense fallback={<PageLoading />}>
          {sekme === "/coach/dashboard" && <KocDashboard onOgrenciSec={ogrenciDetayinaGit} onRiskAc={() => navigate("/coach/risk")} />}
          {sekme === "/coach/class-overview" && <SinifGenel />}
          {sekme === "/coach/class-analysis" && <SinifAnaliz />}
          {sekme === "/coach/students" && <OgrenciYonetimi onOgrenciSec={ogrenciDetayinaGit} />}
          {sekme === "/coach/student-detail" && <OgrenciDetay ogrenciId={seciliOgrenci ?? ""} onGeri={() => navigate("/coach/students")} />}
          {sekme === "/coach/lesson-management" && <DersKonuYonetimi />}
          {sekme === "/coach/exam-template" && <SablonOlustur />}
          {sekme === "/coach/create-exam" && <DenemeOlustur />}
          {sekme === "/coach/enter-result" && <SonucGir />}
          {sekme === "/coach/bulk-result" && <TopluSonucGir />}
          {sekme === "/coach/weekly-program" && <ProgramYonetimi />}
          {sekme === "/coach/lesson-calendar" && <DersTakvimi />}
          {sekme === "/coach/task-management" && <GorevYonetimi />}
          {sekme === "/coach/assign-resource" && <KaynakAta />}
          {sekme === "/coach/assign-subject" && <KonuAta />}
          {sekme === "/coach/messages" && <OgretmenMesajlar />}
          {sekme === "/coach/notifications" && <BildirimMerkezi onNavigate={git} />}
          {sekme === "/coach/notes" && <KocNotlar />}
          {sekme === "/coach/meetings" && <GorusmeYonetimi />}
          {sekme === "/coach/bulk-notify" && <TopluBildirim />}
          {sekme === "/coach/class-report" && <OgretmenRapor />}
          {sekme === "/coach/risk" && <KocAI onOgrenciSec={ogrenciDetayinaGit} />}
          {sekme === "/coach/accounting" && <Muhasebe />}
          </Suspense>
        </div>
        )}
      </PanelLayout>

      {profilAcilik && (
        <ProfilOverlay
          baslik="Profil"
          altBaslik="Hesap bilgilerini ve kurum bilgilerini yönet"
          onKapat={() => setProfilAcilik(false)}
        >
          <Suspense fallback={<PageLoading />}><KocProfil /></Suspense>
        </ProfilOverlay>
      )}

      {yardimAcilik && (
        <ProfilOverlay
          baslik="Yardım"
          altBaslik="Koç panelindeki bölümlerin ne işe yaradığına dair kısa bir rehber"
          onKapat={() => setYardimAcilik(false)}
        >
          <Suspense fallback={<PageLoading />}>
            <YardimSayfasi onTuruBaslat={() => { setYardimAcilik(false); setTurAcik(true); }} />
          </Suspense>
        </ProfilOverlay>
      )}
    </>
  );
}

function App() {
  const { session, yukleniyor, ogrenciMi, veliMi, adminMi, hesapAskida, hesapNedeni, sifreSifirlama } = useAuth();
  // "Ücretsiz Dene" ile landing page'den giriş ekranına geçildiğinde true olur.
  const [girisIstendi, setGirisIstendi] = useState(
    () => sessionStorage.getItem("girisIstendi") === "1"
  );

  // Landing page sadece kök path'te ("/"), oturum yokken ve henüz
  // "Ücretsiz Dene"ye tıklanmamışken gösterilir. Tercih sessionStorage'da
  // tutulur; URL değiştirilmez, böylece yenilemede host 404 vermez.
  const anaSayfaGosterilsin =
    supabaseConfigurada &&
    !yukleniyor &&
    !sifreSifirlama &&
    !session &&
    !girisIstendi &&
    window.location.pathname === "/";

  let icerik: ReactNode;
  if (!supabaseConfigurada) {
    icerik = <KurulumEkrani />;
  } else if (yukleniyor) {
    icerik = <p style={{ textAlign: "center", marginTop: 100 }}>Yükleniyor…</p>;
  } else if (sifreSifirlama) {
    icerik = <Suspense fallback={<PageLoading />}><SifreSifirlama /></Suspense>;
  } else if (anaSayfaGosterilsin) {
    icerik = (
      <Suspense fallback={<PageLoading />}>
        <LandingPage
          onGetStarted={() => {
            setGirisIstendi(true);
            sessionStorage.setItem("girisIstendi", "1");
          }}
        />
      </Suspense>
    );
  } else if (!session) {
    icerik = <Suspense fallback={<PageLoading />}><GirisEkrani /></Suspense>;
  } else if (hesapAskida) {
    icerik = <Suspense fallback={<PageLoading />}><HesapAskida neden={hesapNedeni} /></Suspense>;
  } else if (adminMi) {
    icerik = <Suspense fallback={<PageLoading />}><AdminPaneli /></Suspense>;
  } else if (veliMi) {
    icerik = <Suspense fallback={<PageLoading />}><VeliPaneli /></Suspense>;
  } else if (ogrenciMi === null) {
    icerik = <p style={{ textAlign: "center", marginTop: 100 }}>Yükleniyor…</p>;
  } else if (ogrenciMi) {
    icerik = <Suspense fallback={<PageLoading />}><OgrenciPaneli /></Suspense>;
  } else {
    icerik = <OgretmenUygulamasi />;
  }

  return <ErrorBoundary>{icerik}</ErrorBoundary>;
}

export default App;