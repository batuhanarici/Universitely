import { useToast } from "../../components/useToast";
import { useEffect, useState } from "react";
import { ogrenciDetayiGetir, type OgrenciDetay } from "../../lib/ogrenciYonetimQueries";
import { ogrenciTalepGetir, talepKarar, hesapSil } from "../../lib/ayarlarQueries";
import type { HesapSilmeTalebi } from "../../types/database";
import { useAuth } from "../../lib/authContext";
import { Card, KPICard, ProgressBar, Checkbox, Btn, Badge, Input, Label, FormGroup } from "../../components/ui";

export default function OgrenciDetay({ ogrenciId, onGeri }: { ogrenciId: string; onGeri: () => void }) {
  const { toast, show } = useToast();
  const { session } = useAuth();
  const [detay, setDetay] = useState<OgrenciDetay | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [talep, setTalep] = useState<HesapSilmeTalebi | null>(null);
  const [onayModu, setOnayModu] = useState(false);
  const [onayEmail, setOnayEmail] = useState("");
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const [hata, setHata] = useState("");

  useEffect(() => {
    ogrenciDetayiGetir(ogrenciId)
      .then(setDetay)
      .catch(() => setDetay(null))
      .finally(() => setYukleniyor(false));
    ogrenciTalepGetir(ogrenciId)
      .then((t) => {
        setTalep(t);
        setOnayModu(false);
        setOnayEmail("");
        setHata("");
      })
      .catch(() => {});
  }, [ogrenciId]);

  async function onayla() {
    if (!talep) return;
    if (onayEmail.trim().toLowerCase() !== (session?.user.email ?? "").toLowerCase()) {
      setHata("Yazdığın e-posta kendi e-postanla eşleşmiyor.");
      return;
    }
    setIslemYapiliyor(true);
    setHata("");
    try {
      await hesapSil({ tur: "ogrenci", hedef_id: ogrenciId, talep_id: talep.id, onay_email: onayEmail });
      show("Öğrencinin hesabı silindi ✓");
      setTimeout(onGeri, 800);
    } catch (err: any) {
      setHata(err.message ?? "Silme işlemi başarısız oldu.");
      setIslemYapiliyor(false);
    }
  }

  async function reddet() {
    if (!talep) return;
    setIslemYapiliyor(true);
    setHata("");
    try {
      await talepKarar(talep.id, false);
      show("Talep reddedildi ✓");
      setTalep(null);
    } catch (err: any) {
      setHata(err.message ?? "İşlem başarısız oldu.");
    } finally {
      setIslemYapiliyor(false);
    }
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;
  if (!detay) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Öğrenci bulunamadı.</p>;

  const bekleyenGorev = detay.gorevler.filter((g) => !g.tamamlandi).length;
  const cozulmemisYanlis = detay.yanlislar.filter((y) => !y.cozuldu).length;
  const toplamCalismaDk = detay.calismalar.reduce((a, c) => a + c.sure_dk, 0);
  const sonNet = detay.netler[0]?.net ?? null;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>{detay.ad_soyad}</h1>
        <Btn variant="ghost" size="sm" onClick={onGeri}>← Geri</Btn>
      </div>

      {talep && (
        <Card style={{ borderLeft: "4px solid #C4503A" }}>
          <p style={{ fontSize: 13, color: "#C4503A", fontWeight: 700, margin: "0 0 4px" }}>
            {talep.durum === "onaylandi" ? "Silme tamamlanamadı" : "Hesap silme talebi bekliyor"}
          </p>
          <p style={{ fontSize: 12.5, color: "rgba(15,27,45,0.6)", lineHeight: 1.6, margin: "0 0 12px" }}>
            {talep.durum === "onaylandi"
              ? "Öğrencinin hesabı daha önce onaylandı ancak silme işlemi tamamlanamadı. İstersen işlemi yeniden başlatabilirsin."
              : "Öğrencin bu hesabın kalıcı olarak silinmesini istiyor. Onayladığında öğrencinin tüm verileri silinir ve hesabı kapatılır."}
          </p>
          {!onayModu ? (
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" size="sm" onClick={reddet} disabled={islemYapiliyor}>
                {islemYapiliyor ? "İşleniyor…" : "Reddet"}
              </Btn>
              <Btn variant="danger" size="sm" onClick={() => setOnayModu(true)} disabled={islemYapiliyor}>
                Onayla ve Sil
              </Btn>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FormGroup>
                <Label>Onaylamak için kendi e-postanı yaz</Label>
                <Input
                  type="email"
                  placeholder={session?.user.email ?? ""}
                  value={onayEmail}
                  onChange={(e) => {
                    setOnayEmail(e.target.value);
                    setHata("");
                  }}
                />
              </FormGroup>
              {hata && <p style={{ fontSize: 13, color: "#C4503A", fontWeight: 500, margin: 0 }}>{hata}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn variant="ghost" size="sm" onClick={() => setOnayModu(false)} disabled={islemYapiliyor}>
                  Vazgeç
                </Btn>
                <Btn
                  variant="danger"
                  size="sm"
                  onClick={onayla}
                  disabled={islemYapiliyor || onayEmail.trim().toLowerCase() !== (session?.user.email ?? "").toLowerCase()}
                >
                  {islemYapiliyor ? "Siliniyor…" : "Onayla ve Sil"}
                </Btn>
              </div>
            </div>
          )}
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPICard label="Son net" value={sonNet ?? 0} decimals={1} />
        <KPICard label="Toplam çalışma" value={Math.round(toplamCalismaDk / 60)} sub="saat" color="#A07C20" />
        <KPICard label="Bekleyen görev" value={bekleyenGorev} color={bekleyenGorev > 0 ? "#A07C20" : "#0F1B2D"} />
        <KPICard label="Çözülmemiş yanlış" value={cozulmemisYanlis} color={cozulmemisYanlis > 0 ? "#C4503A" : "#0F1B2D"} />
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Deneme Netleri</h3>
        {detay.netler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz deneme sonucu yok.</p>}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {detay.netler.slice(0, 8).map((n, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 500 }}>{n.deneme_adi}</p>
                <p className="tabular" style={{ fontSize: 11, color: "rgba(15,27,45,0.5)" }}>{n.tarih} · {n.dogru}D {n.yanlis}Y</p>
              </div>
              <span className="tabular" style={{ fontSize: 16, fontWeight: 700 }}>{n.net}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <h3 className="section-title" style={{ marginBottom: 6, fontSize: 16 }}>Görevler</h3>
          {detay.gorevler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Görev yok.</p>}
          {detay.gorevler.slice(0, 6).map((g) => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <Checkbox checked={g.tamamlandi} readOnly />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12.5, textDecoration: g.tamamlandi ? "line-through" : "none", opacity: g.tamamlandi ? 0.5 : 1 }}>{g.baslik}</p>
                <p className="tabular" style={{ fontSize: 10.5, color: "rgba(15,27,45,0.5)" }}>
                  {g.tarih}
                  {g.tamamlandi && (
                    <span style={{ color: g.kontrol_edildi ? "#2A9D8F" : "#A07C20" }}>
                      {" "}· {g.kontrol_edildi ? "onaylandı" : "onay bekliyor"}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="section-title" style={{ marginBottom: 6, fontSize: 16 }}>Kaynaklar</h3>
          {detay.kitaplar.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Kaynak yok.</p>}
          {detay.kitaplar.slice(0, 5).map((k) => {
            const yuzde = k.toplam === 0 ? 0 : Math.round((k.ilerleme / k.toplam) * 100);
            return (
              <div key={k.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 12.5 }}>{k.ad}</p>
                  <span className="tabular" style={{ fontSize: 11, color: "rgba(15,27,45,0.5)" }}>{k.ilerleme}/{k.toplam}</span>
                </div>
                <ProgressBar pct={yuzde} color="#A07C20" />
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <h3 className="section-title" style={{ marginBottom: 6, fontSize: 16 }}>Yanlış Arşivi</h3>
          {detay.yanlislar.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Yanlış yok.</p>}
          {detay.yanlislar.slice(0, 5).map((y) => (
            <div key={y.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: y.cozuldu ? "#2A9D8F" : "#C4503A", flexShrink: 0 }} />
              <p style={{ flex: 1, fontSize: 12.5 }}>{y.aciklama || y.kaynak_adi || "Yanlış"}</p>
              <Badge variant={y.cozuldu ? "teal" : "brick"}>{y.cozuldu ? "çözüldü" : "çözülmedi"}</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="section-title" style={{ marginBottom: 6, fontSize: 16 }}>Son Çalışmalar</h3>
          {detay.calismalar.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Çalışma kaydı yok.</p>}
          {detay.calismalar.slice(0, 5).map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
              <p style={{ fontSize: 12.5 }}>{c.not ?? (c.konu_id ? "Konu çalışması" : "Genel çalışma")}</p>
              <span className="tabular" style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)" }}>{c.sure_dk}dk · {c.tarih}</span>
            </div>
          ))}
        </Card>
      </div>

      {detay.profil && (detay.profil.hedef_net != null || detay.profil.hedef_universite) && (
        <Card style={{ borderLeft: "4px solid #E4BB60" }}>
          <p className="mono" style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)", marginBottom: 6 }}>HEDEF</p>
          {detay.profil.hedef_universite && <p style={{ fontSize: 14, fontWeight: 600 }}>{detay.profil.hedef_universite}</p>}
          {detay.profil.hedef_bolum && <p style={{ fontSize: 12.5, color: "rgba(15,27,45,0.5)" }}>{detay.profil.hedef_bolum}</p>}
          {detay.profil.hedef_net != null && <Badge variant="gold" >Hedef {detay.profil.hedef_net} net</Badge>}
        </Card>
      )}

      {toast}
    </div>
  );
}
