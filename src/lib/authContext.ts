import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

export interface AuthCtx {
  session: Session | null;
  yukleniyor: boolean;
  ogrenciMi: boolean | null;
  veliMi: boolean;
  adminMi: boolean;
  hesapAskida: boolean;
  hesapNedeni: string | null;
  sifreSifirlama: boolean;
  setSifreSifirlama: (v: boolean) => void;
}

export const AuthContext = createContext<AuthCtx>({
  session: null,
  yukleniyor: true,
  ogrenciMi: null,
  veliMi: false,
  adminMi: false,
  hesapAskida: false,
  hesapNedeni: null,
  sifreSifirlama: false,
  setSifreSifirlama: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
