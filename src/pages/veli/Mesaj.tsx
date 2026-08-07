import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { mesajOkunduIsaretle, mesajGonder } from "../../lib/mesajQueries";
import { Card, Btn, Input, Select } from "../../components/ui";
import { useVeliVeri } from "./VeliVeri";
import { TUR_ETIKET, TUR_RENK } from "../../lib/bildirimUi";

function zamanla(tarih: string): string {
  return new Date(tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Mesaj() {
  const { session } = useAuth();
  const { yukleniyor, mesajlar, setMesajlar, kocId, veri } = useVeliVeri();
  const [girdi, setGirdi] = useState("");
  const [tur, setTur] = useState("normal");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const altRef = useRef<HTMLDivElement>(null);

  const ben = session?.user.id;

  useEffect(() => {
    const bekleyen = mesajlar.filter((m) => m.alici_id === ben && !m.okundu);
    for (const m of bekleyen) mesajOkunduIsaretle(m.id).catch(() => {});
    if (altRef.current) altRef.current.scrollTop = altRef.current.scrollHeight;
  }, [mesajlar, ben]);

  async function handleGonder() {
    if (!kocId || !girdi.trim()) return;
    setGonderiliyor(true);
    try {
      const yeni = await mesajGonder(kocId, girdi.trim(), tur);
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
        <h1 className="page-title">Koça Mesaj</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Koçla birebir iletişim</p>
      </div>

      <Card style={{ display: "flex", flexDirection: "column", height: 500, padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid rgba(15,27,45,0.08)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0F1B2D", display: "flex", alignItems: "center", justifyContent: "center", color: "#E4BB60", fontWeight: 700, flexShrink: 0 }}>K</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600 }}>Koçun</p>
            <p style={{ fontSize: 11, color: "rgba(15,27,45,0.4)" }}>{veri.cocuk_adi} çocuğunun koçu</p>
          </div>
        </div>

        <div ref={altRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {mesajlar.length === 0 && (
            <p style={{ color: "rgba(15,27,45,0.45)", fontSize: 13, textAlign: "center", marginTop: 24 }}>
              Henüz mesaj yok. Koça bir şey sormak için aşağıdan yazabilirsin.
            </p>
          )}
          {mesajlar.map((m) => {
            const benimki = m.gonderici_id === ben;
            const etiketli = m.tur !== "normal";
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: benimki ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}>
                {!benimki && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0F1B2D", display: "flex", alignItems: "center", justifyContent: "center", color: "#E4BB60", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>K</div>
                )}
                <div>
                  {etiketli && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: TUR_RENK[m.tur as keyof typeof TUR_RENK] ?? "#0F1B2D", display: "block", marginBottom: 2, textAlign: benimki ? "right" : "left" }}>
                      {TUR_ETIKET[m.tur as keyof typeof TUR_ETIKET] ?? m.tur}
                    </span>
                  )}
                  <div className={benimki ? "bubble-self" : "bubble-other"}>{m.icerik}</div>
                  <p style={{ fontSize: 10, color: "rgba(15,27,45,0.35)", marginTop: 2, textAlign: benimki ? "right" : "left" }}>{zamanla(m.tarih)}</p>
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
            placeholder="Mesaj yaz…"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleGonder()}
          />
          <Btn onClick={handleGonder} disabled={gonderiliyor || !girdi.trim() || !kocId}>Gönder</Btn>
        </div>
      </Card>
    </div>
  );
}
