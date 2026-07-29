import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
}

const stiller: Record<string, React.CSSProperties> = {
  primary: {
    background: "var(--color-navy)",
    color: "var(--color-text-on-navy)",
    border: "1px solid var(--color-navy)",
  },
  outline: {
    background: "transparent",
    color: "var(--color-navy)",
    border: "1px solid var(--color-line)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text-muted)",
    border: "1px solid transparent",
  },
};

export default function Button({ variant = "primary", style, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        ...stiller[variant],
        padding: "10px 18px",
        borderRadius: "var(--radius-sm)",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 0.1,
        transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
        opacity: disabled ? 0.5 : 1,
        boxShadow: variant === "primary" && !disabled ? "var(--shadow-lift)" : "none",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    />
  );
}
