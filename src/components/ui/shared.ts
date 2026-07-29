import type { CSSProperties } from "react";

export const inputStyle: CSSProperties = {
  padding: "9px 12px",
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-sm)",
  fontSize: 14,
  color: "var(--color-text)",
  background: "var(--color-surface)",
};

export const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 6,
  display: "block",
};

export const pageWrap: CSSProperties = {
  maxWidth: 680,
  margin: "32px auto",
  padding: "0 20px 60px",
  fontFamily: "var(--font-body)",
};

export const h1Style: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 26,
  fontWeight: 600,
  color: "var(--color-navy)",
  margin: "0 0 4px",
};
