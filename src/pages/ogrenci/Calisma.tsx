import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { calismalariGetir, calismaEkle, calismaSil, type CalismaKaydiDetayli } from "../../lib/calismaQueries";
import AnimatedNumber from "../../components/AnimatedNumber";

const POMODORO_DK = 25;

function formatSaniye(ms: number) {
  const toplamSaniye = Math.max(0, Math.ceil(ms / 1000));
  const dk = Math.floor(toplamSaniye / 60);
  const sn = toplamSaniye % 60;
  return `${String(dk).padStart(2, "0")}:${String(sn).padStart(2, "0")}`;
}

function son7Gun(): { etiket: string; iso: string }[] {
  const gunler: { etiket: string; iso: string }[] = [];
  const gunAdlari = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const t = new Date(d);
    t.setDate(d.getDate() - i);
    gunler.push({
      etiket: gunAdlari[(t.getDay() + 6) % 7],
      iso: t.toISOString().slice(0, 10),
    });
  }
  return gunler;
}

export default function Calisma() {
  const [kayitlar, setKayitlar] = useState<CalismaKaydiDetayli[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [kalanMs, setKalanMs] = useState(POMODORO_DK * 60 * 1000);
  const [calisiyor, setCalisiyor] = useState(false);
  const [pomodoroBitti, setPomodoroBitti] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const aralik = useRef<number | null>(null);
  const kayitEklendi = useRef(false);

  const [sureDk, setSureDk] = useState("");
  const [soruSayisi, setSoruSayisi] = useState("");
  const [notMetni, setNotMetni] = useState("");

  useEffect(() => {
    calismalariGetir().then(setKayitlar).catch(() => {}).finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    if (!calisiyor) return;
    aralik.current = window.setInterval(() => {
      setKalanMs((k) => Math.max(0, k - 1000));
    }, 1000);
    return () => {
      if (aralik.current) window.clearInterval(aralik.current);
    };
  }, [calisiyor]);

  useEffect(() => {
    if (kalanMs === 0 && calisiyor) setCalisiyor(false);
  }, [kalanMs, calisiyor]);

  useEffect(() => {
    if (kalanMs === 0 && !calisiyor && !kayitEklendi.current) {
      kayitEklendi.current = true;
      setPomodoroBitti(true);
      bittiKaydiEkle();
    }
  }, [kalanMs, calisiyor]);

  async function bittiKaydiEkle() {
    setKaydediliyor(true);
    try {
      const yeni = await calismaEkle({ sure_dk: POMODORO_DK, soru_sayisi: null });
      setKayitlar((k) => [yeni as CalismaKaydiDetayli, ...k]);
    } catch {
      // kayıt eklenemedi — kullanıcıya sessiz kalma
    } finally {
      setKaydediliyor(false);
    }
  }

  function baslat() {
    kayitEklendi.current = false;
    setCalisiyor(true);
    setPomodoroBitti(false);
  }

  function duraklat() {
    setCalisiyor(false);
  }

  function sifirla() {
    setCalisiyor(false);
    kayitEklendi.current = false;
    setKalanMs(POMODORO_DK * 60 * 1000);
    setPomodoroBitti(false);
  }

  async function handleManuelEkle() {
    const dk = Number(sureDk);
    if (!dk || dk <= 0) return;
    const yeni = await calismaEkle({
      sure_dk: dk,
      soru_sayisi: soruSayisi.trim() === "" ? null : Number(soruSayisi),
      not: notMetni.trim() || null,
    });
    setKayitlar((k) => [yeni as CalismaKaydiDetayli, ...k]);
    setSureDk("");
    setSoruSayisi("");
    setNotMetni("");
  }

  async function handleSil(id: string) {
    setKayitlar((k) => k.filter((x) => x.id !== id));
    await calismaSil(id);
  }

  const haftalikVeri = useMemo(() => {
    const gunler = son7Gun();
    const map = new Map<string, { sure: number; soru: number }>();
    for (const g of gunler) map.set(g.iso, { sure: 0, soru: 0 });
    for (const k of kayitlar) {
      const mevcut = map.get(k.tarih);
      if (mevcut) {
        mevcut.sure += k.sure_dk;
        mevcut.soru += k.soru_sayisi ?? 0;
      }
    }
    return gunler.map((g) => ({ etiket: g.etiket, sure: map.get(g.iso)!.sure, soru: map.get(g.iso)!.soru }));
  }, [kayitlar]);

  const toplamHafta = useMemo(() => kayitlar.reduce((a, k) => a + k.sure_dk, 0), [kayitlar]);
  const toplamSoru = useMemo(() => kayitlar.reduce((a, k) => a + (k.soru_sayisi ?? 0), 0), [kayitlar]);

  const DAIRE_YARI = 56;
  const DAIRE_CEVRE = 2 * Math.PI * DAIRE_YARI;
  const ilerleme = kalanMs / (POMODORO_DK * 60 * 1000);

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Çalışma</h1>

      <div className="stagger-item" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, animationDelay: "0.05s" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h2 className="card-title" style={{ alignSelf: "flex-start" }}>Pomodoro</h2>
          <div style={{ position: "relative", width: 128, height: 128, margin: "6px 0 4px" }}>
            <svg width={128} height={128} viewBox="0 0 128 128">
              <circle cx={64} cy={64} r={DAIRE_YARI} fill="none" stroke="var(--paper-dim)" strokeWidth={9} />
              <circle
                cx={64} cy={64} r={DAIRE_YARI} fill="none"
                stroke={kalanMs <= 5 * 60 * 1000 && calisiyor ? "var(--yanlis)" : "var(--gold-dim)"}
                strokeWidth={9} strokeLinecap="round"
                strokeDasharray={DAIRE_CEVRE}
                strokeDashoffset={DAIRE_CEVRE * (1 - ilerleme)}
                transform="rotate(-90 64 64)"
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span className="mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)" }}>{formatSaniye(kalanMs)}</span>
              <span style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{calisiyor ? "çalışıyor" : "hazır"}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {!calisiyor ? (
              <button onClick={baslat} className="btn btn-primary">{pomodoroBitti ? "Tekrar Başlat" : "Başlat"}</button>
            ) : (
              <button onClick={duraklat} className="btn btn-gold">Duraklat</button>
            )}
            <button onClick={sifirla} className="btn" style={{ background: "var(--paper-dim)", color: "var(--ink)" }}>Sıfırla</button>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
            {pomodoroBitti
              ? kaydediliyor ? "Kayıt ekleniyor…" : "25 dk tamamlandı — çalışma kaydına eklendi."
              : `${POMODORO_DK} dakika tamamlanınca otomatik kaydedilir.`}
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">Çalışma Ekle</h2>
          <label className="fld">Süre (dk)</label>
          <input className="input" value={sureDk} onChange={(e) => setSureDk(e.target.value)} type="number" min={1} placeholder="örn. 60" />
          <label className="fld">Çözülen Soru Sayısı</label>
          <input className="input" value={soruSayisi} onChange={(e) => setSoruSayisi(e.target.value)} type="number" min={0} placeholder="opsiyonel" />
          <label className="fld">Not</label>
          <input className="input" value={notMetni} onChange={(e) => setNotMetni(e.target.value)} placeholder="opsiyonel" />
          <button onClick={handleManuelEkle} disabled={!sureDk || Number(sureDk) <= 0} className="btn btn-primary" style={{ marginTop: 14 }}>
            Kaydet
          </button>
        </div>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Son 7 Gün</h2>
          <div style={{ display: "flex", gap: 14 }}>
            <span className="mono" style={{ fontSize: 12.5, color: "var(--muted)" }}>
              <span style={{ color: "var(--ink)", fontWeight: 700 }}><AnimatedNumber value={toplamHafta} /></span> dk
            </span>
            <span className="mono" style={{ fontSize: 12.5, color: "var(--muted)" }}>
              <span style={{ color: "var(--ink)", fontWeight: 700 }}><AnimatedNumber value={toplamSoru} /></span> soru
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={haftalikVeri}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="etiket" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip formatter={(v: any) => `${v} dk`} />
            <Bar dataKey="sure" name="Süre (dk)" fill="var(--gold-dim)" radius={[4, 4, 0, 0]} animationDuration={700} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.15s" }}>
        <h2 className="card-title">Kayıtlar</h2>
        {kayitlar.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz çalışma kaydı yok.</p>}
        {kayitlar.map((k) => (
          <div key={k.id} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f2f2f2" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{k.sure_dk} dk{k.soru_sayisi ? ` · ${k.soru_sayisi} soru` : ""}</p>
              <p style={{ fontSize: 11.5, color: "var(--muted)" }}>{k.tarih}{k.konu_adi ? ` · ${k.konu_adi}` : ""}{k.not ? ` · ${k.not}` : ""}</p>
            </div>
            <button onClick={() => handleSil(k.id)} style={{ border: "none", background: "none", color: "var(--yanlis)", fontSize: 12 }}>Sil</button>
          </div>
        ))}
      </div>
    </div>
  );
}
