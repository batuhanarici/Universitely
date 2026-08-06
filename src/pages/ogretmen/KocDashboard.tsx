import { useEffect, useMemo, useState } from "react";
import { kocAnalizVerisiniGetir } from "../../lib/kocAiQueries";
import { kocRiskleriniHesapla, type OgrenciRiski } from "../../lib/aiMotoru";
import { gorusmeleriGetir } from "../../lib/kocAraclariQueries";
import type { KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import type { Gorusme, KocSonucSatiri, Gorev } from "../../types/database";
import { Card, KPICard, Badge, ProgressBar } from "../../components/ui";
import { Icon } from "../../components/Icon";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function oranHesapla(dogru: number, yanlis: number, bos: number) {
  const toplam = dogru + yanlis + bos;
  return toplam === 0 ? 0 : Math.round((dogru / toplam) * 100);
}

const RISK_RENK: Record<string, string> = { yuksek: "#C4503A", orta: "#E4BB60", dusuk: "#2A9D8F" };
const RISK_METIN: Record<string, string> = { yuksek: "yüksek", orta: "orta", dusuk: "düşük" };
const RISK_BADGE: Record<string, "brick" | "gold" | "teal"> = { yuksek: "brick", orta: "gold", dusuk: "teal" };

export default function KocDashboard({ onOgrenciSec }: { onOgrenciSec: (id: string) => void }) {
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [satirlar, setSatirlar] = useState<KocSonucSatiri[]>([]);
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [riskler, setRiskler] = useState<OgrenciRiski[]>([]);
  const [gorusmeler, setGorusmeler] = useState<Gorusme[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([kocAnalizVerisiniGetir(), gorusmeleriGetir()])
      .then(([v, g]) => {
        setOgrenciler(v.ogrenciler);
        setSatirlar(v.sonuclar);
        setGorevler(v.gorevler);
        setRiskler(kocRiskleriniHesapla(v));
        setGorusmeler(g);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const ogrenciAdi = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of ogrenciler) map.set(o.id, o.ad_soyad);
    return map;
  }, [ogrenciler]);

  const ogrenciOzet = useMemo(() => {
    const ogrenciMap = new Map<string, { dogru: number; yanlis: number; bos: number; konular: Map<string, { dogru: number; yanlis: number; bos: number }> }>();
    for (const s of satirlar) {
      if (!ogrenciMap.has(s.ogrenci_id)) {
        ogrenciMap.set(s.ogrenci_id, { dogru: 0, yanlis: 0, bos: 0, konular: new Map() });
      }
      const o = ogrenciMap.get(s.ogrenci_id)!;
      if (s.durum === "dogru") o.dogru++;
      else if (s.durum === "yanlis") o.yanlis++;
      else o.bos++;
      if (!o.konular.has(s.konu_adi ?? "—")) o.konular.set(s.konu_adi ?? "—", { dogru: 0, yanlis: 0, bos: 0 });
      const k = o.konular.get(s.konu_adi ?? "—")!;
      if (s.durum === "dogru") k.dogru++;
      else if (s.durum === "yanlis") k.yanlis++;
      else k.bos++;
    }
    const liste = new Map<string, { net: number; enZayifKonu: string; enZayifOran: number }>();
    for (const [id, o] of ogrenciMap.entries()) {
      let enZayifKonu = "—";
      let enZayifOran = 101;
      for (const [konu, k] of o.konular.entries()) {
        const oran = oranHesapla(k.dogru, k.yanlis, k.bos);
        if (oran < enZayifOran) {
          enZayifOran = oran;
          enZayifKonu = konu;
        }
      }
      liste.set(id, {
        net: Math.round((o.dogru - o.yanlis / 4) * 10) / 10,
        enZayifKonu,
        enZayifOran,
      });
    }
    return liste;
  }, [satirlar]);

  const riskliOgrenciler = useMemo(() => riskler.filter((r) => r.aktif).slice(0, 5), [riskler]);

  const yaklasanGorusmeler = useMemo(() => {
    const simdi = Date.now();
    return gorusmeler
      .filter((g) => g.durum === "planlandi" && new Date(g.tarih).getTime() >= simdi)
      .sort((a, b) => a.tarih.localeCompare(b.tarih))
      .slice(0, 5);
  }, [gorusmeler]);

  const bugunGorevleri = gorevler.filter((g) => g.tarih === bugunIso());
  const bekleyenGorev = bugunGorevleri.filter((g) => !g.tamamlandi).length;
  const aktifSayisi = ogrenciler.filter((o) => o.aktif).length;
  const pasifSayisi = ogrenciler.length - aktifSayisi;

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Koç Paneli</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Sınıfına genel bakış · {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid-4">
        <KPICard label="Toplam Öğrenci" value={ogrenciler.length} />
        <KPICard label="Aktif" value={aktifSayisi} color="#2A9D8F" />
        <KPICard label="Pasif" value={pasifSayisi} color="#9A9FA8" />
        <KPICard label="Bugün Bekleyen Görev" value={bekleyenGorev} color={bekleyenGorev > 0 ? "#C4503A" : "#0F1B2D"} />
      </div>

      <div className="grid-2">
        <Card className="tape-accent">
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Riskli Öğrenciler</h3>
          {riskliOgrenciler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Riskli öğrenci yok — herkes düşük riskte.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {riskliOgrenciler.map((r) => (
              <div key={r.ogrenci_id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, flexShrink: 0, background: RISK_RENK[r.seviye] }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.ad_soyad}</span>
                <div style={{ width: 90 }}><ProgressBar pct={r.riskSkoru} color={RISK_RENK[r.seviye]} /></div>
                <Badge variant={RISK_BADGE[r.seviye]}>{RISK_METIN[r.seviye]}</Badge>
                <button className="btn btn-ghost btn-sm" onClick={() => onOgrenciSec(r.ogrenci_id)}><Icon name="user" size={12} /></button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Öğrencilerim</h3>
          {ogrenciler.length === 0 && (
            <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>
              Henüz öğrencin yok. "Öğrenciler" sekmesinden davet kodu oluşturup öğrencilerine gönderebilirsin.
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {ogrenciler.map((o) => {
              const ozet = ogrenciOzet.get(o.id);
              return (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, flexShrink: 0, background: o.aktif ? "#2A9D8F" : "#9A9FA8" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{o.ad_soyad}</p>
                    <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ozet ? `Ort. ${ozet.net} net · en zayıf: ${ozet.enZayifKonu} (%${ozet.enZayifOran})` : "Henüz sonuç verisi yok"}
                    </p>
                  </div>
                  {o.aktif ? null : <Badge variant="gray">Pasif</Badge>}
                  <button className="btn btn-ghost btn-sm" onClick={() => onOgrenciSec(o.id)}><Icon name="user" size={12} /></button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Yaklaşan Görüşmeler</h3>
          {yaklasanGorusmeler.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Planlanmış yaklaşan görüşme yok.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {yaklasanGorusmeler.map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{g.baslik}</p>
                  <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)" }}>
                    {ogrenciAdi.get(g.ogrenci_id) ?? "Öğrenci"} · {g.katilimci === "veli" ? "Veli" : "Öğrenci"} ·{" "}
                    {new Date(g.tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <Badge variant="gold">Planlandı</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Bugünün Görevleri</h3>
          {bugunGorevleri.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Bugün için atanmış görev yok.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {bugunGorevleri.map((g) => {
              const o = ogrenciler.find((x) => x.id === g.ogrenci_id);
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                  <input type="checkbox" checked={g.tamamlandi} readOnly className="checkbox" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: g.tamamlandi ? "rgba(15,27,45,0.4)" : "#0F1B2D", textDecoration: g.tamamlandi ? "line-through" : "none" }}>{g.baslik}</p>
                    <p style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)" }}>
                      {o?.ad_soyad ?? "?"} · {g.tip}
                      {g.tamamlandi && (
                        <span style={{ color: g.kontrol_edildi ? "#2A9D8F" : "#A07C20" }}>
                          {" "}· {g.kontrol_edildi ? "onaylandı" : "onay bekliyor"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
