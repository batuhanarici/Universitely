import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { calismalariGetir, calismaEkle, calismaSil, type CalismaKaydiDetayli } from "../../lib/calismaQueries";
import { Card, Btn, Input, Label, FormGroup, AnimatedNumber, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";

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
  const { toast, show } = useToast();
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
      show("25 dakika tamamlandı! Çalışma kaydedildi. 🎉");
    } catch {
      show("Pomodoro kaydı eklenemedi.");
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

  async function handleManuelEkle(e: React.FormEvent) {
    e.preventDefault();
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
    show("Çalışma kaydedildi ✓");
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

  const toplamHafta = useMemo(() => haftalikVeri.reduce((a, d) => a + d.sure, 0), [haftalikVeri]);
  const toplamSoru = useMemo(() => haftalikVeri.reduce((a, d) => a + d.soru, 0), [haftalikVeri]);

  const DAIRE_YARI = 56;
  const DAIRE_CEVRE = 2 * Math.PI * DAIRE_YARI;
  const ilerleme = kalanMs / (POMODORO_DK * 60 * 1000);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Çalışma</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Pomodoro zamanlayıcı ve çalışma geçmişi</p>
      </div>

      <div className="grid-2">
        <Card className="tape-accent" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "28px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,27,45,0.4)" }}>Pomodoro Zamanlayıcı</p>
          <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={70} cy={70} r={DAIRE_YARI} fill="none" stroke="rgba(15,27,45,0.08)" strokeWidth={8} />
            <circle
              cx={70} cy={70} r={DAIRE_YARI} fill="none"
              stroke={pomodoroBitti ? "#2A9D8F" : "#E4BB60"} strokeWidth={8}
              strokeDasharray={DAIRE_CEVRE}
              strokeDashoffset={DAIRE_CEVRE * (1 - ilerleme)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.9s linear" }}
            />
            <text x={70} y={74} textAnchor="middle" dominantBaseline="middle"
              style={{ fill: "#0F1B2D", fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, transform: "rotate(90deg)", transformOrigin: "70px 70px" }}>
              {formatSaniye(kalanMs)}
            </text>
          </svg>
          <p style={{ fontSize: 12, fontWeight: 600, color: calisiyor ? "#2A9D8F" : pomodoroBitti ? "#2A9D8F" : "rgba(15,27,45,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {pomodoroBitti ? "✓ Tamamlandı" : calisiyor ? "Çalışılıyor…" : kaydediliyor ? "Kaydediliyor…" : "Hazır"}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="primary" onClick={calisiyor ? duraklat : baslat}>
              {calisiyor ? "Duraklat" : pomodoroBitti ? "Tekrar Başlat" : "Başlat"}
            </Btn>
            <Btn variant="ghost" onClick={sifirla}>Sıfırla</Btn>
          </div>
        </Card>

        <Card>
          <h3 className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>Çalışma Ekle</h3>
          <form onSubmit={handleManuelEkle} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FormGroup>
              <Label>Süre (dk) *</Label>
              <Input type="number" min={1} placeholder="45" value={sureDk} onChange={(e) => setSureDk(e.target.value)} required />
            </FormGroup>
            <FormGroup>
              <Label>Çözülen Soru Sayısı</Label>
              <Input type="number" min={0} placeholder="0" value={soruSayisi} onChange={(e) => setSoruSayisi(e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>Not</Label>
              <Input placeholder="Konu veya açıklama" value={notMetni} onChange={(e) => setNotMetni(e.target.value)} />
            </FormGroup>
            <Btn variant="primary" type="submit">Kaydet</Btn>
          </form>
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Son 7 Gün</h3>
          <div style={{ display: "flex", gap: 20, textAlign: "right" }}>
            <div>
              <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Toplam</p>
              <p className="metric-value" style={{ fontSize: 22, fontWeight: 700 }}>{Math.round(toplamHafta / 60)}h {toplamHafta % 60}dk</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Soru</p>
              <p className="metric-value" style={{ fontSize: 22, fontWeight: 700 }}><AnimatedNumber value={toplamSoru} /></p>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={haftalikVeri} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" />
            <XAxis dataKey="etiket" tick={{ fontSize: 11, fill: "rgba(15,27,45,0.4)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#0F1B2D", border: "none", borderRadius: 8, color: "#F4EFE4", fontSize: 12 }} formatter={(v) => [`${v} dk`]} />
            <Bar dataKey="sure" fill="#E4BB60" radius={[3, 3, 0, 0]} animationDuration={700} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Kayıtlar</h3>
        {kayitlar.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)", fontStyle: "italic", marginTop: 12 }}>Henüz çalışma kaydı yok.</p>
        ) : (
          <table className="data-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Tarih</th><th>Süre</th><th>Soru</th><th>Not</th><th></th>
              </tr>
            </thead>
            <tbody>
              {kayitlar.map((k) => (
                <tr key={k.id}>
                  <td style={{ fontSize: 12, color: "rgba(15,27,45,0.5)" }}>{k.tarih}</td>
                  <td className="tabular" style={{ fontWeight: 600 }}>{k.sure_dk} dk</td>
                  <td className="tabular">{k.soru_sayisi ?? "—"}</td>
                  <td style={{ color: "rgba(15,27,45,0.6)", fontSize: 12 }}>{k.not ?? "—"}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleSil(k.id)}>
                      <Icon name="trash" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
