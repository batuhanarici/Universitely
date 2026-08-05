import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { sinifSonuclariniGetir, type SinifSonucSatiri } from "../../lib/sinifQueries";
import { gorevleriGetir } from "../../lib/gorevQueries";
import AnimatedNumber from "../../components/AnimatedNumber";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function oranHesapla(dogru: number, yanlis: number, bos: number) {
  const toplam = dogru + yanlis + bos;
  return toplam === 0 ? 0 : Math.round((dogru / toplam) * 100);
}

export default function KocDashboard({ onOgrenciSec }: { onOgrenciSec: (id: string) => void }) {
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [satirlar, setSatirlar] = useState<SinifSonucSatiri[]>([]);
  const [gorevler, setGorevler] = useState<{ ogrenci_id: string; baslik: string; tarih: string; tamamlandi: boolean; kontrol_edildi: boolean; tip: string }[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([kocOgrencileri(), sinifSonuclariniGetir(), gorevleriGetir()])
      .then(([o, s, g]) => {
        setOgrenciler(o);
        setSatirlar(s);
        setGorevler(g);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

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
      if (!o.konular.has(s.konu_adi)) o.konular.set(s.konu_adi, { dogru: 0, yanlis: 0, bos: 0 });
      const k = o.konular.get(s.konu_adi)!;
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

  const bugunGorevleri = gorevler.filter((g) => g.tarih === bugunIso());
  const bekleyenGorev = bugunGorevleri.filter((g) => !g.tamamlandi).length;
  const aktifSayisi = ogrenciler.filter((o) => o.aktif).length;
  const pasifSayisi = ogrenciler.length - aktifSayisi;

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Koç Paneli</h1>

      <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, animationDelay: "0.05s" }}>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)" }}><AnimatedNumber value={ogrenciler.length} /></p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>öğrenci</p>
        </div>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: "var(--dogru)" }}><AnimatedNumber value={aktifSayisi} /></p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>aktif</p>
        </div>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: "var(--bos)" }}><AnimatedNumber value={pasifSayisi} /></p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>pasif</p>
        </div>
        <div className="card" style={{ marginTop: 0, textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: bekleyenGorev > 0 ? "var(--gold-dim)" : "var(--ink)" }}><AnimatedNumber value={bekleyenGorev} /></p>
          <p className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>bugün bekleyen görev</p>
        </div>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
        <h2 className="card-title">Öğrencilerim</h2>
        {ogrenciler.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Henüz öğrencin yok. "Öğrenciler" sekmesinden davet kodu oluşturup öğrencilerine gönderebilirsin.
          </p>
        )}
        {ogrenciler.map((o, i) => {
          const ozet = ogrenciOzet.get(o.id);
          return (
            <div
              key={o.id}
              className="stagger-item"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.04}s` }}
            >
              <span
                style={{
                  width: 9, height: 9, borderRadius: 99, flexShrink: 0,
                  background: o.aktif ? "var(--dogru)" : "#cfcfcf",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{o.ad_soyad}</p>
                <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ozet ? `Ort. ${ozet.net} net · en zayıf: ${ozet.enZayifKonu} (%${ozet.enZayifOran})` : "Henüz sonuç verisi yok"}
                </p>
              </div>
              {o.aktif ? null : <span className="chip" style={{ fontSize: 10.5 }}>Pasif</span>}
              <button onClick={() => onOgrenciSec(o.id)} className="btn" style={{ background: "var(--ink)", color: "var(--gold-glow)", padding: "6px 12px", fontSize: 12 }}>Detay</button>
            </div>
          );
        })}
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
        <h2 className="card-title">Bugünün Görevleri</h2>
        {bugunGorevleri.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Bugün için atanmış görev yok.</p>}
        {bugunGorevleri.map((g, i) => {
          const o = ogrenciler.find((x) => x.id === g.ogrenci_id);
          return (
            <div key={i} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.2 + i * 0.04}s` }}>
              <input type="checkbox" checked={g.tamamlandi} readOnly style={{ accentColor: "var(--gold-dim)" }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13.5, color: "var(--ink)", textDecoration: g.tamamlandi ? "line-through" : "none", opacity: g.tamamlandi ? 0.5 : 1 }}>{g.baslik}</p>
                <p style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {o?.ad_soyad ?? "?"} · {g.tip}
                  {g.tamamlandi && (
                    <span style={{ color: g.kontrol_edildi ? "var(--dogru)" : "var(--gold-dim)" }}>
                      {" "}· {g.kontrol_edildi ? "onaylandı" : "onay bekliyor"}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
