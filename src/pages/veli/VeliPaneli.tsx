import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ParentLayout } from "../../components/Layout";
import ProfilOverlay from "../../components/ProfilOverlay";
import PageLoading from "../../components/PageLoading";
import { VeliVeriProvider } from "./VeliVeri";
import { useVeliDerived } from "./veliDerived";
import { sistemHatirlatmalariniSenkronla, type SistemHatirlatmasi } from "../../lib/bildirimQueries";

const GenelDurum = lazy(() => import("./GenelDurum"));
const Grafikler = lazy(() => import("./Grafikler"));
const Takvim = lazy(() => import("./Takvim"));
const Bildirimler = lazy(() => import("./Bildirimler"));
const Rapor = lazy(() => import("./Rapor"));
const AIOzet = lazy(() => import("./AIOzet"));
const Mesaj = lazy(() => import("./Mesaj"));
const Profil = lazy(() => import("./Profil"));
const AyarlarSayfasi = lazy(() => import("../ayarlar/AyarlarSayfasi"));

type Sekme =
  | "/parent/overview" | "/parent/charts" | "/parent/calendar" | "/parent/notifications"
  | "/parent/report" | "/parent/ai-summary" | "/parent/message";

// Veli paneli yüklenince hatırlatmalar bildirim tablosuna eklenir (çan için).
function VeliBildirimEkim() {
  const d = useVeliDerived();
  const hatirlatmalar = d.hatirlatmalar as unknown as { baslik: string; detay: string; oncelik: "yuksek" | "normal" }[];

  useEffect(() => {
    const liste: SistemHatirlatmasi[] = hatirlatmalar.map((h) => ({
      baslik: h.baslik,
      detay: h.detay,
      oncelik: h.oncelik,
      hedef: "/parent/overview",
    }));
    if (liste.length > 0) sistemHatirlatmalariniSenkronla(liste).catch(() => {});
  }, [hatirlatmalar]);

  return null;
}

export default function VeliPaneli() {
  const [sekme, setSekme] = useState<Sekme>("/parent/overview");
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
    <VeliVeriProvider>
      <VeliBildirimEkim />
      <ParentLayout
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
          {sekme === "/parent/overview" && <GenelDurum />}
          {sekme === "/parent/charts" && <Grafikler />}
          {sekme === "/parent/calendar" && <Takvim />}
          {sekme === "/parent/notifications" && <Bildirimler onNavigate={git} />}
          {sekme === "/parent/report" && <Rapor />}
          {sekme === "/parent/ai-summary" && <AIOzet />}
          {sekme === "/parent/message" && <Mesaj />}
          </Suspense>
        </div>
        )}
      </ParentLayout>

      {profilAcilik && (
        <ProfilOverlay
          baslik="Profil"
          altBaslik="Hesap bilgilerini yönet"
          onKapat={() => setProfilAcilik(false)}
        >
          <Suspense fallback={<PageLoading />}><Profil /></Suspense>
        </ProfilOverlay>
      )}
    </VeliVeriProvider>
  );
}
