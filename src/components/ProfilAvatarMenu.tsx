import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import ProfilAvatar from "./ProfilAvatar";
import { Icon } from "./Icon";

export default function ProfilAvatarMenu({ onProfilAcil, onAyarlarAcil }: {
  onProfilAcil: () => void;
  onAyarlarAcil?: () => void;
}) {
  const { session, veliMi, ogrenciMi } = useAuth();
  const [acik, setAcik] = useState(false);
  const [avatarYol, setAvatarYol] = useState<string | null>(null);
  const kutu = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const adSoyad = (user?.user_metadata?.ad_soyad as string) || user?.email || "Kullanıcı";
  const email = user?.email ?? "";

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    let iptal = false;
    async function avatarGetir() {
      const rol = veliMi ? "veli" : ogrenciMi ? "ogrenci" : "ogretmen";
      let yol: string | null = null;
      if (rol === "ogrenci") {
        const { data } = await supabase
          .from("ogrenci_profilleri")
          .select("avatar_url")
          .eq("ogrenci_id", uid)
          .maybeSingle();
        yol = (data?.avatar_url as string | null) ?? null;
      } else if (rol === "veli") {
        const { data } = await supabase
          .from("veliler")
          .select("avatar_url")
          .eq("id", uid)
          .maybeSingle();
        yol = (data?.avatar_url as string | null) ?? null;
      } else {
        const { data } = await supabase
          .from("ogretmen_profilleri")
          .select("avatar_url")
          .eq("ogretmen_id", uid)
          .maybeSingle();
        yol = (data?.avatar_url as string | null) ?? null;
      }
      if (!iptal) setAvatarYol(yol);
    }
    avatarGetir();
    return () => {
      iptal = true;
    };
  }, [user?.id, veliMi, ogrenciMi]);

  useEffect(() => {
    function disari(e: MouseEvent) {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAcik(false);
    }
    document.addEventListener("mousedown", disari);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", disari);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  return (
    <div ref={kutu} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        aria-label="Profil menüsü"
        aria-haspopup="menu"
        aria-expanded={acik}
        style={{ border: "none", background: "none", padding: 0, cursor: "pointer", borderRadius: "50%", display: "block" }}
      >
        <ProfilAvatar adSoyad={adSoyad} tohum={user?.id ?? email} yol={avatarYol} boyut={38} />
      </button>

      {acik && (
        <div
          className="profile-menu anim-fade"
          role="menu"
          aria-label="Profil seçenekleri"
          style={{
            position: "absolute",
            right: 0,
            top: 48,
            width: 240,
            background: "#fff",
            border: "1px solid rgba(15,27,45,0.08)",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(15,27,45,0.16)",
            overflow: "hidden",
            zIndex: 60,
          }}
        >
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#0F1B2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {adSoyad}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(15,27,45,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email}
            </p>
          </div>
          <div style={{ padding: 6 }}>
            <button
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => {
                setAcik(false);
                onProfilAcil();
              }}
            >
              <Icon name="user" size={16} />
              <span>Profilim</span>
            </button>
            {onAyarlarAcil && (
              <button
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => {
                  setAcik(false);
                  onAyarlarAcil();
                }}
              >
                <Icon name="settings" size={16} />
                <span>Ayarlar</span>
              </button>
            )}
            <button type="button" role="menuitem" className="menu-item" onClick={() => supabase.auth.signOut()}>
              <Icon name="logout" size={16} />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
