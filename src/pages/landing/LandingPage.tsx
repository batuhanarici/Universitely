import "./LandingPage.css";
import { useCursorTrail } from "./useCursorTrail";
import Nav from "./Nav";
import Hero from "./Hero";
import FeatureGallery from "./FeatureGallery";
import RolesSection from "./RolesSection";
import CompareSection from "./CompareSection";
import StatsSection from "./StatsSection";
import Testimonials from "./Testimonials";
import Closing from "./Closing";

/**
 * Universitely landing sayfası.
 *
 * `onGetStarted`, App.tsx tarafından sağlanır — "Ücretsiz Dene"
 * butonlarına tıklandığında giriş/kayıt ekranına yönlendirme yapmak için
 * kullanılır. Böylece bu klasör, routing mimarisinden bağımsız kalır.
 */
export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const trailCanvasRef = useCursorTrail();

  return (
    <div className="lp-root">
      <canvas className="lp-trail-canvas" ref={trailCanvasRef} />
      <Nav onGetStarted={onGetStarted} />
      <Hero onGetStarted={onGetStarted} />
      <FeatureGallery />
      <RolesSection />
      <CompareSection />
      <StatsSection />
      <Testimonials />
      <Closing onGetStarted={onGetStarted} />
    </div>
  );
}
