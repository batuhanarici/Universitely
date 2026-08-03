import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { ogretmenHesapId, mesajlariGetir, mesajGonder, mesajOkunduIsaretle } from "../../lib/mesajQueries";
import type { Mesaj } from "../../types/database";

export default function Mesaj() {
  const { session } = useAuth();
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const altRef = useRef<HTMLDivElement>(null);

  const ben = session?.user.id;

  useEffect(() => {
    mesajlariGetir().then(setMesajlar).catch(() => {}).finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    const bekleyen = mesajlar.filter((m) => m.alici_id === ben && !m.okundu);
    for (const m of bekleyen) {
      mesajOkunduIsaretle(m.id).catch(() => {});
    }
    if (altRef.current) altRef.current.scrollTop = altRef.current.scrollHeight;
  }, [mesajlar, ben]);

  async function handleGonder() {
    if (!girdi.trim()) return;
    setGonderiliyor(true);
    try {
      const aliciId = await ogretmenHesapId();
      if (!aliciId) return;
      const yeni = await mesajGonder(aliciId, girdi.trim());
      setMesajlar((m) => [...m, yeni]);
      setGirdi("");
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Koç'a Mesaj</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <div ref={altRef} style={{ height: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "4px 2px" }}>
          {mesajlar.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz mesaj yok. Koçuna bir şey sormak için aşağıdan yazabilirsin.</p>}
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
                  <p>{m.icerik}</p>
                  <p style={{ fontSize: 10, color: benimki ? "rgba(255,255,255,0.4)" : "var(--muted)", marginTop: 4 }}>
                    {benimki ? "Sen" : "Koç"} · {new Date(m.tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input className="input" style={{ flex: 1 }} value={girdi} onChange={(e) => setGirdi(e.target.value)} placeholder="Mesajını yaz…" onKeyDown={(e) => e.key === "Enter" && handleGonder()} />
          <button onClick={handleGonder} disabled={gonderiliyor || !girdi.trim()} className="btn btn-primary">Gönder</button>
        </div>
      </div>
    </div>
  );
}