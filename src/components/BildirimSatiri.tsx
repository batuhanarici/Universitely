import type { CSSProperties } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import type { Bildirim } from "../types/database";
import { TUR_ETIKET, TUR_RENK, bildirimZamani } from "../lib/bildirimUi";

const TUR_IKON: Record<string, IconName> = {
  mesaj: "message",
  hatirlatma: "bell",
  uyari: "alert",
  toplu: "send",
  talep: "alert",
};

export default function BildirimSatiri({ bildirim, onAc, onOkundu, onArsivle, onSil }: {
  bildirim: Bildirim;
  onAc?: () => void;
  onOkundu?: () => void;
  onArsivle?: () => void;
  onSil?: () => void;
}) {
  const renk = TUR_RENK[bildirim.tur] ?? "#0F1B2D";
  const okunmamis = !bildirim.okundu;

  return (
    <div
      className="bildirim-satiri"
      onClick={onAc}
      role={onAc ? "button" : undefined}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "11px 14px",
        cursor: onAc ? "pointer" : "default",
        borderLeft: `3px solid ${renk}`,
        background: okunmamis ? "#FFFDF6" : "transparent",
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 2, color: renk }}>
        <Icon name={TUR_IKON[bildirim.tur] ?? "bell"} size={17} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: renk,
              flexShrink: 0,
            }}
          >
            {TUR_ETIKET[bildirim.tur]}
          </span>
          {bildirim.gonderici_adi && (
            <span style={{ fontSize: 11, color: "rgba(15,27,45,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              · {bildirim.gonderici_adi}
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(15,27,45,0.4)", flexShrink: 0 }}>
            {bildirimZamani(bildirim.created_at)}
          </span>
        </div>

        <p
          style={{
            fontSize: 13,
            fontWeight: okunmamis ? 700 : 500,
            color: "#0F1B2D",
            lineHeight: 1.35,
            marginTop: 3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {bildirim.baslik}
        </p>
        {bildirim.detay && (
          <p
            style={{
              fontSize: 12,
              color: "rgba(15,27,45,0.6)",
              lineHeight: 1.4,
              marginTop: 2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {bildirim.detay}
          </p>
        )}
      </div>

      <div className="bildirim-aksiyonlar" style={{ display: "flex", gap: 2, flexShrink: 0, alignItems: "center", paddingTop: 2 }}>
        {onOkundu && (
          <button
            className="bildirim-aksiyon"
            title={okunmamis ? "Okundu işaretle" : "Okunmamış işaretle"}
            onClick={(e) => { e.stopPropagation(); onOkundu(); }}
            style={aksiyonStil}
          >
            <Icon name="check" size={13} color="#2A9D8F" />
          </button>
        )}
        {onArsivle && (
          <button
            className="bildirim-aksiyon"
            title="Arşivle"
            onClick={(e) => { e.stopPropagation(); onArsivle(); }}
            style={aksiyonStil}
          >
            <Icon name="folder" size={13} color="#A07C20" />
          </button>
        )}
        {onSil && (
          <button
            className="bildirim-aksiyon"
            title="Sil"
            onClick={(e) => { e.stopPropagation(); onSil(); }}
            style={aksiyonStil}
          >
            <Icon name="trash" size={13} color="#C4503A" />
          </button>
        )}
      </div>
    </div>
  );
}

const aksiyonStil: CSSProperties = {
  border: "none",
  background: "none",
  cursor: "pointer",
  padding: 4,
  borderRadius: 6,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
