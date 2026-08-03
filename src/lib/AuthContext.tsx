import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigurada } from "./supabase";

interface AuthCtx {
  session: Session | null;
  yukleniyor: boolean;
  ogrenciMi: boolean | null; // null = henüz kontrol edilmedi
}

const Ctx = createContext<AuthCtx>({ session: null, yukleniyor: true, ogrenciMi: null });

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
    supabase
      .from("ogrenciler")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setOgrenciMi(!!data));
  }, [session]);

  return (
    <Ctx.Provider value={{ session, yukleniyor, ogrenciMi }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
