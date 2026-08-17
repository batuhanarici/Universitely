import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
import { useFocusTrap } from "../lib/useFocusTrap";

export default function ProfilOverlay({ baslik, altBaslik, onKapat, children }: {
  baslik: string;
  altBaslik?: string;
  onKapat: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onceki = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = onceki;
    };
  }, []);

  const dialogRef = useRef<HTMLDivElement>(null);
  const overlayId = useId();
  useFocusTrap(dialogRef, onKapat);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`profil-overlay-baslik-${overlayId}`}
      aria-describedby={altBaslik ? `profil-overlay-alt-${overlayId}` : undefined}
      tabIndex={-1}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "#F4EFE4", overflowY: "auto" }}
    >
      <div className="rule-lines" style={{ position: "fixed", inset: 0, pointerEvents: "none" }} />
      <div className="anim-slide" style={{ position: "relative", maxWidth: 680, margin: "0 auto", padding: "32px 24px 88px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
          <div>
            <h1 id={`profil-overlay-baslik-${overlayId}`} className="page-title" style={{ margin: 0 }}>{baslik}</h1>
            {altBaslik && <p id={`profil-overlay-alt-${overlayId}`} style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 6 }}>{altBaslik}</p>}
          </div>
          <button
            type="button"
            onClick={onKapat}
            aria-label="Kapat"
            style={{
              border: "none",
              background: "#0F1B2D",
              color: "#F4EFE4",
              width: 38,
              height: 38,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
