import { useState, type ReactNode } from "react";
import logo from "../../assets/logo.png";

interface Sekme<T extends string> {
  id: T;
  etiket: string;
}

export default function TopBar<T extends string>({
  sekmeler,
  aktif,
  onDegis,
  sagIcerik,
}: {
  sekmeler: Sekme<T>[];
  aktif: T;
  onDegis: (id: T) => void;
  sagIcerik?: ReactNode;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <header
      style={{
        background: "var(--color-navy)",
        color: "var(--color-text-on-navy)",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "10px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={logo} alt="Universitely" style={{ height: 30, width: "auto" }} />
        </div>

        <nav style={{ display: "flex", gap: 4, flex: 1 }}>
          {sekmeler.map((s) => {
            const aktifMi = s.id === aktif;
            const hoverMi = hoverId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onDegis(s.id)}
                onMouseEnter={() => setHoverId(s.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  position: "relative",
                  background: "none",
                  border: "none",
                  color: aktifMi ? "var(--color-gold)" : "rgba(245,246,244,0.75)",
                  fontSize: 13.5,
                  fontWeight: aktifMi ? 600 : 500,
                  padding: "14px 10px",
                  cursor: "pointer",
                }}
              >
                {s.etiket}
                <span
                  style={{
                    position: "absolute",
                    left: 10,
                    right: 10,
                    bottom: 8,
                    height: 2,
                    borderRadius: 2,
                    background: "var(--color-gold)",
                    transform: aktifMi || hoverMi ? "scaleX(1)" : "scaleX(0)",
                    opacity: aktifMi ? 1 : 0.5,
                    transition: "transform 0.2s ease",
                    transformOrigin: "left",
                  }}
                />
              </button>
            );
          })}
        </nav>

        {sagIcerik}
      </div>
    </header>
  );
}
