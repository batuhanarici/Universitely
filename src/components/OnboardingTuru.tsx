import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import UYArrow from "./UYArrow";
import { Btn } from "./ui";
import { kocRehberGiris, kocRehberGruplari, kocRehberKapanis } from "../lib/kocRehberIcerik";

const TOPLAM_ADIM = kocRehberGruplari.length + 2;
// Spotlight, sidebar dar/gizli olduğunda (mobil) anlamsızlaşır — bu genişliğin
// altında sade, ortalanmış kart gösterilir.
const SPOTLIGHT_MIN_GENISLIK = 780;

interface Rect { top: number; left: number; width: number; height: number; }

function hedefRectAl(baslik: string): Rect | null {
  const el = document.querySelector(`[data-tur-grup="${baslik}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const pad = 6;
  return { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
}

export default function OnboardingTuru({ onTamamla }: { onTamamla: () => void }) {
  const [adim, setAdim] = useState(0);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [genisEkran, setGenisEkran] = useState(() => window.innerWidth >= SPOTLIGHT_MIN_GENISLIK);

  const sonAdim = adim === TOPLAM_ADIM - 1;
  const ilkAdim = adim === 0;
  const grup = adim >= 1 && adim <= kocRehberGruplari.length ? kocRehberGruplari[adim - 1] : null;

  useEffect(() => {
    function guncelle() {
      setGenisEkran(window.innerWidth >= SPOTLIGHT_MIN_GENISLIK);
      setRect(grup ? hedefRectAl(grup.baslik) : null);
    }
    guncelle();
    window.addEventListener("resize", guncelle);
    return () => window.removeEventListener("resize", guncelle);
  }, [grup]);

  async function bitir() {
    setKaydediliyor(true);
    try {
      await onTamamla();
    } finally {
      setKaydediliyor(false);
    }
  }

  const spotlightAktif = genisEkran && grup && rect;

  // Tooltip'i hedefin sağına, dikey ortasına hizala; taşarsa viewport içine sıkıştır
  const tooltipStil: React.CSSProperties = spotlightAktif
    ? (() => {
        const top = Math.min(Math.max(rect!.top + rect!.height / 2 - 140, 20), window.innerHeight - 300);
        const left = Math.min(rect!.left + rect!.width + 28, window.innerWidth - 380);
        return { position: "fixed", top, left, width: 340 };
      })()
    : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 340 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      {/* Arka planı karart + hedefi spot ışığıyla kes */}
      <div
        style={{
          position: "fixed", inset: 0,
          background: spotlightAktif ? "transparent" : "rgba(15,27,45,0.55)",
        }}
      />
      {spotlightAktif && (
        <div
          className="tur-spotlight"
          style={{
            position: "fixed",
            top: rect!.top, left: rect!.left, width: rect!.width, height: rect!.height,
            borderRadius: 10,
            pointerEvents: "none",
            transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease",
          }}
        />
      )}

      <div className="card anim-slide" style={{ ...tooltipStil, padding: 26, zIndex: 201 }}>
        {spotlightAktif && (
          <UYArrow
            size={26}
            float
            style={{ position: "absolute", top: "50%", left: -30, transform: "translateY(-50%) rotate(-90deg)" }}
          />
        )}

        <button
          onClick={bitir}
          disabled={kaydediliyor}
          style={{ position: "absolute", top: 14, right: 14, border: "none", background: "transparent", color: "rgba(15,27,45,0.4)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          Atla
        </button>

        {ilkAdim && (
          <div>
            <h1 className="display" style={{ fontSize: 20, marginBottom: 10 }}>{kocRehberGiris.baslik}</h1>
            <p style={{ fontSize: 13.5, color: "rgba(15,27,45,0.6)", lineHeight: 1.6 }}>{kocRehberGiris.aciklama}</p>
          </div>
        )}

        {grup && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: 6 }}>
              {adim} / {kocRehberGruplari.length}
            </p>
            <h1 className="display" style={{ fontSize: 18, marginBottom: 6 }}>{grup.baslik}</h1>
            <p style={{ fontSize: 13, color: "rgba(15,27,45,0.65)", lineHeight: 1.5 }}>{grup.ozet}</p>
          </div>
        )}

        {sonAdim && (
          <div>
            <h1 className="display" style={{ fontSize: 20, marginBottom: 10 }}>{kocRehberKapanis.baslik}</h1>
            <p style={{ fontSize: 13.5, color: "rgba(15,27,45,0.6)", lineHeight: 1.6 }}>{kocRehberKapanis.aciklama}</p>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22 }}>
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: TOPLAM_ADIM }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: i === adim ? "var(--color-ink)" : "rgba(15,27,45,0.15)",
                  transition: "background 0.2s ease",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!ilkAdim && (
              <Btn variant="ghost" size="sm" onClick={() => setAdim((a) => a - 1)} disabled={kaydediliyor}>
                <Icon name="arrow_back" size={14} /> Geri
              </Btn>
            )}
            {!sonAdim ? (
              <Btn variant="primary" size="sm" onClick={() => setAdim((a) => a + 1)}>
                İleri <Icon name="arrow_back" size={14} style={{ transform: "rotate(180deg)" }} />
              </Btn>
            ) : (
              <Btn variant="primary" size="sm" onClick={bitir} disabled={kaydediliyor}>
                {kaydediliyor ? "…" : "Başla"}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
