import "./LandingPage.css";
import { useCursorTrail } from "./useCursorTrail";
import Nav from "./Nav";
import Hero from "./Hero";
import StepsSection from "./StepsSection";
import RolesSection from "./RolesSection";
import CompareSection from "./CompareSection";
import StatsSection from "./StatsSection";
import Testimonials from "./Testimonials";
import KeywordStrip from "./KeywordStrip";
import Closing from "./Closing";
import Footer from "./Footer";

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
    <div className="lp-root" id="top">
      <canvas className="lp-trail-canvas" ref={trailCanvasRef} />
      <Nav onGetStarted={onGetStarted} />
      <main>
        <Hero onGetStarted={onGetStarted} />
        <StepsSection />
        <RolesSection />
        <CompareSection />
        <KeywordStrip />
        <StatsSection />
        <Testimonials />
        <KeywordStrip />
        <Closing onGetStarted={onGetStarted} />
      </main>
      <Footer />
    </div>
  );
}
