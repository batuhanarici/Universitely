import type { ReactNode, CSSProperties } from "react";

export default function Card({
  children,
  style,
  delay = 0,
}: {
  children: ReactNode;
  style?: CSSProperties;
  delay?: number;
}) {
  return (
    <div
      className="fade-up"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-line)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-card)",
        padding: 20,
        animationDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
