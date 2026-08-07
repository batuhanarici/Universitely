# Landing Page — `src/pages/landing/`

Bu klasör, ana uygulamadan bağımsız, kendi kendine yeten bir landing page
bileşenidir. Kolay değiştirilebilmesi için her bölüm ayrı bir dosyada:

- `LandingPage.tsx` — tüm bölümleri birleştiren ana bileşen
- `LandingPage.css` — tüm stiller (tüm class isimleri `lp-` öneki taşır,
  mevcut `theme.css` ile çakışmaz)
- `Nav.tsx` — sticky üst nav + scroll progress çubuğu
- `Hero.tsx` — başlık + 3D perspektifli dashboard mockup'ı
- `FeatureGallery.tsx` — yatay kayan (sticky) özellik kartları
- `RolesSection.tsx` — Öğrenci / Veli / Koç sekmeli önizleme
- `CompareSection.tsx` — "Kağıt-kalem vs Universitely" karşılaştırması
- `StatsSection.tsx` — sayaç animasyonlu istatistikler
- `Testimonials.tsx` — kayan yorum şeridi (şu an placeholder içerik)
- `Closing.tsx` — kapanış CTA
- `MagneticButton.tsx` — fareye doğru hafifçe kayan buton (paylaşılan bileşen)
- `useCursorTrail.ts` — imleç takip eden altın çizgi efekti (hook)
- `useReveal.ts` — scroll'da fade/slide-up gösterimi (hook)

Bir bölümü değiştirmek istediğinde sadece o dosyaya dokunman yeterli —
diğer bölümler etkilenmez.

## Entegrasyon (App.tsx)

1. Bu klasörü olduğu gibi `src/pages/landing/` altına kopyala (zaten bu yoldaysa ekstra iş yok).
2. `index.html`'deki Google Fonts linkine `Manrope` fontu ve `Fraunces` italic
   ağırlığı eklendi — bu değişiklik zip içinde `index.html` olarak da var,
   diff'ini kontrol edip kendi `index.html`'ine uygula.
3. `App.tsx`'e şunu ekle:

```tsx
import LandingPage from "./pages/landing/LandingPage";

// ... mevcut component içinde, auth kontrolünden önce:
const [showLanding, setShowLanding] = useState(
  !user && window.location.pathname === "/"
);

if (showLanding) {
  return (
    <LandingPage
      onGetStarted={() => {
        setShowLanding(false);
        window.history.pushState({}, "", "/giris");
        // burada mevcut giriş ekranına geçişini tetikleyen state'i güncelle
      }}
    />
  );
}
```

Tam olarak nereye ekleneceği, senin `App.tsx`'indeki mevcut auth/state
yapısına göre değişir — mevcut `useAuth` / `supabaseConfigurada` kontrolünün
hemen üstüne, giriş yapılmamış kullanıcı için bir dal olarak eklemen en
temiz çözüm olur.

## Notlar

- İstatistikler (`500+`, `%23`, `%89`) ve yorumlar (`Testimonials.tsx`)
  şu an placeholder — gerçek rakamların/yorumların gelmesiyle bu iki
  dosyayı güncellemek yeterli.
- İmleç izi efekti sadece `pointer: fine` olan cihazlarda (mouse) çalışır,
  dokunmatik cihazlarda otomatik devre dışı.
- Tüm CSS class'ları `lp-` önekiyle izole edildi, mevcut `theme.css`
  class'larıyla (`.card`, `.btn` vb.) çakışma riski yok.
