# Universitely Emsal Ürün ve Özellik Boşluk Analizi

**Tarih:** 17 Ağustos 2026
**Analiz kapsamı:** Universitely, Kunduz, Raunt/SEBİT, YKS Cepte, My Study Life, CoachAccountable, TutorCruncher, Khanmigo/Khan Academy, Quizlet ve Kariyer.net YKS Tercih Motoru.

## 1. Yönetici özeti

Universitely’nin mevcut ürünü basit bir görev veya deneme takip aracı olmaktan çıkmış durumda. Koç–öğrenci–veli rolleri, deneme/rapor altyapısı, görev ve dosya teslimi, ders ve okul takvimi, uygulama içi hatırlatma, üniversite hedefi, tercih robotu ve minimum admin operasyonu aynı üründe birleşiyor. Bu kapsam, özellikle bağımsız koçlar ve küçük koçluk ekipleri için güçlü bir başlangıç sağlıyor.

Bununla birlikte emsal ürünler iki alanda daha ileri durumda. **İçerik ve öğrenme platformları** öğrenciye soru bankası, kişiselleştirilmiş pratik, yapay zekâ destekli materyal ve sosyal motivasyon sunuyor. **Koçluk/işletme platformları** ise seanslar arasındaki aksiyonları, ölçümleri, seans notlarını, aile görünürlüğünü, koç kapasitesini ve operasyon raporlarını yapılandırıyor. Kunduz bire bir koçluğu haftalık görüşme, veriye dayalı program, seans arası mesajlaşma ve veli raporu ile paketliyor [1]. Raunt; hedef ve eksiklere göre çalışma programı, rehberlik, deneme, içerik ve AI yönlendirmesini birleştiriyor [3] [4]. CoachAccountable ise aksiyon planı, metrik, seans notu, hatırlatma ve program/kurs yapısını koçluk sürecinin merkezine alıyor [7].

**Ana sonuç:** Universitely’nin yeni bir genel soru bankası veya genel sosyal ağ olarak konumlanması yerine, **koçun uzmanlığını öğrencinin günlük davranışına bağlayan koç destekli adaptif çalışma işletim sistemi** olarak farklılaşması daha doğru olur. En yüksek öncelik, öğrencinin “bugün ne yapacağını” bilen, görevi tamamlayıp kanıtlayan, yanlışından yeni aksiyon çıkaran ve koça yalnızca sorun olduğunda değil karar anında sinyal veren kapalı döngüyü kurmaktır.

## 2. Mevcut durum ve emsallerle konum

Aşağıdaki matris, kamuya açık ürün sayfalarında doğrulanabilen özelliklerin ve Universitely’nin mevcut kod/teslim envanterinin karşılaştırılmasıdır. “Kısmen”, özelliğin temelinin bulunduğu fakat emsaldeki tam otomatik veya derin kişiselleştirme seviyesine ulaşmadığı anlamına gelir. “Yok” ise bu analizde ürünün belirgin ve doğrulanmış bir karşılığının bulunmadığını ifade eder.

| Özellik alanı | Universitely | Kunduz | Raunt/SEBİT | YKS Cepte | My Study Life | CoachAccountable | Khanmigo | Quizlet | Kariyer.net |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Koçluk/seans akışı | Var | Var | Var | Yok | Yok | Var | Yok | Yok | Yok |
| Kişiselleştirilmiş çalışma planı | Kısmen | Var | Var | Kısmen | Var | Var | Var | Kısmen | Yok |
| Görev/aksiyon takibi | Var | Var | Belirsiz | Belirsiz | Var | Var | Var | Var | Yok |
| Kaynak ve dosya teslimi | Var | Belirsiz | Belirsiz | Yok | Yok | Var | Yok | Yok | Yok |
| Soru bankası/deneme | Var | Var | Var | Var | Yok | Yok | Var | Var | Yok |
| Deneme ve performans analizi | Var | Var | Var | Var | Yok | Yok | Kısmen | Var | Var |
| AI öğrenme desteği | Kısmen | Var | Var | Belirsiz | Var | Var | Var | Var | Yok |
| Yanlış/tekrar döngüsü | Var | Kısmen | Var | Kısmen | Yok | Yok | Belirsiz | Kısmen | Yok |
| Veli raporu/görünürlüğü | Var | Var | Belirsiz | Yok | Var | Belirsiz | Var | Yok | Yok |
| Topluluk/oyunlaştırma | Yok | Belirsiz | Belirsiz | Var | Yok | Var | Yok | Yok | Yok |
| Tercih robotu/listesi | Var | Belirsiz | Belirsiz | Belirsiz | Yok | Yok | Yok | Yok | Var |
| Koç notu, ölçüm ve seans sonrası kayıt | Kısmen | Var | Belirsiz | Yok | Yok | Var | Kısmen | Yok | Yok |
| Çoklu koç/admin/işletme analitiği | Var | Belirsiz | Belirsiz | Yok | Yok | Var | Kısmen | Kısmen | Yok |

YKS Cepte’nin soru bankası, deneme, günlük hedef, kişisel istatistik, zayıf konu, seri, akıllı bildirim, topluluk ve düello özellikleri öğrencinin günlük geri dönüşünü artırmaya odaklanıyor [5]. My Study Life ise döngüsel ders programı, ödev alt görevleri, sınav/tekrar planı, Pomodoro, aile paylaşımı, senkronizasyon ve yapay zekâlı planlayıcıyı tek öğrenci takviminde topluyor [6]. Kariyer.net’in tercih motoru, üniversite/bölüm/sıra/puan filtrelerinin ötesinde burs, eğitim dili, devlet-vakıf, özel kontenjan, ön lisans/lisans, tercih sepeti, farklı liste ve Excel dışa aktarma imkânları sunuyor [12].

## 3. Universitely’nin güçlü tarafları

Universitely’nin en güçlü avantajı, **koçluk ilişkisini sınav verisiyle aynı veri modelinde tutmasıdır**. Emsal içerik uygulamalarında koçluk, içerik ve topluluk ayrı paketler hâlinde sunulurken; Universitely’de koç öğrenciyi, öğrencinin dersini, görevini, teslim dosyasını, deneme sonucunu, tekrarını ve hedefini aynı bağlamda görebilir. Bu, doğru ürün akışı kurulursa güçlü bir kişiselleştirme zemini oluşturur.

İkinci güçlü taraf **üç rolün birlikte düşünülmüş olmasıdır**. Öğrenci kendi programını ve teslimlerini yönetirken koç görev ve ders akışını yönetebilir; veli ise çocuğun durumunu izleyebilir. My Study Life’ın Family Connect yaklaşımı da aile görünürlüğünü öğrencinin kontrol ettiği bir paylaşım modeliyle kurguluyor [6]. Universitely bu fikri, veliye ham veri göstermek yerine anlaşılır haftalık özet ve müdahale gerektiren sinyal vererek daha işlevsel hâle getirebilir.

Üçüncü güçlü taraf **güvenli operasyon temeli**dir. Supabase Auth, RLS, private Storage, admin yetki tablosu, hesap askıya alma ve denetim kaydı; ürün büyürken rastgele eklenmiş bir prototip yerine kontrollü bir SaaS omurgası sağlar. Bu omurga, özellikle öğrenci/veli verisi ve dosya teslimi içeren bir sistem için farklılaşma kadar önemlidir.

## 4. Öncelikli ürün boşlukları

### 4.1. “Bugün ne çalışacağım?” boşluğu

Universitely’de görev, ders ve okul programı var; ancak bunlar öğrencinin gün içindeki kapasitesine göre otomatik olarak bloklara ayrılmıyor. Emsal ürünler, haftalık programı yalnızca takvim olarak değil, ders/ödev/sınav/tekrar önceliklerini bir araya getiren çalışma planı olarak ele alıyor [6]. Raunt ve Kunduz da hedef ve eksiklerden kişiye özel çalışma planı üretiyor [1] [3].

**Öneri:** Öğrenci müsaitlik saatleri, okul programı, koç görevleri, yaklaşan dersler ve hedef sınavı kullanılarak günlük “bugünün planı” oluşturulmalı. İlk sürümde yapay zekâ şart değil; kural tabanlı bir planlayıcı yeterlidir. Koç planı kilitleyebilir, öğrenci planı erteleyebilir ve sistem ertelenen işi yeni bir zamana taşımayı önerebilir.

### 4.2. Görevi aksiyona dönüştürme boşluğu

Mevcut dosya teslimi, koçun PDF göndermesi ve öğrencinin çözümü geri yüklemesi için iyi bir temel sağlıyor. Eksik olan, görevin öğrenme amacının ve tamamlanma kanıtının yapılandırılmasıdır. CoachAccountable’ın aksiyon, metrik, seans notu ve çalışma sayfası yaklaşımı burada iyi bir modeldir [7].

**Öneri:** Her göreve ders/konu, hedef kazanım, tahmini süre, son tarih, alt görev, tamamlanma kanıtı, öğrenci öz değerlendirmesi ve koç geri bildirimi eklenmeli. Böylece “PDF gönderildi” yerine “20 problem çözüldü, 4 yanlış işaretlendi, öğrenci zorlandığı noktayı yazdı, koç sonraki görevi belirledi” döngüsü oluşur.

### 4.3. Deneme sonrası otomatik aksiyon boşluğu

Universitely’de deneme sonuçları ve analiz altyapısı bulunuyor. Ancak sonuçtan doğrudan yeni görev, tekrar planı veya koç uyarısı üreten karar katmanı güçlendirilmeli. SEBİT AI Pusulam, deneme sonucunu eksik/güçlü yön ve gelişim rotasına çevirme iddiasıyla bu katmanı ürünün merkezine alıyor [4].

**Öneri:** Her deneme sonrası sistem üç çıktı üretmeli: öğrencinin anlayacağı “en önemli üç bulgu”, koçun göreceği “müdahale gerektiren noktalar” ve otomatik önerilen “7 günlük telafi planı”. Aynı konu üç farklı denemede tekrar ediyorsa sistem bunu kalıcı eksik sinyali olarak işaretlemeli; yalnızca net düşüşünü göstermekle kalmamalı.

### 4.4. Koç seans notu ve takip maddesi boşluğu

Ders takvimi mevcut; fakat dersin kendisinden sonra ne kararlaştırıldığı, öğrencinin hangi sözü verdiği ve bir sonraki seansa kadar hangi kanıtın beklendiği ayrı bir nesne olarak güçlendirilmeli. CoachAccountable’ın seans notları ve aksiyon planları bu ihtiyacı açıkça ürünleştiriyor [7].

**Öneri:** Ders kapatılırken koç için kısa seans özeti, öğrenci için anlaşılır karar özeti, bir sonraki seans hedefi ve takip maddeleri oluşturulmalı. Koç notu öğrencinin özel notundan ayrılmalı; veliye paylaşılacak bölüm ayrıca seçilebilmeli.

### 4.5. Öğrenci motivasyonu ve günlük geri dönüş boşluğu

Universitely uygulama içi bildirim ve görev akışına sahip; ancak seri, günlük hedef, ilerleme çubuğu, küçük kutlama ve akran desteği gibi geri dönüş mekanizmaları sınırlı. YKS Cepte’nin seri, düello, topluluk ve günlük soru hedefi özellikleri bu boşluğun davranışsal önemini gösteriyor [5].

**Öneri:** İlk aşamada herkese açık sosyal ağ kurmak yerine kişisel ve koç destekli hafif oyunlaştırma eklenmeli: günlük hedef, haftalık tamamlanma yüzdesi, “son 7 gün ritmi”, görev serisi, kişisel rekor ve koçun verdiği başarı rozeti. Rekabet ancak öğrenci açıkça isterse kullanılmalı; öğrencileri sıralamak yerine kendi geçmişiyle kıyaslamak daha güvenlidir.

### 4.6. AI katmanının güvenli ve işe yarar hâle getirilmesi

Mevcut AI motoru bulunuyor; ancak AI’nın öğrencinin gerçek verisiyle ne yaptığı ve koçun kontrolüne nasıl bağlandığı net bir ürün yüzeyi olmalı. Khanmigo doğrudan cevabı vermek yerine öğrenciyi sorularla düşündüren bir tutor yaklaşımını ve öğretmene son yedi günün çalışma/ödev/ustalık özetini sunan Class Snapshot’ı öne çıkarıyor [9] [10]. Quizlet ise PDF/not yüklemesini çalışma rehberi, flashcard ve practice test’e dönüştürüyor [11].

**Öneri:** Universitely AI’ı üç dar görevle başlatmalı: deneme raporu özetleme, koçun onayına sunulan görev/tekrar önerisi ve yüklenen PDF’den öğrencinin çözebileceği mini test üretimi. AI doğrudan “şunu çalışmalısın” diye bağlayıcı karar vermemeli; gerekçesini, kullandığı veriyi ve koçun onayını görünür kılmalı.

### 4.7. Tercih robotunun liste ve koşul katmanı boşluğu

Mevcut tercih robotu puan türü, başarı sırası, üniversite/bölüm araması ve temel sınıflandırma sunuyor. Kariyer.net örneği; burs oranı, eğitim dili, devlet/vakıf, özel kontenjan, bölüm türü, farklı tercih listeleri ve Excel dışa aktarmayı ürünün doğal parçası hâline getiriyor [12].

**Öneri:** Tercih robotuna “tercih sepeti”, sürükle-bırak sıralama, güvenli/dengeli/iddialı dağılımı, koşul kontrol listesi, burs/şehir/eğitim dili filtreleri, iki listeyi karşılaştırma ve Excel/PDF çıktı eklenmeli. Tercih robotu hiçbir zaman yerleşme garantisi vermemeli; son resmî ÖSYM verisiyle güncelleme tarihi görünür olmalı.

### 4.8. Veliye ham veri değil anlamlı karar desteği verme boşluğu

Veli rolü mevcut olsa da büyüme için veli ekranı “çocuğun her hareketini izleme” mantığına kaymamalı. Veliye haftalık çalışma özeti, tamamlanma eğilimi, yaklaşan önemli dersler, koçun paylaşmayı seçtiği not ve destek önerisi sunulmalı. My Study Life’ın Family Connect özelliği aile görünürlüğünü öğrencinin paylaştığı bilgilerle ilişkilendiriyor [6]; Kunduz ise seans sonrası veli raporunu güçlü bir güven unsuru olarak kullanıyor [1].

**Öneri:** Veliye haftalık tek sayfalık rapor, risk rengi yerine açıklama, koçun önerdiği “evde nasıl destek olabilirsiniz?” bölümü ve bildirim tercihleri eklenmeli. Tıbbi/psikolojik teşhis veya kesin başarı tahmini yapılmamalı.

### 4.9. Koç işletme katmanı boşluğu

Şu anki admin paneli temel operasyonu karşılıyor; ancak birden fazla koçla çalışan yapıda koç kapasitesi, öğrenci başına aktif yük, ders doluluk oranı, cevap/teslim gecikmesi, öğrenci elde tutma ve koç kalite notu gibi metrikler gerekecek. TutorCruncher; ders hacmi, koç kullanımı, öğrenci elde tutma, eşleştirme, ödeme ve payroll analitiğini aynı işletme katmanında topluyor [8].

**Öneri:** Ödeme başlamadan önce bile koç kapasite panosu, öğrenci–koç eşleştirme, bekleyen teslimler, 7 günden uzun süredir etkileşimsiz öğrenciler ve yaklaşan seans yoğunluğu eklenmeli. Bunlar admin için değil, koçun iş yükünü azaltan erken uyarı sistemi olarak tasarlanmalı.

## 5. Eklenmemesi veya ertelenmesi gerekenler

Emsallerde bulunan her özelliği kopyalamak Universitely’yi daha iyi değil, daha dağınık yapabilir. İlk aşamada geniş bir soru bankası ve binlerce video üretmek yüksek içerik maliyeti, telif ve kalite denetimi gerektirir. Kullanıcıların birbirleriyle serbest sohbet ettiği büyük bir topluluk; moderasyon, güvenlik ve pedagojik dikkat maliyeti doğurur. Görüşme kaydı ve AI moderasyonu; açık rıza, saklama süresi, erişim yetkisi ve KVKK uyumu netleşmeden yapılmamalıdır. Ödeme, abonelik, koç primleri ve iade otomasyonu ise ürünün ücretsiz pilot kullanımı doğrulanmadan önce geliştirilmemelidir.

## 6. En önemli stratejik fırsat

Universitely’nin gerçek farklılaşması “her şeyi yapan eğitim uygulaması” olmak değil, koçun karar kalitesini artırmak olabilir. Öğrenci bir hafta boyunca ne yaptı, hangi görevi neden tamamlayamadı, hangi konuda aynı hatayı tekrarladı, hangi ders saatine uyamadı ve koçun hangi müdahalesi işe yaradı? Ürün bu soruları tek akışta cevaplayabilirse; soru bankası, video ve sosyal özellikleri olan büyük platformlarla doğrudan içerik yarışına girmeden güçlü bir niş oluşturur.

> **Önerilen konumlandırma:** “Koçun öğrenciyi daha iyi tanımasını, öğrencinin her gün ne yapacağını bilmesini ve veliye doğru zamanda doğru bilgiyi vermesini sağlayan TYT/AYT koçluk işletim sistemi.”

## Kaynaklar

[1]: https://kunduz.com/tr/bire-bir-kocluk/ "Kunduz Bire Bir Koçluk"

[2]: https://kunduz.com/tr/ "Kunduz Eğitim Platformu"

[3]: https://sebit.com.tr/egitim-cozumlerimiz "SEBİT Eğitim Çözümleri"

[4]: https://sebit.com.tr/yapay-zeka "SEBİT Yapay Zekâ"

[5]: https://ykscepte.com/ "YKS Cepte"

[6]: https://apps.apple.com/nz/app/my-study-life-school-planner/id910639339 "My Study Life"

[7]: https://www.coachaccountable.com/ "CoachAccountable"

[8]: https://www.tutorcruncher.com/ "TutorCruncher"

[9]: https://www.khanacademy.org/khanmigo "Khanmigo"

[10]: https://support.khanacademy.org/hc/en-us/articles/14799047733645-What-teacher-tools-are-available-on-Khanmigo "Khanmigo Teacher Tools"

[11]: https://quizlet.com/features/ai-study-tools "Quizlet AI Study Tools"

[12]: https://www.kariyer.net/tercih-motoru/ "Kariyer.net YKS Tercih Motoru"
