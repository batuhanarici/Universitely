import { useEffect, useState } from "react";
import type { Ders, Konu } from "../../types/database";
import { dersleriGetir, dersEkle, konulariGetir, konuEkle } from "../../lib/queries";
import { Card, Input, Btn } from "../../components/ui";

export default function DersKonuYonetimi() {
  const [dersler, setDersler] = useState<Ders[]>([]);
  const [seciliDersId, setSeciliDersId] = useState<string>("");
  const [konular, setKonular] = useState<Konu[]>([]);
  const [yeniDersAdi, setYeniDersAdi] = useState("");
  const [yeniKonuAdi, setYeniKonuAdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    dersleriGetir()
      .then((d) => {
        setDersler(d);
        if (d.length > 0) setSeciliDersId(d[0].id);
      })
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    if (!seciliDersId) { setKonular([]); return; }
    konulariGetir(seciliDersId).then(setKonular);
  }, [seciliDersId]);

  async function handleDersEkle() {
    if (!yeniDersAdi.trim()) return;
    const yeni = await dersEkle(yeniDersAdi.trim());
    setDersler((d) => [...d, yeni].sort((a, b) => a.ad.localeCompare(b.ad)));
    setYeniDersAdi("");
    setSeciliDersId(yeni.id);
  }

  async function handleKonuEkle() {
    if (!yeniKonuAdi.trim() || !seciliDersId) return;
    const yeni = await konuEkle(seciliDersId, yeniKonuAdi.trim());
    setKonular((k) => [...k, yeni].sort((a, b) => a.ad.localeCompare(b.ad)));
    setYeniKonuAdi("");
  }

  if (yukleniyor) return <p>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Ders / Konu Yönetimi</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Ders ekleyin ve konuları düzenleyin</p>
      </div>

      <Card className="tape-accent">
        <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Dersler</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Input
            value={yeniDersAdi}
            onChange={(e) => setYeniDersAdi(e.target.value)}
            placeholder="örn. Matematik"
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && handleDersEkle()}
          />
          <Btn onClick={handleDersEkle}>Ekle</Btn>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {dersler.map((d) => (
            <Btn
              key={d.id}
              size="sm"
              variant={d.id === seciliDersId ? "primary" : "ghost"}
              onClick={() => setSeciliDersId(d.id)}
            >
              {d.ad}
            </Btn>
          ))}
        </div>
      </Card>

      {seciliDersId && (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Konular — {dersler.find((d) => d.id === seciliDersId)?.ad}</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <Input
              value={yeniKonuAdi}
              onChange={(e) => setYeniKonuAdi(e.target.value)}
              placeholder="örn. Türev"
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === "Enter" && handleKonuEkle()}
            />
            <Btn onClick={handleKonuEkle}>Ekle</Btn>
          </div>
          <div>
            {konular.map((k) => (
              <div key={k.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(15,27,45,0.06)", fontSize: 13.5 }}>
                {k.ad}
              </div>
            ))}
            {konular.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)" }}>Henüz konu eklenmedi.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
