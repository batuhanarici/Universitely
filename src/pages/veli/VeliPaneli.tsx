import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { turGosterilmeliMi, turGorulduIsaretle } from "../../lib/veliQueries";
import { veliRehberGiris, veliRehberGruplari, veliRehberKapanis } from "../../lib/veliRehberIcerik";
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
const YardimSayfasi = lazy(() => import("./YardimSayfasi"));
const OnboardingTuru = lazy(() => import("../../components/OnboardingTuru"));

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

  const git = (path: string) => {
    if (path === "/") {
      supabase.auth.signOut();
      return;
    }
    if (ayarlarAcilik) setAyarlarAcilik(false);
    if (yardimAcilik) setYardimAcilik(false);
    setSekme(path as Sekme);
  };

  return (
    <VeliVeriProvider>
      <VeliBildirimEkim />
      {turAcik && (
        <Suspense fallback={null}>
          <OnboardingTuru giris={veliRehberGiris} gruplar={veliRehberGruplari} kapanis={veliRehberKapanis} onTamamla={turuKapat} />
        </Suspense>
      )}
      <ParentLayout
        activePath={sekme}
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

      {yardimAcilik && (
        <ProfilOverlay
          baslik="Yardım"
          altBaslik="Veli panelindeki bölümlerin ne işe yaradığına dair kısa bir rehber"
          onKapat={() => setYardimAcilik(false)}
        >
          <Suspense fallback={<PageLoading />}>
            <YardimSayfasi onTuruBaslat={() => { setYardimAcilik(false); setTurAcik(true); }} />
          </Suspense>
        </ProfilOverlay>
      )}
    </VeliVeriProvider>
  );
}
