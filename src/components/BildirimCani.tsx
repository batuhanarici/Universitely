import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { Icon } from "./Icon";
import BildirimSatiri from "./BildirimSatiri";
import {
  bildirimleriGetir,
  bildirimOkunduYap,
  bildirimArsivle,
  bildirimSil,
  bildirimleriDinle,
  ogrenciHatirlatmalariniHesapla,
  sistemHatirlatmalariniSenkronla,
} from "../lib/bildirimQueries";
import type { Bildirim } from "../types/database";

export default function BildirimCani({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { session, ogrenciMi, veliMi } = useAuth();
  const [acik, setAcik] = useState(false);
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const kutu = useRef<HTMLDivElement>(null);

  const uid = session?.user.id;
  const bildirimSayfasi = veliMi ? "/parent/notifications" : ogrenciMi ? "/student/notifications" : "bildirimler";

  const yenile = useCallback(async () => {
    try {
      const l = await bildirimleriGetir();
      setBildirimler(l);
    } catch {
      // sessiz
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    if (!uid) return;
    let iptal = false;
    (async () => {
      await yenile();
      if (ogrenciMi) {
        const hatirlatmalar = await ogrenciHatirlatmalariniHesapla();
        await sistemHatirlatmalariniSenkronla(hatirlatmalar);
        if (!iptal) await yenile();
      }
    })();
    return () => {
      iptal = true;
    };
  }, [uid, ogrenciMi, yenile]);

  useEffect(() => {
    if (!uid) return;
    const kanal = bildirimleriDinle(
      uid,
      (b) => setBildirimler((l) => [b, ...l.filter((x) => x.id !== b.id)]),
      (b) => setBildirimler((l) => l.map((x) => (x.id === b.id ? b : x))),
      `bildirimler-realtime-cani-${uid}`
    );
    return () => {
      supabase.removeChannel(kanal);
    };
  }, [uid]);

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

  const gorunurler = bildirimler
    .filter((b) => !b.arsivlendi)
    .sort((a, b) => (a.okundu === b.okundu ? b.created_at.localeCompare(a.created_at) : a.okundu ? 1 : -1))
    .slice(0, 20);

  const okunmamisSayi = bildirimler.filter((b) => !b.okundu && !b.arsivlendi).length;

  async function tikla(b: Bildirim) {
    if (!b.okundu) {
      setBildirimler((l) => l.map((x) => (x.id === b.id ? { ...x, okundu: true } : x)));
      bildirimOkunduYap(b.id).catch(() => {});
    }
    if (b.hedef) onNavigate(b.hedef);
    setAcik(false);
  }

  async function okunduYap(b: Bildirim) {
    setBildirimler((l) => l.map((x) => (x.id === b.id ? { ...x, okundu: true } : x)));
    bildirimOkunduYap(b.id).catch(() => {});
  }

  function arsivle(b: Bildirim) {
    setBildirimler((l) => l.map((x) => (x.id === b.id ? { ...x, arsivlendi: true } : x)));
    bildirimArsivle(b.id).catch(() => {});
  }

  function sil(b: Bildirim) {
    setBildirimler((l) => l.filter((x) => x.id !== b.id));
    bildirimSil(b.id).catch(() => {});
  }

  return (
    <div ref={kutu} style={{ position: "relative" }}>
      <button
        onClick={() => setAcik((a) => !a)}
        aria-label="Bildirimler"
        style={{
          border: "none",
          background: "none",
          padding: 6,
          cursor: "pointer",
          borderRadius: 10,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          color: "#0F1B2D",
        }}
      >
        <Icon name="bell" size={19} />
        {okunmamisSayi > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              minWidth: 16,
              height: 16,
              borderRadius: 9,
              background: "#C4503A",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxSizing: "border-box",
            }}
          >
            {okunmamisSayi > 9 ? "9+" : okunmamisSayi}
          </span>
        )}
      </button>

      {acik && (
        <div
          className="anim-fade"
          style={{
            position: "absolute",
            right: 0,
            top: 46,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            background: "#fff",
            border: "1px solid rgba(15,27,45,0.08)",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(15,27,45,0.16)",
            overflow: "hidden",
            zIndex: 60,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F1B2D" }}>Bildirimler</p>
            {okunmamisSayi > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#C4503A" }}>{okunmamisSayi} okunmamış</span>
            )}
          </div>

          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {yukleniyor ? (
              <p style={{ padding: 20, textAlign: "center", fontSize: 13, color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>
            ) : gorunurler.length === 0 ? (
              <p style={{ padding: 24, textAlign: "center", fontSize: 13, color: "rgba(15,27,45,0.5)" }}>Bildirimin yok 🎉</p>
            ) : (
              gorunurler.map((b) => (
                <BildirimSatiri
                  key={b.id}
                  bildirim={b}
                  onAc={() => tikla(b)}
                  onOkundu={b.okundu ? undefined : () => okunduYap(b)}
                  onArsivle={() => arsivle(b)}
                  onSil={() => sil(b)}
                />
              ))
            )}
          </div>

          <div style={{ padding: 10, borderTop: "1px solid rgba(15,27,45,0.06)" }}>
            <button
              className="menu-item"
              style={{ width: "100%", display: "flex", justifyContent: "center", gap: 8 }}
              onClick={() => {
                setAcik(false);
                onNavigate(bildirimSayfasi);
              }}
            >
              <Icon name="bell" size={15} />
              <span>Tümünü Gör</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
