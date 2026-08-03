import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabaseConfigurada = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          "Supabase kurulu değil: .env dosyasına VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini ekleyip uygulamayı yeniden başlat."
        );
      },
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
})();
