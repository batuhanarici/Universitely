import { useEffect, useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useCountUp, useInView } from '../lib/designUtils';

// ── AnimatedNumber ─────────────────────────────────────────────────────────
export function AnimatedNumber({ value, decimals = 0, className = '' }: {
  value: number; decimals?: number; className?: string;
}) {
  const { ref, inView } = useInView();
  const count = useCountUp(value, 900, inView);
  return (
    <span ref={ref} className={`tabular ${className}`}>
      {count.toFixed(decimals)}
    </span>
  );
}

// ── ProgressBar ────────────────────────────────────────────────────────────
export function ProgressBar({ pct, color = '#2A9D8F', className = '' }: {
  pct: number; color?: string; className?: string;
}) {
  const { ref, inView } = useInView();
  const [width, setWidth] = useState(0);
  useEffect(() => { if (inView) setTimeout(() => setWidth(pct), 50); }, [inView, pct]);
  return (
    <div ref={ref} className={`progress-track ${className}`}>
      <div className="progress-fill" style={{ width: `${width}%`, background: color, transition: 'width 700ms cubic-bezier(0.22,1,0.36,1)' }} />
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'gray' }: {
  children: ReactNode;
  variant?: 'gold' | 'teal' | 'brick' | 'gray' | 'ink';
}) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// ── EmptyState ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, desc, action }: {
  icon: ReactNode; title: string; desc: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center anim-fade">
      <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.6 }}>{icon}</div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: '#0F1B2D', marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 13, color: 'rgba(15,27,45,0.5)', maxWidth: 300, marginBottom: action ? 16 : 0 }}>{desc}</p>
      {action}
    </div>
  );
}

// ── Loading / Error states ─────────────────────────────────────────────────
export function LoadingState({ label = "Yükleniyor…", className = "" }: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 72, color: "rgba(15,27,45,0.5)" }}
    >
      <span className="skeleton" aria-hidden="true" style={{ width: 18, height: 18, borderRadius: "50%" }} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  title = "Veriler yüklenemedi.",
  description = "Bağlantını kontrol edip tekrar deneyebilirsin.",
  onRetry,
  className = "",
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`card ${className}`} role="alert" style={{ borderLeft: "4px solid #C4503A" }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#C4503A", marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)", marginBottom: onRetry ? 14 : 0 }}>{description}</p>
      {onRetry && (
        <button className="btn btn-primary" type="button" onClick={onRetry}>
          Tekrar Dene
        </button>
      )}
    </div>
  );
}

// ── KPICard ────────────────────────────────────────────────────────────────
export function KPICard({ label, value, sub, color = '#0F1B2D', decimals = 0 }: {
  label: string; value: number; sub?: string; color?: string; decimals?: number;
}) {
  return (
    <div className="card tape-accent" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,27,45,0.4)', marginBottom: 4 }}>{label}</p>
      <p className="metric-value" style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1 }}>
        <AnimatedNumber value={value} decimals={decimals} />
      </p>
      {sub && <p style={{ fontSize: 12, color: 'rgba(15,27,45,0.5)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ── Card wrapper ───────────────────────────────────────────────────────────
export function Card({ children, className = '', style = {} }: {
  children: ReactNode; className?: string; style?: CSSProperties;
}) {
  return <div className={`card ${className}`} style={style}>{children}</div>;
}

// ── SectionTitle ───────────────────────────────────────────────────────────
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title" style={{ marginBottom: 16 }}>{children}</h2>;
}

// ── Input ──────────────────────────────────────────────────────────────────
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`input ${props.className ?? ''}`} style={{ resize: 'vertical', minHeight: 72, ...(props.style ?? {}) }} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`input ${props.className ?? ''}`} />;
}

// ── Buttons ────────────────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', ...props }: {
  children: ReactNode;
  variant?: 'primary' | 'gold' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, type = 'button', ...buttonProps } = props;
  return (
    <button {...buttonProps} type={type} className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className ?? ''}`}>
      {children}
    </button>
  );
}

// ── Label ──────────────────────────────────────────────────────────────────
export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(15,27,45,0.5)', marginBottom: 5 }}>
      {children}
    </label>
  );
}

// ── FormGroup ──────────────────────────────────────────────────────────────
export function FormGroup({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>{children}</div>;
}

// ── Tabs ───────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: {
  tabs: (string | { label: string; value: string })[];
  active: string;
  onChange: (t: string) => void;
}) {
  const normalized = tabs.map((t) => typeof t === "string" ? { label: t, value: t } : t);

  function klavyeGezin(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const sonrakiIndex = e.key === "Home"
      ? 0
      : e.key === "End"
        ? normalized.length - 1
        : (index + (e.key === "ArrowRight" ? 1 : -1) + normalized.length) % normalized.length;
    const sonraki = normalized[sonrakiIndex];
    onChange(sonraki.value);
    const tablar = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]");
    tablar?.[sonrakiIndex]?.focus();
  }

  return (
    <div className="tabs" role="tablist" aria-label="Sekmeler">
      {normalized.map((tab, index) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          tabIndex={active === tab.value ? 0 : -1}
          className={`tab-btn ${active === tab.value ? "active" : ""}`}
          onClick={() => onChange(tab.value)}
          onKeyDown={(e) => klavyeGezin(e, index)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Checkbox ───────────────────────────────────────────────────────────────
export function Checkbox(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" {...props} className="checkbox" />;
}

// ── StatusDot ──────────────────────────────────────────────────────────────
export function StatusDot({ active }: { active: boolean }) {
  return (
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? '#2A9D8F' : '#9A9FA8', display: 'inline-block', flexShrink: 0 }} />
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
export function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={!visible}
      style={{
        position: 'fixed', bottom: 24, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
        opacity: visible ? 1 : 0, transition: 'all 250ms ease',
        background: '#0F1B2D', color: '#F4EFE4', padding: '10px 20px', borderRadius: 8,
        fontSize: 13, fontWeight: 600, zIndex: 9999, pointerEvents: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
      }}
    >
      {msg}
    </div>
  );
}

// ── useToast ───────────────────────────────────────────────────────────────
export function useToast() {
  const [state, setState] = useState({ msg: '', visible: false });
  function show(msg: string) {
    setState({ msg, visible: true });
    setTimeout(() => setState(s => ({ ...s, visible: false })), 2200);
  }
  return { toast: <Toast msg={state.msg} visible={state.visible} />, show };
}
