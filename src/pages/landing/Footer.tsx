const URUN = [
  { href: "#nasil-calisir", label: "Nasıl çalışır" },
  { href: "#roller", label: "Roller" },
  { href: "#fark", label: "Fark" },
];

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <div className="lp-nav-logo">
            Universitel<em>y</em>
          </div>
          <p>TYT/AYT hazırlığında deneme sonucu takip ve konu bazlı zayıflık analizi.</p>
        </div>

        <div className="lp-footer-col">
          <span className="lp-footer-head">Bölümler</span>
          {URUN.map((u) => (
            <a key={u.href} href={u.href} className="lp-footer-link">
              {u.label}
            </a>
          ))}
        </div>

        <div className="lp-footer-col">
          <span className="lp-footer-head">Roller</span>
          <span className="lp-footer-link">Öğrenci</span>
          <span className="lp-footer-link">Veli</span>
          <span className="lp-footer-link">Koç</span>
        </div>

        <div className="lp-footer-col">
          <span className="lp-footer-head">İletişim</span>
          <a href="mailto:destek@universitely.com" className="lp-footer-link">
            destek@universitely.com
          </a>
        </div>
      </div>
      <div className="lp-footer-bar">
        <span>© 2026 Universitely</span>
        <span className="lp-footer-mono">dijital defter · sınav hazırlığı</span>
      </div>
    </footer>
  );
}
