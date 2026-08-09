import { useState } from "react";
import { Icon } from "./Icon";
import { Btn } from "./ui";
import { kocRehberGiris, kocRehberGruplari, kocRehberKapanis } from "../lib/kocRehberIcerik";

// Adımlar: [0] hoşgeldin, [1..N] gruplar, [N+1] kapanış
const TOPLAM_ADIM = kocRehberGruplari.length + 2;

export default function OnboardingTuru({ onTamamla }: { onTamamla: () => void }) {
  const [adim, setAdim] = useState(0);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  async function bitir() {
    setKaydediliyor(true);
    try {
      await onTamamla();
    } finally {
      setKaydediliyor(false);
    }
  }

  const sonAdim = adim === TOPLAM_ADIM - 1;
  const ilkAdim = adim === 0;
  const grup = adim >= 1 && adim <= kocRehberGruplari.length ? kocRehberGruplari[adim - 1] : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,27,45,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card anim-slide" style={{ maxWidth: 520, width: "100%", padding: 32, position: "relative" }}>
        <button
          onClick={bitir}
          disabled={kaydediliyor}
          style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", color: "rgba(15,27,45,0.4)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
        >
          Atla
        </button>

        {ilkAdim && (
          <div>
            <h1 className="display" style={{ fontSize: 22, marginBottom: 10 }}>{kocRehberGiris.baslik}</h1>
            <p style={{ fontSize: 14, color: "rgba(15,27,45,0.6)", lineHeight: 1.6 }}>{kocRehberGiris.aciklama}</p>
          </div>
        )}

        {grup && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: 6 }}>
              {adim} / {kocRehberGruplari.length}
            </p>
            <h1 className="display" style={{ fontSize: 20, marginBottom: 8 }}>{grup.baslik}</h1>
            <p style={{ fontSize: 13.5, color: "rgba(15,27,45,0.6)", marginBottom: 16 }}>{grup.ozet}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {grup.sayfalar.map((s) => (
                <div key={s.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-gold)", marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontSize: 13, color: "rgba(15,27,45,0.55)" }}> — {s.aciklama}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sonAdim && (
          <div>
            <h1 className="display" style={{ fontSize: 22, marginBottom: 10 }}>{kocRehberKapanis.baslik}</h1>
            <p style={{ fontSize: 14, color: "rgba(15,27,45,0.6)", lineHeight: 1.6 }}>{kocRehberKapanis.aciklama}</p>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 28 }}>
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
