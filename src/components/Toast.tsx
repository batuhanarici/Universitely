export function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={!visible}
      style={{
        position: "fixed", bottom: 24, left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
        opacity: visible ? 1 : 0, transition: "all 250ms ease",
        background: "#0F1B2D", color: "#F4EFE4", padding: "10px 20px", borderRadius: 8,
        fontSize: 13, fontWeight: 600, zIndex: 9999, pointerEvents: "none",
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      }}
    >
      {msg}
    </div>
  );
}
