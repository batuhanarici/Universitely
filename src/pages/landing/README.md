# Landing Page — `src/pages/landing/`

Bu klasör, ana uygulamadan bağımsız, kendi kendine yeten bir landing page
bileşenidir. Kolay değiştirilebilmesi için her bölüm ayrı bir dosyada:

- `LandingPage.tsx` — tüm bölümleri birleştiren ana bileşen
- `LandingPage.css` — tüm stiller (tüm class isimleri `lp-` öneki taşır,
  mevcut `theme.css` / `design.css` ile çakışmaz)
- `Nav.tsx` — sticky üst nav + scroll progress çubuğu + bölüm bağlantıları
- `Hero.tsx` — optik cevap kağıdı mockup'ı; scroll ile boş yuvarlaklar dolar
- `StepsSection.tsx` — "Gir → Gör → Bitir" 3 adım, pinned (scroll bağlı)
- `RolesSection.tsx` — Öğrenci / Veli / Koç, pinned scroll-through
- `CompareSection.tsx` — "Eskisi" üstü çizilir, Universitely karşılığı belirir
- `StatsSection.tsx` — sayaç + çizilen altın alt çizgi (placeholder rakamlar)
- `Testimonials.tsx` — kayan yorum şeridi (placeholder içerik)
- `Closing.tsx` — kapanış CTA
- `Footer.tsx` — minimal alt bilgi
- `MagneticButton.tsx` — fareye doğru hafifçe kayan buton (paylaşılan bileşen)
- `useCursorTrail.ts` — imleç takip eden altın çizgi efekti (hook)
- `useScrollStages.ts` — pinned bölümlerde scroll ilerlemesi → sahne indeksi
- `useMediaQuery.ts` — responsive bileşen seçimi için matchMedia hook'u
- `useReveal.ts` — scroll'da fade/slide-up gösterimi (hook)

## Scroll anlatımı nasıl çalışıyor?

Pinned bölümler (`StepsSection`, `RolesSection`, `CompareSection`) masaüstünde
`300vh`'lik bir dış kapsayıcı + `100vh`'lik `position: sticky` iç alan
kullanır. `useScrollStages` dış kapsayıcının ekranı aşma oranını 0→1'e
çevirir; `active` sahne indeksi yalnızca sahne değişince re-render tetikler.
Dokunmatik cihazlarda ve `820px` altında bu bölümler doğal, kaydırılabilir
kart/istiflemeli düzene düşer (`useMediaQuery("(min-width: 821px) and
(pointer: fine)")` ile seçilir).

## Entegrasyon (App.tsx)

`LandingPage` yalnızca `onGetStarted` prop'unu alır; tıklanınca
giriş/kayıt ekranına geçmek için bu callback çağrılır. Routing'den
bağımsızdır — App.tsx'teki mevcut kullanımı değişmedi.

## Notlar

- İstatistikler (`500+`, `%23`, `%89`) ve yorumlar (`Testimonials.tsx`)
  şu an placeholder — gerçek rakamların/yorumların gelmesiyle bu iki
  dosyayı güncellemek yeterli.
- İmleç izi efekti sadece `pointer: fine` olan cihazlarda (mouse) çalışır,
  dokunmatik cihazlarda otomatik devre dışı.
- `prefers-reduced-motion` kullanıcılarında tema CSS'i animasyonları
  otomatik kısıtlar.
