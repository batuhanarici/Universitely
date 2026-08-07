import { useEffect, useRef } from "react";
import MagneticButton from "./MagneticButton";

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
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="lp-top-progress" ref={progressRef} />
      <div className="lp-nav" ref={navRef}>
        <div className="lp-nav-logo">
          Universitel<em>y</em>
        </div>
        <MagneticButton onClick={onGetStarted}>Ücretsiz dene</MagneticButton>
      </div>
    </>
  );
}
