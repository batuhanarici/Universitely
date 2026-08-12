import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./lib/AuthContext";
import { supabase, supabaseConfigurada } from "./lib/supabase";
import { turGosterilmeliMi, turGorulduIsaretle } from "./lib/ogretmenProfilQueries";
import { kocRehberGiris, kocRehberGruplari, kocRehberKapanis } from "./lib/kocRehberIcerik";
import KurulumEkrani from "./pages/KurulumEkrani";
import { PanelLayout } from "./components/Layout";
import ProfilOverlay from "./components/ProfilOverlay";
import type { NavGroup } from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoading from "./components/PageLoading";

const GirisEkrani = lazy(() => import("./pages/GirisEkrani"));
const SifreSifirlama = lazy(() => import("./pages/SifreSifirlama"));
const LandingPage = lazy(() => import("./pages/landing/LandingPage"));
const OgrenciPaneli = lazy(() => import("./pages/ogrenci/OgrenciPaneli"));
const VeliPaneli = lazy(() => import("./pages/veli/VeliPaneli"));
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
const GorevYonetimi = lazy(() => import("./pages/ogretmen/GorevYonetimi"));
const KaynakAta = lazy(() => import("./pages/ogretmen/KaynakAta"));
const KonuAta = lazy(() => import("./pages/ogretmen/KonuAta"));
const KocProfil = lazy(() => import("./pages/ogretmen/Profil"));
const AyarlarSayfasi = lazy(() => import("./pages/ayarlar/AyarlarSayfasi"));
const BildirimMerkezi = lazy(() => import("./pages/BildirimMerkezi"));
const YardimSayfasi = lazy(() => import("./pages/ogretmen/YardimSayfasi"));
const OnboardingTuru = lazy(() => import("./components/OnboardingTuru"));

type Sekme = "koc-dashboard" | "sinif" | "sinif-analiz" | "ogrenciler" | "ogrenci-detay" | "ders-konu" | "sablon" | "deneme" | "sonuc" | "toplu-sonuc" | "program" | "kaynak-ata" | "konu-ata" | "gorev-yonetim" | "mesajlar" | "koc-notlar" | "gorusme-yonetim" | "toplu-bildirim" | "ogretmen-rapor" | "koc-ai" | "muhasebe" | "bildirimler";

const KOC_NAV: NavGroup[] = [
  { group: "Genel", items: [
    { path: "koc-dashboard", label: "Koç Paneli", icon: "home" },
    { path: "koc-ai", label: "AI Risk", icon: "alert" },
    { path: "muhasebe", label: "Muhasebe", icon: "money" },
  ]},
  { group: "Sınıf", items: [
    { path: "sinif", label: "Sınıf Genel", icon: "chart" },
    { path: "sinif-analiz", label: "Sınıf Analiz", icon: "grid" },
    { path: "ogrenciler", label: "Öğrenciler", icon: "students" },
    { path: "program", label: "Haftalık Program", icon: "calendar" },
  ]},
  { group: "Atama", items: [
    { path: "gorev-yonetim", label: "Görev Yönetimi", icon: "task" },
    { path: "kaynak-ata", label: "Kaynak Ata", icon: "resource" },
    { path: "konu-ata", label: "Konu Ata", icon: "book" },
    { path: "ders-konu", label: "Ders / Konu", icon: "template" },
  ]},
  { group: "Denemeler", items: [
    { path: "sablon", label: "Deneme Şablonu", icon: "template" },
    { path: "deneme", label: "Deneme Oluştur", icon: "plus" },
    { path: "sonuc", label: "Sonuç Gir", icon: "check" },
    { path: "toplu-sonuc", label: "Toplu Sonuç", icon: "grid" },
  ]},
  { group: "İletişim", items: [
    { path: "mesajlar", label: "Mesajlar", icon: "message" },
    { path: "bildirimler", label: "Bildirimler", icon: "bell" },
    { path: "koc-notlar", label: "Koç Notları", icon: "note" },
    { path: "gorusme-yonetim", label: "Görüşmeler", icon: "meeting" },
    { path: "toplu-bildirim", label: "Toplu Bildirim", icon: "send" },
    { path: "ogretmen-rapor", label: "Sınıf Raporu", icon: "report" },
  ]},
];

function OgretmenUygulamasi() {
  const [sekme, setSekme] = useState<Sekme>("koc-dashboard");
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
    setSekme("ogrenci-detay");
  }

  function git(path: string) {
    if (path === "/") {
      supabase.auth.signOut();
      return;
    }
    if (ayarlarAcilik) setAyarlarAcilik(false);
    if (yardimAcilik) setYardimAcilik(false);
    setSekme(path as Sekme);
  }

  return (
    <>
      {turAcik && (
        <Suspense fallback={null}>
          <OnboardingTuru giris={kocRehberGiris} gruplar={kocRehberGruplari} kapanis={kocRehberKapanis} onTamamla={turuKapat} />
        </Suspense>
      )}
      <PanelLayout
        navConfig={KOC_NAV}
        roleLabel="Koç Paneli"
        activePath={sekme === "ogrenci-detay" ? "ogrenciler" : sekme}
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
          {sekme === "koc-dashboard" && <KocDashboard onOgrenciSec={ogrenciDetayinaGit} />}
          {sekme === "sinif" && <SinifGenel />}
          {sekme === "sinif-analiz" && <SinifAnaliz />}
          {sekme === "ogrenciler" && <OgrenciYonetimi onOgrenciSec={ogrenciDetayinaGit} />}
          {sekme === "ogrenci-detay" && <OgrenciDetay ogrenciId={seciliOgrenci ?? ""} onGeri={() => setSekme("ogrenciler")} />}
          {sekme === "ders-konu" && <DersKonuYonetimi />}
          {sekme === "sablon" && <SablonOlustur />}
          {sekme === "deneme" && <DenemeOlustur />}
          {sekme === "sonuc" && <SonucGir />}
          {sekme === "toplu-sonuc" && <TopluSonucGir />}
          {sekme === "program" && <ProgramYonetimi />}
          {sekme === "gorev-yonetim" && <GorevYonetimi />}
          {sekme === "kaynak-ata" && <KaynakAta />}
          {sekme === "konu-ata" && <KonuAta />}
          {sekme === "mesajlar" && <OgretmenMesajlar />}
          {sekme === "bildirimler" && <BildirimMerkezi onNavigate={git} />}
          {sekme === "koc-notlar" && <KocNotlar />}
          {sekme === "gorusme-yonetim" && <GorusmeYonetimi />}
          {sekme === "toplu-bildirim" && <TopluBildirim />}
          {sekme === "ogretmen-rapor" && <OgretmenRapor />}
          {sekme === "koc-ai" && <KocAI onOgrenciSec={ogrenciDetayinaGit} />}
          {sekme === "muhasebe" && <Muhasebe />}
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
  const { session, yukleniyor, ogrenciMi, veliMi, sifreSifirlama } = useAuth();
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