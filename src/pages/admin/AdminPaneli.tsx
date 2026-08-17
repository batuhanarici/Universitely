import { useToast } from "../../components/useToast";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useBrowserRoute } from "../../lib/useBrowserRoute";
import {
  adminHesapDurumuGuncelle,
  adminIstatistikGetir,
  adminKocDavetEt,
  adminKullanicilariGetir,
  adminSikayetGuncelle,
  adminSikayetleriGetir,
  type AdminIstatistik,
  type AdminKullanici,
  type AdminSikayet,
} from "../../lib/adminQueries";
import { Badge, Btn, Card, FormGroup, Input, KPICard, Label, LoadingState, Select, Textarea } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { PanelLayout } from "../../components/Layout";
import type { NavGroup } from "../../components/navigation";

const adminNav: NavGroup[] = [
  { group: "Yönetim", items: [
    { path: "/admin/dashboard", label: "Genel Bakış", icon: "home" },
    { path: "/admin/users", label: "Kullanıcılar", icon: "students" },
    { path: "/admin/coaches", label: "Koç Yönetimi", icon: "user" },
    { path: "/admin/complaints", label: "Şikâyetler", icon: "alert" },
    { path: "/admin/statistics", label: "İstatistikler", icon: "chart" },
  ]},
  { group: "Oturum", items: [
    { path: "/", label: "Çıkış Yap", icon: "logout" },
  ]},
];

const adminRoutes = ["/admin/dashboard", "/admin/users", "/admin/coaches", "/admin/complaints", "/admin/statistics"] as const;
type AdminRoute = typeof adminRoutes[number];

function rolEtiketi(rol: AdminKullanici["rol"]) {
  return rol === "ogrenci" ? "Öğrenci" : rol === "veli" ? "Veli" : rol === "admin" ? "Admin" : "Koç";
}

function sikayetDurumuEtiketi(durum: AdminSikayet["durum"]) {
  return durum === "bekliyor" ? "Bekliyor" : durum === "inceleniyor" ? "İnceleniyor" : durum === "cozuldu" ? "Çözüldü" : "Reddedildi";
}

function tarihEtiketi(tarih: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(tarih));
}

export default function AdminPaneli() {
  const [sekme, navigate] = useBrowserRoute(adminRoutes, "/admin/dashboard");
  const { toast, show } = useToast();
  const [istatistik, setIstatistik] = useState<AdminIstatistik | null>(null);
  const [kullanicilar, setKullanicilar] = useState<AdminKullanici[]>([]);
  const [sikayetler, setSikayetler] = useState<AdminSikayet[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [arama, setArama] = useState("");
  const [askiyaAlinacak, setAskiyaAlinacak] = useState<string | null>(null);
  const [askiyaNedeni, setAskiyaNedeni] = useState("");
  const [davetEmail, setDavetEmail] = useState("");
  const [davetAd, setDavetAd] = useState("");
  const [davetGonderiliyor, setDavetGonderiliyor] = useState(false);
  const [sikayetNotlari, setSikayetNotlari] = useState<Record<string, string>>({});
  const [sikayetKaydediliyor, setSikayetKaydediliyor] = useState<string | null>(null);

  async function verileriYukle() {
    setYukleniyor(true);
    setHata("");
    try {
      const [stats, users, complaints] = await Promise.all([
        adminIstatistikGetir(),
        adminKullanicilariGetir(),
        adminSikayetleriGetir(),
      ]);
      setIstatistik(stats);
      setKullanicilar(users);
      setSikayetler(complaints);
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Admin verileri yüklenemedi.");
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => { void verileriYukle(); }, []);

  function git(path: string) {
    if (path === "/") {
      void supabase.auth.signOut();
      return;
    }
    if (adminRoutes.includes(path as AdminRoute)) navigate(path as AdminRoute);
  }

  const filtreliKullanicilar = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr-TR");
    if (!q) return kullanicilar;
    return kullanicilar.filter((k) => `${k.ad_soyad ?? ""} ${k.email} ${rolEtiketi(k.rol)}`.toLocaleLowerCase("tr-TR").includes(q));
  }, [arama, kullanicilar]);

  async function hesapDurumunuDegistir(kullanici: AdminKullanici, durum: "aktif" | "askida") {
    try {
      await adminHesapDurumuGuncelle(kullanici.id, durum, askiyaAlinacak === kullanici.id ? askiyaNedeni : undefined);
      setKullanicilar((mevcut) => mevcut.map((k) => k.id === kullanici.id ? { ...k, hesap_durumu: durum, hesap_nedeni: askiyaAlinacak === kullanici.id ? askiyaNedeni : null } : k));
      setAskiyaAlinacak(null);
      setAskiyaNedeni("");
      show(durum === "askida" ? "Hesap askıya alındı." : "Hesap yeniden aktifleştirildi.");
      const stats = await adminIstatistikGetir();
      setIstatistik(stats);
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Hesap durumu değiştirilemedi.");
    }
  }

  async function koçDavetiGonder(e: React.FormEvent) {
    e.preventDefault();
    setDavetGonderiliyor(true);
    try {
      await adminKocDavetEt(davetEmail, davetAd);
      setDavetEmail("");
      setDavetAd("");
      show("Koç daveti gönderildi.");
      await verileriYukle();
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Koç daveti gönderilemedi.");
    } finally {
      setDavetGonderiliyor(false);
    }
  }

  async function sikayetKaydet(sikayet: AdminSikayet) {
    setSikayetKaydediliyor(sikayet.id);
    try {
      await adminSikayetGuncelle(sikayet.id, sikayet.durum, sikayetNotlari[sikayet.id] ?? sikayet.admin_notu ?? "");
      show("Şikâyet güncellendi.");
      setSikayetler((mevcut) => mevcut.map((s) => s.id === sikayet.id ? { ...s, admin_notu: sikayetNotlari[sikayet.id] ?? s.admin_notu } : s));
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Şikâyet güncellenemedi.");
    } finally {
      setSikayetKaydediliyor(null);
    }
  }

  function dashboard() {
    return (
      <>
        <div>
          <h1 className="page-title">Genel Bakış</h1>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Universitely operasyon durumunu tek ekrandan izle.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
          <KPICard label="Toplam kullanıcı" value={istatistik?.toplamKullanici ?? 0} color="#16283F" />
          <KPICard label="Aktif öğrenci" value={istatistik?.aktifOgrenci ?? 0} color="#2A9D8F" />
          <KPICard label="Koç" value={istatistik?.toplamKoc ?? 0} color="#E4BB60" />
          <KPICard label="Bekleyen şikâyet" value={istatistik?.bekleyenSikayet ?? 0} color="#C4503A" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card><h2 className="section-title" style={{ fontSize: 17 }}>Operasyon özeti</h2><p style={{ color: "rgba(15,27,45,0.58)", fontSize: 13, lineHeight: 1.6 }}>Son 30 günde <strong>{istatistik?.son30GunKayit ?? 0}</strong> yeni kayıt oluştu. Toplam <strong>{istatistik?.toplamGorev ?? 0}</strong> görev, <strong>{istatistik?.askidakiHesap ?? 0}</strong> askıya alınmış hesap bulunuyor.</p></Card>
          <Card><h2 className="section-title" style={{ fontSize: 17 }}>Ürün durumu</h2><p style={{ color: "rgba(15,27,45,0.58)", fontSize: 13, lineHeight: 1.6 }}>Ücretli abonelik henüz aktif olmadığı için satın alma yönetimi bu fazda pasif tutuluyor. Ürün kullanım ve koç–öğrenci operasyonları hazır olduğunda ödeme modülü ayrı bir fazda ele alınacak.</p></Card>
        </div>
      </>
    );
  }

  function kullaniciYonetimi() {
    return (
      <>
        <div><h1 className="page-title">Kullanıcı Yönetimi</h1><p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Hesap durumlarını ve rollerini güvenli RPC’ler üzerinden yönet.</p></div>
        <Card>
          <FormGroup><Label>Arama</Label><Input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Ad, e-posta veya rol ara…" /></FormGroup>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {filtreliKullanicilar.map((kullanici) => (
              <div key={kullanici.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 100px 110px auto", gap: 12, alignItems: "center", padding: "11px 12px", border: "1px solid rgba(15,27,45,0.08)", borderRadius: 8 }}>
                <div style={{ minWidth: 0 }}><strong style={{ display: "block", fontSize: 13, color: "#16283F" }}>{kullanici.ad_soyad || "İsimsiz kullanıcı"}</strong><span style={{ color: "rgba(15,27,45,0.5)", fontSize: 11 }}>{kullanici.email}</span></div>
                <Badge variant={kullanici.rol === "koc" ? "gold" : kullanici.rol === "ogrenci" ? "teal" : kullanici.rol === "admin" ? "ink" : "gray"}>{rolEtiketi(kullanici.rol)}</Badge>
                <Badge variant={kullanici.hesap_durumu === "aktif" ? "teal" : "brick"}>{kullanici.hesap_durumu === "aktif" ? "Aktif" : "Askıda"}</Badge>
                {kullanici.hesap_durumu === "askida" ? <Btn size="sm" variant="ghost" onClick={() => void hesapDurumunuDegistir(kullanici, "aktif")}>Aktifleştir</Btn> : <Btn size="sm" variant="danger" onClick={() => { setAskiyaAlinacak(kullanici.id); setAskiyaNedeni(""); }}>Askıya al</Btn>}
                {askiyaAlinacak === kullanici.id && <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, alignItems: "flex-end" }}><FormGroup style={{ flex: 1 }}><Label>Askıya alma nedeni</Label><Input value={askiyaNedeni} onChange={(e) => setAskiyaNedeni(e.target.value)} placeholder="Örn. Kullanım koşulu ihlali" /></FormGroup><Btn size="sm" variant="danger" onClick={() => void hesapDurumunuDegistir(kullanici, "askida")} disabled={!askiyaNedeni.trim()}>Onayla</Btn><Btn size="sm" variant="ghost" onClick={() => setAskiyaAlinacak(null)}>Vazgeç</Btn></div>}
              </div>
            ))}
            {filtreliKullanicilar.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Kullanıcı bulunamadı.</p>}
          </div>
        </Card>
      </>
    );
  }

  function kocYonetimi() {
    const koclar = kullanicilar.filter((k) => k.rol === "koc");
    return (
      <>
        <div><h1 className="page-title">Koç Yönetimi</h1><p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Yeni koçları e-posta davetiyle ekle; mevcut koçların hesap durumunu kullanıcı yönetiminden değiştir.</p></div>
        <Card>
          <h2 className="section-title" style={{ fontSize: 17 }}>Sisteme koç ekle</h2>
          <form onSubmit={koçDavetiGonder} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <FormGroup><Label>Ad soyad</Label><Input value={davetAd} onChange={(e) => setDavetAd(e.target.value)} placeholder="Koçun adı soyadı" required /></FormGroup>
            <FormGroup><Label>E-posta</Label><Input type="email" value={davetEmail} onChange={(e) => setDavetEmail(e.target.value)} placeholder="koc@ornek.com" required /></FormGroup>
            <Btn type="submit" disabled={davetGonderiliyor}>{davetGonderiliyor ? "Gönderiliyor…" : "Davet gönder"}</Btn>
          </form>
        </Card>
        <Card>
          <h2 className="section-title" style={{ fontSize: 17 }}>Koçlar ({koclar.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{koclar.map((k) => <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(15,27,45,0.07)" }}><Icon name="user" size={17} color="#2A9D8F" /><div style={{ flex: 1 }}><strong style={{ fontSize: 13 }}>{k.ad_soyad || "İsimsiz koç"}</strong><span style={{ display: "block", fontSize: 11, color: "rgba(15,27,45,0.5)" }}>{k.email}</span></div><Badge variant={k.hesap_durumu === "aktif" ? "teal" : "brick"}>{k.hesap_durumu === "aktif" ? "Aktif" : "Askıda"}</Badge></div>)}</div>
        </Card>
      </>
    );
  }

  function sikayetYonetimi() {
    return (
      <>
        <div><h1 className="page-title">Şikâyetleri İncele</h1><p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Kullanıcı bildirimlerini durum ve admin notuyla takip et.</p></div>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{sikayetler.map((sikayet) => <div key={sikayet.id} style={{ padding: 14, border: "1px solid rgba(15,27,45,0.08)", borderRadius: 8 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}><div><strong style={{ fontSize: 14, color: "#16283F" }}>{sikayet.baslik}</strong><div style={{ fontSize: 11, color: "rgba(15,27,45,0.5)", marginTop: 4 }}>{sikayet.bildiren_email || "Bilinmeyen kullanıcı"} · {tarihEtiketi(sikayet.created_at)} · {sikayet.kategori}</div></div><Badge variant={sikayet.durum === "cozuldu" ? "teal" : sikayet.durum === "reddedildi" ? "brick" : "gold"}>{sikayetDurumuEtiketi(sikayet.durum)}</Badge></div><p style={{ fontSize: 13, color: "rgba(15,27,45,0.67)", lineHeight: 1.55, margin: "10px 0" }}>{sikayet.aciklama}</p><div style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", gap: 8, alignItems: "end" }}><FormGroup><Label>Durum</Label><Select value={sikayet.durum} onChange={(e) => setSikayetler((mevcut) => mevcut.map((s) => s.id === sikayet.id ? { ...s, durum: e.target.value as AdminSikayet["durum"] } : s))}><option value="bekliyor">Bekliyor</option><option value="inceleniyor">İnceleniyor</option><option value="cozuldu">Çözüldü</option><option value="reddedildi">Reddedildi</option></Select></FormGroup><FormGroup><Label>Admin notu</Label><Textarea value={sikayetNotlari[sikayet.id] ?? sikayet.admin_notu ?? ""} onChange={(e) => setSikayetNotlari((mevcut) => ({ ...mevcut, [sikayet.id]: e.target.value }))} placeholder="İnceleme notu" /></FormGroup><Btn size="sm" onClick={() => void sikayetKaydet(sikayet)} disabled={sikayetKaydediliyor === sikayet.id}>{sikayetKaydediliyor === sikayet.id ? "…" : "Kaydet"}</Btn></div></div>)}{sikayetler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz şikâyet bulunmuyor.</p>}</div>
        </Card>
      </>
    );
  }

  function istatistikSayfasi() {
    return (
      <>
        <div><h1 className="page-title">İstatistikler</h1><p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Platformun operasyonel kullanım metriklerini izle.</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}><KPICard label="Toplam kullanıcı" value={istatistik?.toplamKullanici ?? 0} /><KPICard label="Toplam öğrenci" value={istatistik?.toplamOgrenci ?? 0} color="#2A9D8F" /><KPICard label="Toplam koç" value={istatistik?.toplamKoc ?? 0} color="#E4BB60" /><KPICard label="Son 30 gün kaydı" value={istatistik?.son30GunKayit ?? 0} color="#C4503A" /></div>
        <Card><h2 className="section-title" style={{ fontSize: 17 }}>Operasyon metrikleri</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 12 }}>{[["Aktif öğrenciler", istatistik?.aktifOgrenci], ["Toplam görev", istatistik?.toplamGorev], ["Askıdaki hesap", istatistik?.askidakiHesap], ["Bekleyen şikâyet", istatistik?.bekleyenSikayet]].map(([label, value]) => <div key={String(label)} style={{ padding: 12, background: "rgba(15,27,45,0.035)", borderRadius: 8 }}><span style={{ display: "block", fontSize: 11, color: "rgba(15,27,45,0.5)" }}>{label}</span><strong style={{ display: "block", marginTop: 5, fontSize: 22, color: "#16283F" }}>{value ?? 0}</strong></div>)}</div></Card>
      </>
    );
  }

  const icerik = sekme === "/admin/users" ? kullaniciYonetimi() : sekme === "/admin/coaches" ? kocYonetimi() : sekme === "/admin/complaints" ? sikayetYonetimi() : sekme === "/admin/statistics" ? istatistikSayfasi() : dashboard();

  return <PanelLayout navConfig={adminNav} roleLabel="Admin Paneli" activePath={sekme} onNavigate={git}>
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1120, margin: "0 auto", padding: "24px 22px 64px" }}>
      {hata && <Card style={{ borderLeft: "4px solid #C4503A", color: "#C4503A", fontSize: 13 }}>{hata}</Card>}
      {yukleniyor ? <LoadingState label="Admin verileri yükleniyor…" /> : icerik}
      {toast}
    </div>
  </PanelLayout>;
}
