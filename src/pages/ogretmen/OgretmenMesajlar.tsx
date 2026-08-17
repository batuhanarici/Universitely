import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../lib/authContext";
import { mesajlariGetir, mesajGonder, mesajOkunduIsaretle } from "../../lib/mesajQueries";
import { ogrencileriGetir } from "../../lib/sonucQueries";
import { kocVelileriniGetir } from "../../lib/kocAraclariQueries";
import type { Mesaj, Ogrenci, VeliAlici } from "../../types/database";
import { Card, Select, Input, Btn, Label, FormGroup } from "../../components/ui";
import { TUR_ETIKET, TUR_RENK } from "../../lib/bildirimUi";

interface Alici {
  id: string;
  ad: string;
  tur: "ogrenci" | "veli";
}

type AliciTipi = "ogrenci" | "veli";

export default function OgretmenMesajlar() {
  const { session } = useAuth();
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [aliciListesi, setAliciListesi] = useState<Alici[]>([]);
  const [aliciTipi, setAliciTipi] = useState<AliciTipi>("ogrenci");
  const [aliciId, setAliciId] = useState("");
  const [girdi, setGirdi] = useState("");
  const [tur, setTur] = useState("normal");
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
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    const bekleyen = mesajlar.filter((m) => m.alici_id === ben && !m.okundu);
    for (const m of bekleyen) {
      mesajOkunduIsaretle(m.id).catch(() => {});
    }
  }, [mesajlar, ben]);

  const filtrelenenler = useMemo(() => aliciListesi.filter((a) => a.tur === aliciTipi), [aliciListesi, aliciTipi]);

  useEffect(() => {
    if (filtrelenenler.length > 0) setAliciId(filtrelenenler[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aliciTipi]);

  const alici = useMemo(() => aliciListesi.find((a) => a.id === aliciId), [aliciListesi, aliciId]);

  const konusma = useMemo(
    () => mesajlar.filter((m) => m.gonderici_id === aliciId || m.alici_id === aliciId),
    [mesajlar, aliciId]
  );

  useEffect(() => {
    if (altRef.current) altRef.current.scrollTop = altRef.current.scrollHeight;
  }, [konusma, aliciId]);

  async function handleGonder(e: React.FormEvent) {
    e.preventDefault();
    if (!aliciId || !girdi.trim()) return;
    setGonderiliyor(true);
    try {
      const yeni = await mesajGonder(aliciId, girdi.trim(), tur);
      setMesajlar((m) => [...m, yeni]);
      setGirdi("");
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  if (aliciListesi.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 className="page-title">Mesajlar</h1>
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz mesajlaşabileceğin öğrenci veya veli yok.</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Mesajlar</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrenciler ve velilerle yazışın</p>
      </div>

      <Card style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <FormGroup>
            <Label>Alıcı Tipi</Label>
            <Select value={aliciTipi} onChange={(e) => setAliciTipi(e.target.value as AliciTipi)} style={{ maxWidth: 160 }}>
              <option value="ogrenci">🎓 Öğrenci</option>
              <option value="veli">👪 Veli</option>
            </Select>
          </FormGroup>
          <FormGroup style={{ flex: 1 }}>
            <Label>Kişi</Label>
            <Select value={aliciId} onChange={(e) => setAliciId(e.target.value)} style={{ maxWidth: 220 }}>
              {filtrelenenler.map((a) => (
                <option key={a.id} value={a.id}>{a.ad}</option>
              ))}
            </Select>
          </FormGroup>
        </div>
      </Card>

      <Card style={{ display: "flex", flexDirection: "column", height: 460 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(15,27,45,0.08)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#2A9D8F", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
            {alici?.ad[0] ?? "?"}
          </div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>{alici?.ad}</p>
        </div>

        <div ref={altRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {konusma.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz mesaj yok.</p>}
          {konusma.map((m) => {
            const benimki = m.gonderici_id === ben;
            const etiketli = m.tur !== "normal";
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: benimki ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}>
                <div>
                  {etiketli && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: TUR_RENK[m.tur as keyof typeof TUR_RENK] ?? "#0F1B2D", display: "block", marginBottom: 2, textAlign: benimki ? "right" : "left" }}>
                      {TUR_ETIKET[m.tur as keyof typeof TUR_ETIKET] ?? m.tur}
                    </span>
                  )}
                  <div className={benimki ? "bubble-self" : "bubble-other"}>{m.icerik}</div>
                  <p style={{ fontSize: 10, color: "rgba(15,27,45,0.35)", marginTop: 2, textAlign: benimki ? "right" : "left" }}>
                    {new Date(m.tarih).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleGonder} style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(15,27,45,0.08)" }}>
          <Select value={tur} onChange={(e) => setTur(e.target.value)} style={{ maxWidth: 130, flexShrink: 0 }} title="Mesaj türü">
            <option value="normal">Normal</option>
            <option value="hatirlatma">Hatırlatma</option>
            <option value="uyari">Uyarı</option>
            <option value="toplu">Toplu</option>
          </Select>
          <Input
            placeholder="Mesaj yaz…"
            value={girdi}
            onChange={(e) => setGirdi(e.target.value)}
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (girdi.trim()) handleGonder(e as unknown as React.FormEvent);
              }
            }}
          />
          <Btn variant="primary" type="submit" disabled={gonderiliyor || !girdi.trim()}>Gönder</Btn>
        </form>
      </Card>
    </div>
  );
}
