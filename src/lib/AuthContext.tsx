import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigurada } from "./supabase";
import { davetKodunuBagla } from "./ogrenciYonetimQueries";
import { veliBagla } from "./veliQueries";

interface AuthCtx {
  session: Session | null;
  yukleniyor: boolean;
  ogrenciMi: boolean | null; // null = henüz kontrol edilmedi
  veliMi: boolean;
}

const Ctx = createContext<AuthCtx>({ session: null, yukleniyor: true, ogrenciMi: null, veliMi: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [ogrenciMi, setOgrenciMi] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabaseConfigurada) {
      setSession(null);
      setYukleniyor(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setYukleniyor(false);
    }).catch(() => {
      setSession(null);
      setYukleniyor(false);
    });

    const { data: dinleyici } = supabase.auth.onAuthStateChange((_event, yeniSession) => {
      setSession(yeniSession);
    });

    return () => dinleyici.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setOgrenciMi(null);
      return;
    }
    const aktifSession = session;
    let iptal = false;
    async function kontrolEt() {
      const meta = aktifSession.user.user_metadata ?? {};
      const davetKod = meta.davet_kodu as string | undefined;
      const veliKod = meta.veli_kodu as string | undefined;
      if (davetKod && meta.rol !== "ogretmen") {
        try {
          await davetKodunuBagla(davetKod);
        } catch {}
      }
      if (veliKod) {
        try {
          await veliBagla(veliKod, (meta.ad_soyad as string) ?? "");
        } catch {}
      }
      if (iptal) return;
      const { data } = await supabase.from("ogrenciler").select("id").eq("id", aktifSession.user.id).maybeSingle();
      if (!iptal) setOgrenciMi(!!data);
    }
    kontrolEt();
    return () => {
      iptal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  return (
    <Ctx.Provider value={{ session, yukleniyor, ogrenciMi, veliMi: session?.user.user_metadata?.rol === "veli" }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
