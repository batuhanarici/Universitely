import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { mesajlariGetir, mesajGonder, mesajOkunduIsaretle } from "../../lib/mesajQueries";
import { ogrencileriGetir } from "../../lib/sonucQueries";
import type { Mesaj, Ogrenci } from "../../types/database";

export default function OgretmenMesajlar() {
  const { session } = useAuth();
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [ogrenciId, setOgrenciId] = useState("");
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const altRef = useRef<HTMLDivElement>(null);

  const ben = session?.user.id;

  useEffect(() => {
    Promise.all([mesajlariGetir(), ogrencileriGetir()])
      .then(([m, o]) => {
        setMesajlar(m);
        setOgrenciler(o);
        if (o.length > 0) setOgrenciId(o[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    const bekleyen = mesajlar.filter((m) => m.alici_id === ben && !m.okundu);
    for (const m of bekleyen) {
      mesajOkunduIsaretle(m.id).catch(() => {});
    }
    if (altRef.current) altRef.current.scrollTop = altRef.current.scrollHeight;
  }, [mesajlar, ben]);

  const ogrenciAdi = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of ogrenciler) map.set(o.id, o.ad_soyad);
    return map;
  }, [ogrenciler]);

  function gondericiAdi(id: string): string {
    if (id === ben) return "Sen";
    return ogrenciAdi.get(id) ?? "Öğrenci";
  }

  async function handleGonder() {
    if (!ogrenciId || !girdi.trim()) return;
    setGonderiliyor(true);
    try {
      const yeni = await mesajGonder(ogrenciId, girdi.trim());
      setMesajlar((m) => [...m, yeni]);
      setGirdi("");
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) return <p>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Mesajlar</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <div ref={altRef} style={{ height: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "4px 2px" }}>
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
                    {gondericiAdi(m.gonderici_id)}
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
          <select className="input" style={{ width: 160 }} value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)}>
            {ogrenciler.map((o) => <option key={o.id} value={o.id}>{o.ad_soyad}</option>)}
          </select>
          <input className="input" style={{ flex: 1 }} value={girdi} onChange={(e) => setGirdi(e.target.value)} placeholder="Mesajını yaz…" onKeyDown={(e) => e.key === "Enter" && handleGonder()} />
          <button onClick={handleGonder} disabled={gonderiliyor || !girdi.trim()} className="btn btn-primary">Gönder</button>
        </div>
      </div>
    </div>
  );
}