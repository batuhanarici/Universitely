import { useRef, type ReactNode, type CSSProperties } from "react";

export default function MagneticButton({
  children,
  onClick,
  className,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - r.left - r.width / 2;
    const my = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
  }

  function handleMouseLeave() {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  }

  return (
    <button
      ref={ref}
      className={`lp-btn-gold${className ? ` ${className}` : ""}`}
      style={style}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}
