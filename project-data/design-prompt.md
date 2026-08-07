# Universitely — UI Yeniden Tasarım Promptu

Sen bir ürün tasarımcısısın. Bana **Universitely** uygulamasının tamamen yeni bir UI tasarımını üreteceksin. Aşağıdaki istekleri birebir uygula.

## Bağlam (Neyi tasarlıyoruz)

Universitely, Türkiye'deki **TYT/AYT sınavına hazırlanan öğrenciler**, **özel ders koçları** ve **veliler** için bir "deneme takip + çalışma planı" uygulamasıdır. Üç rol, üç ayrı panel:

- **Öğrenci paneli (17 sayfa):** günlük dashboard, profil, çalışma/Pomodoro, konular, kaynaklar, görevler, takvim, denemeler, analiz grafikleri, yanlış arşivi, tekrar planı, karşılaştırma, AI koçum (öneriler), haftalık rapor, motivasyon/rozetler, mesaj, bildirimler.
- **Koç paneli (21 sayfa):** dashboard, AI risk analizi, muhasebe, sınıf genel/analiz, öğrenci yönetimi + detay, haftalık program, görev/kaynak/konu atama, ders-konu yönetimi, deneme şablonu, deneme oluşturma, sonuç girişi (tekli + toplu grid), mesajlar, notlar, görüşme & ödeme, toplu bildirim, sınıf raporu.
- **Veli paneli (7 sayfa):** çocuğun durumu, grafikler, takvim, bildirimler, rapor (PDF), AI özet, koça mesaj.

Tüm sayfaların **fonksiyonel tanımı, bölümleri, verileri, eylemleri ve hesaplamaları** `design.md` dosyasında eksiksiz duruyor. **Fonksiyonel yapıyı aynen koru** — sayfaları, kartları, verileri, butonları, filtreleri, form alanlarını asla atlama veya değiştirme. Yalnızca **görsel dili** yeniliyorsun.

## Tasarım Vizyonu (tek cümleyle özet)

*"İnce, kendinden emin, dokunsal bir kağıt-defter estetiğiyle donatılmış; her etkileşimi hissedilen; ama gösterişe kaçmayan premium bir minimal tasarım."*

Bunu üç kelimeyle sabitle: **PREMIUM · MİNİMAL · ÇOK ANİMASYONLU.** Bu üçünü birbirine karşı feda etme — animasyonların çokluğu, minimal görünümü bozmamalı; minimal görünüm de canlılığı öldürmemeli.

## Kesinlikle Yapay Zekâ Ürünü Gibi Görünmesini İSTEMİYORUM

Aşağıdaki "AI imzası" sayılan her şeyden **kaçınacaksın**. Bunları gördüğün yerde kendi karşı-önerinle değiştir:

1. **Mor/indigo gradyan, neon glow, cam efektli (glassmorphism) kartlar yasak.** Renk sistemi yalnızca: derin lacivert mürekkep (`#0F1B2D` civarı), sıcak krem kağıt zemin, tek altın aksan (`#E4BB60`), ve durumlara saklı teal (doğru/yeşil), tuğla (yanlış/kırmızı), gri (boş/kararsız). Bu dört + nötr tonlar dışında renk yok.
2. **Aşırı yuvarlatılmış "pastil" UI yasak.** Köşe yarıçapını nazik tut (8–14px arası); iç kartlar, tablolar ve giriş alanları büyük yarıçap kullanmasın.
3. **Her yere emoji ikon kullanmak yasak.** Mevcut uygulama emoji kullanıyor; bunları **tek vuruşluk çizgi ikon setiyle** (1.5px stroke, köşeli-keskin uçlu) değiştir. Emoji yalnızca motivasyon/rozet/boş durum gibi "duygu" anlarında durabilir, o zaman bile bilinçli seçilmeli.
4. **4'lü KPI kartı sırası, generic "Dashboard" kalıbı yasak.** İstatistikleri kart "gömleği" yerine tipografi ağırlıklı, cetvelli defter satırları üzerinde sun; her metriğe neden var olduğunu hissettir (mini trend oku, küçük karşılaştırma).
5. **Soyut blob, 3D, fütüristik avatar, krom efekt yasak.** Görsel vurgular, öğrencinin dünyasından gelsin: cetvel, takvim yaprağı, sınav optik formu, kalem ucu, defter sayfası, madalyon. El yapımı hissi veren basit çizgisel motifler.
6. **Klişe boş durum (düz "veri yok" yazısı) yerine** her boş durum için ufak, çizgisel, dostane bir illüstrasyon + kısa bir cümle + bir sonraki adım önerisi.
7. **Yapay düzen simetrisi yasak.** Her şey ızgaraya otursun ama ızgarayı kasten kır; bir sayfada öne çıkan tek bir "hero" öğe olsun (diğerleri ona hizmet etsin).
8. **Hareketi yalnızca anlam yaratmak için kullan:** toplamalar sayılır, çubuklar dolar, seçimler ışıkla tepki verir. Rastgele "slide-up" spam'i yapma.

## İçerik / Atmosfer (Tasarımın "ruhu")

- Tema: **sınav yolculuğu** = disiplin + ritüel + küçük zaferler. Uygulama bir "koçun masası" gibi hissettirmeli: öğrenci kendi defterini, koç sınıfı yöneten defterini, veli çocuğunun günlüğünü okuyor.
- **Kağıt/defter metaforu bilinçli kullan:** ince cetvel çizgileri, kırık kenar (yırtık defter) detayları, tablo başlıklarında altın yapışkan şerit, tarih bloklarında "ayraç" hissi. Ama asla "spiral defter arka planı" gibi fotoğrafik/düz dolgu olarak değil — ince, grafik ipuçları olarak.
- **Sayılar kahramandır:** net değerleri, seri sayısı, yüzdeler büyük ve tabular (hizalı) rakamlarla; yanında küçük, anlamlı açıklama. Numara tüm ürünün ana karakteri.
- **Zaman kavramı güçlü:** bugün/yarın/hafta vurguları, gün etiketleri, ilerleme "ritim" olarak gösterilmeli (sadece yüzde değil, küçük mini-birimler/hafta halkaları).
- Premium his **kontrast ve boşluktan** gelir: bol hava, net hiyerarşi, tutarlı 4px ritmik boşluk sistemi, yazı tipi kontrastı. Şık olmak için ekstra dekoratif eleman ekleme.

## Animasyon Sistemi (Çok animasyonlu olması için spesifik şartlar)

Tüm animasyonları tek bir tasarım kütüphanesinde tanımla (isimleriyle):

1. **Giriş katmanlaması (stagger):** Sayfalar bölüm bölüm, 30–50ms arayla yukarıdan + soluklaşarak gelir (8–12px, 320–480ms, `cubic-bezier(0.22, 1, 0.36, 1)`).
2. **Sayı sayma:** Tüm metrikler 700–1100ms'de, yumuşak easing'le sayılır; ondalıklı netler hassas işlenir.
3. **Çubuk/grafik dolumları:** Bar yükseklikleri ve ilerleme dolguları gecikmeli (40–80ms aralıklarla) dolar.
4. **Grafikler:** Veri çizgileri soldan sağa "çizilir"; noktalar peş peşe belirir; tooltip yumuşak eşlik eder.
5. **Hover mikro-etkileşimler:** Butonlarda ışık kayması, satırlarda hafif zemin ve kenar tepkisi, ikonlarda %5 büyüme, tıklamada 0.95x "basılma". (120–200ms)
6. **Durum değişimleri:** Tamamlandı işaretinde mini "pop + ✓ çizimi" (stroke-dashoffset ile kalem çizimi), silme eyleminde satırın yumuşak solması.
7. **Sekme/alt-nav geçişleri:** İçerik kayan/geçişli değil; içerik kısa fade + 6px yukarı hareketle gelir; sekmeler arasında ince altın alt çizgi akar.
8. **Yükleme:** Skeleton shimmer yerine, **iskelet + içerik yerleşirken** yumuşak geçiş. İlk açılışta küçük bir logo animasyonu.
9. **Rozet/motivasyon anları:** Kazanılan rozet "fışkırma" değil, mürekkep damlası/kaşe damgası gibi sert ama zarif bir "damga" efektiyle gelir; madalya ikonu belirir.
10. **Her animasyon `prefers-reduced-motion`'da kapanmalı** (önemli aksesibilite).

## Tipografi (Hiyerarşi için)

- Başlıklar için **güçlü karakterli bir display yazı tipi** (ör. Fraunces / Playfair Display / Libre Caslon gibi editoryal), vücut için **çok okunaklı bir humanist grotesk** (ör. Inter yerine Geist / Manrope / Instrument Sans gibi — daha az "AI varsayılanı").
- Rakamlar için **tabular figures** açık olmalı (istatistiklerde hizalı sütunlar).
- Kullanıcıyı büyük-başlık küçük-etiket kontrastıyla yönet; her kartta 3 seviyeyi geçme.

## Sayfa Düzeni İlkeleri

- **Her rolün panelinde kalıcı, sessiz bir "kenar çubuğu"** ama içerik kenar çubuğu ezmesin; kenar çubuğu ikon + ince etiket, aktif durumda altın bir işaret.
- **Tek odak:** Her sayfada birincil eylem/alan, diğer kartlardan açıkça büyük ve farklı.
- **Listeler:** Cetvel çizgili, satır içi gömülü eylemler (satırı hover'layınca görünen ikon butonları).
- **Formlar:** Alanlar yalnızca tek satır, kısa; etiket + placeholder ikisi de nazik; butonlar formla aynı hizada değil, kartın "aksiyon köşesinde".
- **Tablo sayfaları** (toplu sonuç girişi, karşılaştırma, öğrenci sıralaması): satır aralarında ince çizgi, dolu hücrelerde renk noktası olarak doğru/yanlış/boş, yatay kaydırmada kenar "silüeti".
- **Mobil:** Kenar çubuğu alt sekme çubuğuna dönüşür; gridler 1–2 kolona iner; hizalama 4px ritmine sadık.

## Renk Davranışı (Semantik, dekoratif değil)

- Mürekkep/lacivert: her yerin temeli. Altın: yalnızca **vurgu + başarı + marka anı** (asla tüm kartlarda dolgu olarak değil). Krem: kağıt yüzeyler. Teal: doğru/tamamlandı/aktif. Tuğla kırmızı: yanlış/gecikmiş/yüksek risk. Gri: boş/pasif/kararsız.
- Risk seviyeleri (yüksek/orta/düşük) aynı semantiği izler; skor çubukları bu renklerin yumuşak tonlarıyla dolar.

## İkonografi

- Tek stil: 1.5px stroke, kesik uçlu (miter), 24px grid, **kendinden-eşlik** (icon + minimal etiket). Zaman/serüven metaforları: alev, kalem, cetvel, optik form, madalya, çan, ayraç, halka.
- İkonlar ölçeklenebilir (SVG) ve hover/aktif durumlarda renk-geçişli.

## Teslim Formatı

1. **Tasarım sistemi:** token tablosu (renk, tipografi, boşluk, yarıçap, gölge/yüzey, motion süreleri), bileşen seti (buton, kart, giriş, çip, rozet, tablo, modal, boş durum, bildirim), ikon seti listesi, illustration stili örneği.
2. **Her sayfa için** (design.md'deki tüm sayfalar): yerleşim krokisi (bölgeler), bileşen eşlemesi, animasyon şeması, hero/odak öğe.
3. **Kritik akışlar** (giriş, günlük dashboard, deneme sonucu girişi, toplu sonuç grid, risk analizi, haftalık rapor, görüşme & ödeme, veli bildirimleri) için yüksek çözünürlüklü örnek ekranlar.
4. Tüm çıktı, yukarıdaki "AI imzası yasak" kurallarına uyduğunu gösteren kısa bir öz-denetim listesiyle bitsin.

**Hatırlatma:** `design.md`'deki fonksiyonel içeriğin hiçbirini eksiltme; her kart, her buton, her form alanı ve her filtre tasarımda yer almalı. Tasarım stili tamamen serbest ama **premium, minimal, çok animasyonlu** üçlüsünden ve **yapay zekâ görünümü yasağından** asla taviz verme.
