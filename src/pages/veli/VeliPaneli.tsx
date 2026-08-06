import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { veliSonuclari, veliCocukVerisiniGetir, velininKocu, type VeliSonucSatiri, type VeliCocukVerisi } from "../../lib/veliQueries";
import { mesajlariGetir, mesajGonder, mesajOkunduIsaretle } from "../../lib/mesajQueries";
import type { Mesaj } from "../../types/database";
import { pdfYazdir } from "../../lib/exportUtils";
import AnimatedNumber from "../../components/AnimatedNumber";
import UYArrow from "../../components/UYArrow";

type Sekme = "genel" | "grafikler" | "takvim" | "bildirimler" | "rapor" | "ai" | "mesaj";

const TEAL = "var(--dogru)";
const GOLD = "var(--gold-dim)";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function sonGunIso(gun: number): string {
  const d = new Date();
  d.setDate(d.getDate() - gun);
  return d.toISOString().slice(0, 10);
}

interface Hatirlatma {
  ikon: string;
  baslik: string;
  detay: string;
  oncelik: "yuksek" | "normal";
}

const BOS_VERI: VeliCocukVerisi = {
  ogrenci_id: null,
  cocuk_adi: "",
  profil: null,
  calismalar: [],
  gorevler: [],
  kitaplar: [],
  konuIlerlemeleri: [],
  tekrarPlanlari: [],
  gorusmeler: [],
  konular: [],
};

export default function VeliPaneli() {
  const { session } = useAuth();
  const [sekme, setSekme] = useState<Sekme>("genel");
  const [sonuclar, setSonuclar] = useState<VeliSonucSatiri[]>([]);
  const [veri, setVeri] = useState<VeliCocukVerisi>(BOS_VERI);
  const [kocId, setKocId] = useState<string | null>(null);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const altRef = useRef<HTMLDivElement>(null);
  const ben = session?.user.id;

  useEffect(() => {
    Promise.all([veliSonuclari(), veliCocukVerisiniGetir(), velininKocu(), mesajlariGetir()])
      .then(([s, v, k, m]) => {
        setSonuclar(s);
        setVeri(v);
        setKocId(k);
        setMesajlar(m);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    const bekleyen = mesajlar.filter((m) => m.alici_id === ben && !m.okundu);
    for (const m of bekleyen) mesajOkunduIsaretle(m.id).catch(() => {});
    if (altRef.current) altRef.current.scrollTop = altRef.current.scrollHeight;
  }, [mesajlar, ben]);

  const denemeler = useMemo(() => {
    const map = new Map<string, { deneme_id: string; ad: string; tarih: string; dogru: number; yanlis: number }>();
    for (const s of sonuclar) {
      if (!map.has(s.deneme_id)) map.set(s.deneme_id, { deneme_id: s.deneme_id, ad: s.deneme_adi, tarih: s.tarih, dogru: 0, yanlis: 0 });
      const o = map.get(s.deneme_id)!;
      if (s.durum === "dogru") o.dogru++;
      else if (s.durum === "yanlis") o.yanlis++;
    }
    return Array.from(map.values())
      .map((o) => ({ ...o, net: Math.round((o.dogru - o.yanlis / 4) * 10) / 10 }))
      .sort((a, b) => a.tarih.localeCompare(b.tarih));
  }, [sonuclar]);

  const ort = denemeler.length === 0 ? null : denemeler.reduce((a, d) => a + d.net, 0) / denemeler.length;

  const dersler = useMemo(() => {
    const map = new Map<string, { dogru: number; toplam: number }>();
    for (const s of sonuclar) {
      if (!map.has(s.ders_adi)) map.set(s.ders_adi, { dogru: 0, toplam: 0 });
      const o = map.get(s.ders_adi)!;
      o.toplam++;
      if (s.durum === "dogru") o.dogru++;
    }
    return Array.from(map.entries())
      .map(([ad, d]) => ({ ad, yuzde: d.toplam === 0 ? 0 : Math.round((d.dogru / d.toplam) * 100) }))
      .sort((a, b) => a.yuzde - b.yuzde);
  }, [sonuclar]);

  const ozet = useMemo(() => {
    const bugun = bugunIso();
    const haftaSinir = sonGunIso(6);
    const aySinir = sonGunIso(29);

    const calismaAralik = (sinir: string) => veri.calismalar.filter((c) => c.tarih >= sinir && c.tarih <= bugun);

    const bugunC = veri.calismalar.filter((c) => c.tarih === bugun);
    const bugunSure = bugunC.reduce((a, c) => a + (c.sure_dk || 0), 0);
    const bugunSoru = bugunC.reduce((a, c) => a + (c.soru_sayisi || 0), 0);

    const hC = calismaAralik(haftaSinir);
    const haftaSure = hC.reduce((a, c) => a + (c.sure_dk || 0), 0);
    const haftaSoru = hC.reduce((a, c) => a + (c.soru_sayisi || 0), 0);
    const gorev7 = veri.gorevler.filter((g) => g.tarih >= haftaSinir && g.tarih <= bugun);
    const haftaGorevTam = gorev7.filter((g) => g.tamamlandi).length;
    const haftaGorevKalan = gorev7.length - haftaGorevTam;
    const haftaDeneme = new Set(sonuclar.filter((s) => s.tarih >= haftaSinir).map((s) => s.deneme_id)).size;

    const aC = calismaAralik(aySinir);
    const aySure = aC.reduce((a, c) => a + (c.sure_dk || 0), 0);
    const aySoru = aC.reduce((a, c) => a + (c.soru_sayisi || 0), 0);
    const ayDenemeAdlari = Array.from(new Set(sonuclar.filter((s) => s.tarih >= aySinir).map((s) => s.deneme_id)));
    const ayDenemeler = denemeler.filter((d) => ayDenemeAdlari.includes(d.deneme_id ?? ""));
    const ayOrt = ayDenemeler.length === 0 ? null : ayDenemeler.reduce((a, d) => a + d.net, 0) / ayDenemeler.length;

    return {
      bugunSure, bugunSoru,
      haftaSure, haftaSoru, haftaGorevTam, haftaGorevKalan, haftaDeneme,
      aySure, aySoru, ayDenemeAdet: ayDenemeAdlari.length, ayOrt,
    };
  }, [veri, sonuclar, denemeler]);

  const son14Gun = useMemo(() => {
    const map = new Map<string, { sure: number; soru: number }>();
    for (const c of veri.calismalar) {
      const o = map.get(c.tarih) ?? { sure: 0, soru: 0 };
      o.sure += c.sure_dk || 0;
      o.soru += c.soru_sayisi || 0;
      map.set(c.tarih, o);
    }
    const arr: { tarih: string; kisa: string; sure: number; soru: number }[] = [];
    const bugun = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(bugun);
      d.setDate(bugun.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const o = map.get(iso) ?? { sure: 0, soru: 0 };
      arr.push({ tarih: iso, kisa: iso.slice(8), sure: o.sure, soru: o.soru });
    }
    return arr;
  }, [veri]);

  const konuIlerleme = useMemo(() => {
    const tamlanan = new Set(veri.konuIlerlemeleri.filter((k) => k.tamamlandi).map((k) => k.konu_id));
    const toplam = veri.konular.length;
    const biten = veri.konular.filter((k) => tamlanan.has(k.id)).length;
    return { toplam, biten, yuzde: toplam === 0 ? 0 : Math.round((biten / toplam) * 100) };
  }, [veri]);

  const gelecekGorusmeler = useMemo(
    () =>
      veri.gorusmeler
        .filter((g) => g.durum !== "iptal" && new Date(g.tarih).getTime() >= Date.now())
        .sort((a, b) => a.tarih.localeCompare(b.tarih)),
    [veri]
  );

  const hatirlatmalar = useMemo(() => {
    const liste: Hatirlatma[] = [];
    const bugun = bugunIso();

    const bugunGorevler = veri.gorevler.filter((g) => g.tarih === bugun);
    if (bugunGorevler.length > 0) {
      const kalan = bugunGorevler.filter((g) => !g.tamamlandi);
      if (kalan.length === 0) {
        liste.push({ ikon: "🎉", baslik: "Program tamamlandı", detay: `Bugünün ${bugunGorevler.length} görevi tamamlandı.`, oncelik: "normal" });
      } else {
        liste.push({ ikon: "⏰", baslik: `${kalan.length} bugünkü program yapılmadı`, detay: kalan.map((g) => g.baslik).join(" · "), oncelik: "yuksek" });
      }
    }

    const son7 = new Set(sonuclar.filter((s) => s.tarih >= sonGunIso(7)).map((s) => s.deneme_id));
    if (son7.size > 0) {
      liste.push({ ikon: "📄", baslik: `${son7.size} deneme eklendi`, detay: "Son 7 günde yeni deneme sonucu yüklendi.", oncelik: "normal" });
    }

    const bugunkuTekrar = veri.tekrarPlanlari.filter((p) => p.plan_tarihi === bugun && !p.yapildi);
    if (bugunkuTekrar.length > 0) {
      liste.push({ ikon: "🔁", baslik: `${bugunkuTekrar.length} tekrar bugün sırada`, detay: bugunkuTekrar.map((p) => p.aciklama).join(" · "), oncelik: "normal" });
    }

    const cozulmemisKitap = veri.kitaplar.filter((k) => k.toplam > k.ilerleme).length;
    if (cozulmemisKitap > 0) {
      liste.push({ ikon: "📚", baslik: `${cozulmemisKitap} kaynak henüz bitmemiş`, detay: "Kitap/kaynak ilerlemeleri takip ediliyor.", oncelik: "normal" });
    }

    if (ozet.haftaSure === 0 && sonuclar.length > 0) {
      liste.push({ ikon: "💤", baslik: "Bu hafta çalışma kaydı yok", detay: "Çocuğun bu hafta hiç çalışma kaydı girmemiş.", oncelik: "yuksek" });
    }

    return liste;
  }, [veri, sonuclar, ozet]);

  const aiOzet = useMemo(() => {
    const m: { ikon: string; baslik: string; metin: string }[] = [];
    if (denemeler.length === 0) {
      m.push({ ikon: "📊", baslik: "Henüz deneme verisi yok", metin: "Çocuğun deneme sonuçları yüklendikçe burada gelişim özeti oluşacak." });
      return m;
    }
    const son = denemeler[denemeler.length - 1];
    const onceki = denemeler.slice(0, -1).map((d) => d.net);
    const oncekiOrt = onceki.length ? onceki.reduce((a, b) => a + b, 0) / onceki.length : null;
    const trend = oncekiOrt === null ? "İlk denemesi kaydedilmiş." :
      son.net >= oncekiOrt ? `Son deneme (${son.net}) önceki ortalamanın (${Math.round(oncekiOrt * 10) / 10}) üzerinde; yükseliş görünüyor.` :
        `Son deneme (${son.net}) önceki ortalamanın (${Math.round(oncekiOrt * 10) / 10}) altında kalmış; takip önerilir.`;
    m.push({ ikon: "📈", baslik: `Net trendi: ${son.net}`, metin: trend });

    const saat = Math.round((ozet.haftaSure / 60) * 10) / 10;
    m.push({
      ikon: "⏱️",
      baslik: `Bu hafta ${saat} saat çalışmış`,
      metin: saat >= 5 ? "Düzenli bir çalışma temposu görünüyor." : "Çalışma süresi düşük; koçla görüşme önerilir.",
    });

    if (dersler.length > 0) {
      const guclu = dersler[dersler.length - 1];
      const zayif = dersler[0];
      m.push({ ikon: "🎯", baslik: `Güçlü: ${guclu.ad} (%${guclu.yuzde})`, metin: `${zayif.ad} (%${zayif.yuzde}) zayıf görünüyor; ${zayif.ad} tekrarına ağırlık verilmesi faydalı.` });
    }

    if (veri.profil?.hedef_net && ort !== null) {
      const fark = Math.round((veri.profil.hedef_net - ort) * 10) / 10;
      m.push({
        ikon: "🏁",
        baslik: `Hedef net: ${veri.profil.hedef_net}`,
        metin: fark <= 0 ? "Hedef netine ulaşmış veya aşmış görünüyor." : `Hedefine ${fark} net kalmış; mevcut ortalama ${Math.round(ort * 10) / 10}.`,
      });
    }

    m.push({ ikon: "📘", baslik: `Konu ilerlemesi: %${konuIlerleme.yuzde}`, metin: `${konuIlerleme.biten} / ${konuIlerleme.toplam} konu tamamlanmış.` });

    return m;
  }, [denemeler, dersler, ozet, veri, ort, konuIlerleme]);

  function haftalikPdf() {
    const satirlar: (string | number)[][] = [["Gün", "Süre (dk)", "Soru", "Görevler"]];
    const bugun = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(bugun);
      d.setDate(bugun.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const sure = veri.calismalar.filter((c) => c.tarih === iso).reduce((a, c) => a + (c.sure_dk || 0), 0);
      const soru = veri.calismalar.filter((c) => c.tarih === iso).reduce((a, c) => a + (c.soru_sayisi || 0), 0);
      const gorevler = veri.gorevler.filter((g) => g.tarih === iso);
      const tam = gorevler.filter((g) => g.tamamlandi).length;
      const ad = iso.slice(8) + "." + iso.slice(5, 7);
      satirlar.push([ad, sure, soru, gorevler.length === 0 ? "—" : `${tam}/${gorevler.length}`]);
    }
    satirlar.push(["TOPLAM", ozet.haftaSure, ozet.haftaSoru, `${ozet.haftaGorevTam}/${ozet.haftaGorevTam + ozet.haftaGorevKalan}`]);
    pdfYazdir("Haftalık Gelişim Raporu", `${veri.cocuk_adi} · ${bugunIso()}`, satirlar);
  }

  function aylikPdf() {
    const satirlar: (string | number)[][] = [
      ["Metrik", "Değer"],
      ["Toplam Çalışma (saat)", Math.round((ozet.aySure / 60) * 10) / 10],
      ["Toplam Soru", ozet.aySoru],
      ["Deneme Sayısı", ozet.ayDenemeAdet],
      ["Ortalama Net (30 gün)", ozet.ayOrt === null ? "—" : Math.round(ozet.ayOrt * 10) / 10],
      ["Konu İlerlemesi (%)", konuIlerleme.yuzde],
    ];
    for (const d of dersler) {
      satirlar.push([`Başarı · ${d.ad} (%)`, d.yuzde]);
    }
    satirlar.push(["", ""]);
    satirlar.push(["Deneme", "Net"]);
    for (const d of denemeler) {
      satirlar.push([d.ad, d.net]);
    }
    pdfYazdir("Aylık Gelişim Raporu", `${veri.cocuk_adi} · Son 30 gün`, satirlar);
  }

  async function handleGonder() {
    if (!kocId || !girdi.trim()) return;
    setGonderiliyor(true);
    try {
      const yeni = await mesajGonder(kocId, girdi.trim());
      setMesajlar((m) => [...m, yeni]);
      setGirdi("");
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  const nav: { id: Sekme; ikon: string; ad: string }[] = [
    { id: "genel", ikon: "📊", ad: "Genel Durum" },
    { id: "grafikler", ikon: "📈", ad: "Grafikler" },
    { id: "takvim", ikon: "🗓️", ad: "Takvim" },
    { id: "bildirimler", ikon: "🔔", ad: "Bildirimler" },
    { id: "rapor", ikon: "📄", ad: "Rapor" },
    { id: "ai", ikon: "✨", ad: "AI Özet" },
    { id: "mesaj", ikon: "✉️", ad: "Koç'a Mesaj" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="mark"><UYArrow size={20} color="#E4BB60" /></span>
          <span className="sidebar-logo-text">Universitely</span>
        </div>
        <nav className="sidebar-nav">
          <p className="sidebar-grup">Veli</p>
          {nav.map((n) => (
            <button key={n.id} onClick={() => setSekme(n.id)} className={`sidebar-item${sekme === n.id ? " active" : ""}`}>
              <span>{n.ikon}</span><span>{n.ad}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={() => supabase.auth.signOut()}>Çıkış Yap</button>
        </div>
      </aside>
      <main className="main-area">
        {sekme === "genel" && (
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Çocuğumun Durumu</h1>

            {sonuclar.length === 0 && veri.calismalar.length === 0 ? (
              <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
                <p style={{ color: "var(--muted)", fontSize: 13 }}>
                  Henüz veri yok ya da hesabın çocuğuna bağlanmamış. Bağlantı kodu ile kayıt olduysan koçundan kontrol etmesini iste.
                </p>
              </div>
            ) : (
              <>
                <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, animationDelay: "0.05s" }}>
                  <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)" }}>
                      {ort !== null ? <AnimatedNumber value={Math.round(ort * 10) / 10} decimals={1} /> : "—"}
                    </p>
                    <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>ortalama net</p>
                  </div>
                  <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)" }}><AnimatedNumber value={denemeler.length} /></p>
                    <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>deneme</p>
                  </div>
                </div>

                <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, animationDelay: "0.1s" }}>
                  <div className="card" style={{ marginTop: 16, textAlign: "center" }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}><AnimatedNumber value={ozet.bugunSure} /> dk</p>
                    <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>bugün çalışma süresi</p>
                  </div>
                  <div className="card" style={{ marginTop: 16, textAlign: "center" }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}><AnimatedNumber value={ozet.bugunSoru} /></p>
                    <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>bugün çözülen soru</p>
                  </div>
                </div>

                <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
                  <h2 className="card-title">Haftalık Özet</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{Math.round((ozet.haftaSure / 60) * 10) / 10} sa</p>
                      <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>çalışma süresi</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{ozet.haftaSoru}</p>
                      <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>çözülen soru</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 700, color: ozet.haftaGorevKalan > 0 ? "var(--gold)" : "var(--dogru)" }}>
                        {ozet.haftaGorevTam}/{ozet.haftaGorevTam + ozet.haftaGorevKalan}
                      </p>
                      <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>tamamlanan görev</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{ozet.haftaDeneme}</p>
                      <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>yeni deneme</p>
                    </div>
                  </div>
                </div>

                <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.2s" }}>
                  <h2 className="card-title">Konu İlerlemesi</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${konuIlerleme.yuzde}%`, background: konuIlerleme.yuzde < 40 ? "var(--yanlis)" : konuIlerleme.yuzde >= 75 ? "var(--dogru)" : "var(--gold-dim)" }} />
                    </div>
                    <span className="mono" style={{ fontSize: 12.5, color: "var(--muted)" }}>%{konuIlerleme.yuzde}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{konuIlerleme.biten} / {konuIlerleme.toplam} konu tamamlanmış.</p>
                </div>

                <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.25s" }}>
                  <h2 className="card-title">Son Denemeler</h2>
                  {[...denemeler].reverse().map((d, i) => (
                    <div key={d.deneme_id ?? i} className="stagger-item" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.3 + i * 0.04}s` }}>
                      <div>
                        <p style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{d.ad}</p>
                        <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{d.tarih} · {d.dogru}D {d.yanlis}Y</p>
                      </div>
                      <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{d.net} net</span>
                    </div>
                  ))}
                </div>

                <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.3s" }}>
                  <h2 className="card-title">Ders Bazlı Başarı</h2>
                  {dersler.map((d, i) => (
                    <div key={d.ad} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.35 + i * 0.04}s` }}>
                      <span style={{ width: 110, fontSize: 13, color: "var(--ink)" }}>{d.ad}</span>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${d.yuzde}%`, background: d.yuzde < 55 ? "var(--yanlis)" : d.yuzde >= 80 ? "var(--dogru)" : "var(--gold-dim)" }} />
                      </div>
                      <span className="mono" style={{ width: 42, textAlign: "right", fontSize: 12.5, color: "var(--muted)" }}>{d.yuzde}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {sekme === "grafikler" && (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Grafikler</h1>

            <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
              <h2 className="card-title">Net Grafiği</h2>
              {denemeler.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz deneme sonucu yok.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={denemeler} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="tarih" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="net" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3.5, fill: TEAL }} name="Net" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
              <h2 className="card-title">Başarı Yüzdesi</h2>
              {dersler.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz ders bazlı veri yok.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dersler} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="ad" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                    <Tooltip />
                    <Bar dataKey="yuzde" fill={GOLD} radius={[4, 4, 0, 0]} name="Başarı %" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
              <h2 className="card-title">Çalışma İstatistikleri (14 gün)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={son14Gun} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="kisa" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sure" fill={GOLD} radius={[3, 3, 0, 0]} name="Süre (dk)" />
                  <Bar dataKey="soru" fill={TEAL} radius={[3, 3, 0, 0]} name="Soru" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {sekme === "takvim" && (
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Takvim</h1>

            <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
              <h2 className="card-title">Haftalık Plan</h2>
              {veri.calismalar.length === 0 && veri.gorevler.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz çalışma/görev kaydı yok.</p>
              ) : (
                son14Gun.slice(7).map((g, i) => {
                  const iso = g.tarih;
                  const bugunGorevler = veri.gorevler.filter((x) => x.tarih === iso);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid #f2f2f2" }}>
                      <span className="mono" style={{ width: 84, fontSize: 12.5, color: "var(--ink)", fontWeight: 600 }}>
                        {g.kisa}<span style={{ color: "var(--muted)", fontWeight: 400 }}>.{iso.slice(5, 7)}</span>
                      </span>
                      <span className="mono" style={{ width: 64, textAlign: "right", fontSize: 12, color: g.sure > 0 ? "var(--ink)" : "var(--muted)" }}>
                        {g.sure > 0 ? `${g.sure} dk` : "—"}
                      </span>
                      <span className="mono" style={{ width: 52, textAlign: "right", fontSize: 12, color: g.soru > 0 ? "var(--ink)" : "var(--muted)" }}>
                        {g.soru > 0 ? `${g.soru}` : "—"}
                      </span>
                      <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                        {bugunGorevler.length === 0 ? (
                          <span style={{ fontSize: 11.5, color: "var(--muted)" }}>görev yok</span>
                        ) : (
                          bugunGorevler.map((t) => (
                            <span key={t.id} style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 999, background: t.tamamlandi ? "rgba(44,140,96,0.12)" : "rgba(220,140,60,0.12)", color: t.tamamlandi ? "var(--dogru)" : "var(--gold-dim)" }}>
                              {t.tamamlandi ? "✓ " : "○ "}{t.baslik}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
              <h2 className="card-title">Görüşme Tarihleri</h2>
              {gelecekGorusmeler.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Planlanmış görüşme yok.</p>
              ) : (
                gelecekGorusmeler.map((g) => (
                  <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f2f2f2" }}>
                    <div>
                      <p style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{g.baslik}</p>
                      <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                        {new Date(g.tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · {g.katilimci === "veli" ? "veli görüşmesi" : "öğrenci görüşmesi"}
                      </p>
                    </div>
                    <span className="mono" style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 999, background: "rgba(228,187,96,0.15)", color: "var(--gold-dim)" }}>
                      {g.durum === "planlandi" ? "planlandı" : g.durum}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {sekme === "bildirimler" && (
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Bildirimler</h1>
            {hatirlatmalar.length === 0 ? (
              <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
                <p style={{ color: "var(--muted)", fontSize: 13 }}>Şu an bekleyen bir hatırlatma yok. Her şey yolunda!</p>
              </div>
            ) : (
              hatirlatmalar.map((h, i) => (
                <div key={h.baslik} className="card stagger-item" style={{
                  marginBottom: 12,
                  animationDelay: `${0.05 + i * 0.06}s`,
                  borderLeft: h.oncelik === "yuksek" ? "4px solid var(--yanlis)" : "4px solid var(--gold)",
                  display: "flex", gap: 12, alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: 20 }}>{h.ikon}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{h.baslik}</p>
                    <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>{h.detay}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {sekme === "rapor" && (
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Rapor</h1>

            <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
              <h2 className="card-title">Haftalık PDF</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
                Son 7 günün çalışma, görev ve deneme özetini indirilebilir PDF olarak hazırlar.
              </p>
              <button className="btn btn-primary" onClick={haftalikPdf}>Haftalık Raporu PDF Yazdır</button>
            </div>

            <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
              <h2 className="card-title">Aylık Gelişim Raporu</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{Math.round((ozet.aySure / 60) * 10) / 10} sa</p>
                  <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>30 gün çalışma</p>
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{ozet.aySoru}</p>
                  <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>30 gün soru</p>
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{ozet.ayDenemeAdet}</p>
                  <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>30 gün deneme</p>
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
                    {ozet.ayOrt === null ? "—" : Math.round(ozet.ayOrt * 10) / 10}
                  </p>
                  <p className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>30 gün ortalama net</p>
                </div>
              </div>
              <button className="btn btn-primary" onClick={aylikPdf}>Aylık Raporu PDF Yazdır</button>
            </div>
          </div>
        )}

        {sekme === "ai" && (
          <div style={{ maxWidth: 580, margin: "0 auto" }}>
            <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Çocuğumun Gelişim Özeti</h1>
            {aiOzet.map((s, i) => (
              <div key={s.baslik} className="card stagger-item" style={{ marginBottom: 12, animationDelay: `${0.05 + i * 0.06}s`, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>{s.ikon}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{s.baslik}</p>
                  <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>{s.metin}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {sekme === "mesaj" && (
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Koç'a Mesaj</h1>
            <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
              <div ref={altRef} style={{ height: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "4px 2px" }}>
                {mesajlar.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz mesaj yok.</p>}
                {mesajlar.map((m) => {
                  const benimki = m.gonderici_id === ben;
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: benimki ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "78%", padding: "8px 12px", borderRadius: 12,
                        background: benimki ? "var(--ink)" : "var(--paper-dim)",
                        color: benimki ? "var(--gold-glow)" : "var(--ink-text)",
                        fontSize: 13.5, lineHeight: 1.5,
                      }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: benimki ? "rgba(255,255,255,0.5)" : "var(--muted)", marginBottom: 3 }}>
                          {benimki ? "Sen" : "Koç"}
                        </p>
                        <p>{m.icerik}</p>
                        <p style={{ fontSize: 10, color: benimki ? "rgba(255,255,255,0.4)" : "var(--muted)", marginTop: 4 }}>
                          {new Date(m.tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input className="input" style={{ flex: 1 }} value={girdi} onChange={(e) => setGirdi(e.target.value)} placeholder="Koçuna mesajını yaz…" onKeyDown={(e) => e.key === "Enter" && handleGonder()} />
                <button onClick={handleGonder} disabled={gonderiliyor || !girdi.trim() || !kocId} className="btn btn-primary">Gönder</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
