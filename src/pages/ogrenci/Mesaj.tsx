import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { benimOgretmenId, mesajlariGetir, mesajGonder, mesajOkunduIsaretle } from "../../lib/mesajQueries";
import { Card, Input, Btn, Select } from "../../components/ui";
import type { Mesaj } from "../../types/database";
import { TUR_ETIKET, TUR_RENK } from "../../lib/bildirimUi";

function zamanla(tarih: string): string {
  return new Date(tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Mesaj() {
  const { session } = useAuth();
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [girdi, setGirdi] = useState("");
  const [tur, setTur] = useState("normal");
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
      const aliciId = await benimOgretmenId();
      if (!aliciId) return;
      const yeni = await mesajGonder(aliciId, girdi.trim(), tur);
      setMesajlar((m) => [...m, yeni]);
      setGirdi("");
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Mesajlar</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Koçunla birebir sohbet</p>
      </div>

      <Card style={{ display: "flex", flexDirection: "column", height: 480, padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(15,27,45,0.08)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0F1B2D", color: "#E4BB60", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>K</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0F1B2D" }}>Koçun</p>
            <p style={{ fontSize: 12, color: "#2A9D8F", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2A9D8F", display: "inline-block" }} />
              Çevrimiçi
            </p>
          </div>
        </div>

        <div ref={altRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {mesajlar.length === 0 && (
            <p style={{ color: "rgba(15,27,45,0.45)", fontSize: 13, textAlign: "center", marginTop: 24 }}>Henüz mesaj yok. Koçuna bir şey sormak için aşağıdan yazabilirsin.</p>
          )}
          {mesajlar.map((m) => {
            const benimki = m.gonderici_id === ben;
            const etiketli = m.tur !== "normal";
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, justifyContent: benimki ? "flex-end" : "flex-start" }}>
                {!benimki && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0F1B2D", color: "#E4BB60", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0, marginTop: 8 }}>K</div>
                )}
                <div style={{ display: "flex", flexDirection: "column", alignItems: benimki ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                  {etiketli && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: TUR_RENK[m.tur as keyof typeof TUR_RENK] ?? "#0F1B2D", marginBottom: 3 }}>
                      {TUR_ETIKET[m.tur as keyof typeof TUR_ETIKET] ?? m.tur}
                    </span>
                  )}
                  <div className={benimki ? "bubble-self" : "bubble-other"}>{m.icerik}</div>
                  <span style={{ fontSize: 10, color: "rgba(15,27,45,0.4)", marginTop: 4 }}>{zamanla(m.tarih)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, padding: "14px 20px", borderTop: "1px solid rgba(15,27,45,0.08)" }}>
          <Select value={tur} onChange={(e) => setTur(e.target.value)} style={{ maxWidth: 130, flexShrink: 0 }} title="Mesaj türü">
            <option value="normal">Normal</option>
            <option value="hatirlatma">Hatırlatma</option>
            <option value="uyari">Uyarı</option>
          </Select>
          <Input
            value={girdi}
            onChange={(e) => setGirdi(e.target.value)}
            placeholder="Mesajını yaz…"
            onKeyDown={(e) => e.key === "Enter" && handleGonder()}
          />
          <Btn onClick={handleGonder} disabled={gonderiliyor || !girdi.trim()}>Gönder</Btn>
        </div>
      </Card>
    </div>
  );
}
