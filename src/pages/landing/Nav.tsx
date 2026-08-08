import { useEffect, useRef } from "react";
import MagneticButton from "./MagneticButton";

const LINKLER = [
  { href: "#nasil-calisir", label: "Nasıl çalışır" },
  { href: "#roller", label: "Roller" },
  { href: "#fark", label: "Fark" },
];

export default function Nav({ onGetStarted }: { onGetStarted: () => void }) {
  const navRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onScroll() {
      if (navRef.current) {
        navRef.current.classList.toggle("lp-show", window.scrollY > window.innerHeight * 0.6);
      }
      if (progressRef.current) {
        const max = document.body.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        progressRef.current.style.width = `${pct}%`;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function atla(e: React.MouseEvent, href: string) {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <div className="lp-top-progress" ref={progressRef} />
      <div className="lp-nav" ref={navRef}>
        <a className="lp-nav-brand" href="#top" onClick={(e) => atla(e, "#top")}>
          <span className="lp-nav-logo">
            Universitel<em>y</em>
          </span>
          <span className="lp-nav-tag">TYT/AYT takip</span>
        </a>
        <nav className="lp-nav-links" aria-label="Bölümler">
          {LINKLER.map((l) => (
            <a key={l.href} href={l.href} className="lp-nav-link" onClick={(e) => atla(e, l.href)}>
              {l.label}
            </a>
          ))}
        </nav>
        <MagneticButton onClick={onGetStarted}>Ücretsiz dene</MagneticButton>
      </div>
    </>
  );
}
