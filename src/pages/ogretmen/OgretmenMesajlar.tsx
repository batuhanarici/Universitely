import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { mesajlariGetir, mesajGonder, mesajOkunduIsaretle } from "../../lib/mesajQueries";
import { ogrencileriGetir } from "../../lib/sonucQueries";
import { kocVelileriniGetir } from "../../lib/kocAraclariQueries";
import type { Mesaj, Ogrenci, VeliAlici } from "../../types/database";
import { Card, Select, Input, Btn } from "../../components/ui";

interface Alici {
  id: string;
  ad: string;
  tur: "ogrenci" | "veli";
}

export default function OgretmenMesajlar() {
  const { session } = useAuth();
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [aliciListesi, setAliciListesi] = useState<Alici[]>([]);
  const [aliciId, setAliciId] = useState("");
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const altRef = useRef<HTMLDivElement>(null);

  const ben = session?.user.id;

  useEffect(() => {
    Promise.all([mesajlariGetir(), ogrencileriGetir(), kocVelileriniGetir()])
      .then(([m, o, v]) => {
        setMesajlar(m);
        const alicilar: Alici[] = [
          ...o.map((s: Ogrenci) => ({ id: s.id, ad: s.ad_soyad, tur: "ogrenci" as const })),
          ...v.map((v: VeliAlici) => ({ id: v.id, ad: `${v.ad_soyad} (${v.ogrenci_adi})`, tur: "veli" as const })),
        ];
        setAliciListesi(alicilar);
        if (alicilar.length > 0) setAliciId(alicilar[0].id);
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

  const adMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of aliciListesi) map.set(a.id, a.ad);
    return map;
  }, [aliciListesi]);

  function gondericiAdi(id: string): string {
    if (id === ben) return "Sen";
    return adMap.get(id) ?? "Kullanıcı";
  }

  async function handleGonder() {
    if (!aliciId || !girdi.trim()) return;
    setGonderiliyor(true);
    try {
      const yeni = await mesajGonder(aliciId, girdi.trim());
      setMesajlar((m) => [...m, yeni]);
      setGirdi("");
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) return <p>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Mesajlar</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrenciler ve velilerle yazışın</p>
      </div>

      <Card className="tape-accent">
        <div ref={altRef} style={{ height: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "4px 2px" }}>
          {mesajlar.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz mesaj yok.</p>}
          {mesajlar.map((m) => {
            const benimki = m.gonderici_id === ben;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: benimki ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "78%", padding: "8px 12px", borderRadius: 12,
                  background: benimki ? "#0F1B2D" : "#EFE9DC",
                  color: benimki ? "#E4BB60" : "#0F1B2D",
                  fontSize: 13.5, lineHeight: 1.5,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: benimki ? "rgba(255,255,255,0.5)" : "rgba(15,27,45,0.5)", marginBottom: 3 }}>
                    {gondericiAdi(m.gonderici_id)}
                  </p>
                  <p>{m.icerik}</p>
                  <p style={{ fontSize: 10, color: benimki ? "rgba(255,255,255,0.4)" : "rgba(15,27,45,0.5)", marginTop: 4 }}>
                    {new Date(m.tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Select style={{ width: 220 }} value={aliciId} onChange={(e) => setAliciId(e.target.value)}>
            {aliciListesi.map((a) => (
              <option key={a.id} value={a.id}>{a.tur === "veli" ? "👪 " : "🎓 "}{a.ad}</option>
            ))}
          </Select>
          <Input style={{ flex: 1, minWidth: 180 }} value={girdi} onChange={(e) => setGirdi(e.target.value)} placeholder="Mesajını yaz…" onKeyDown={(e) => e.key === "Enter" && handleGonder()} />
          <Btn onClick={handleGonder} disabled={gonderiliyor || !girdi.trim() || !aliciId}>Gönder</Btn>
        </div>
      </Card>
    </div>
  );
}
