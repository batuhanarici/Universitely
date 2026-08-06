import { useEffect, useState } from "react";
import type { Ders, Konu } from "../../types/database";
import { dersleriGetir, dersEkle, konulariGetir, konuEkle } from "../../lib/queries";
import { Card, Input, Btn, useToast } from "../../components/ui";

export default function DersKonuYonetimi() {
  const { toast, show } = useToast();
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
    show("Ders eklendi ✓");
  }

  async function handleKonuEkle() {
    if (!yeniKonuAdi.trim() || !seciliDersId) return;
    const yeni = await konuEkle(seciliDersId, yeniKonuAdi.trim());
    setKonular((k) => [...k, yeni].sort((a, b) => a.ad.localeCompare(b.ad)));
    setYeniKonuAdi("");
    show("Konu eklendi ✓");
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Ders / Konu Yönetimi</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Ders ekleyin ve konuları düzenleyin</p>
      </div>

      <div className="grid-2">
        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Dersler</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleDersEkle(); }} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Input placeholder="Yeni ders adı" value={yeniDersAdi} onChange={(e) => setYeniDersAdi(e.target.value)} />
            <Btn variant="primary" type="submit" size="sm">Ekle</Btn>
          </form>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {dersler.map((d) => {
              const secili = d.id === seciliDersId;
              return (
                <button
                  key={d.id}
                  onClick={() => setSeciliDersId(d.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: secili ? "1.5px solid #E4BB60" : "1.5px solid rgba(15,27,45,0.15)",
                    background: secili ? "rgba(228,187,96,0.12)" : "transparent",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: secili ? "#A07C20" : "#0F1B2D",
                    cursor: "pointer",
                  }}
                >
                  {d.ad}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>
            {dersler.find((d) => d.id === seciliDersId)?.ad ?? "Ders"} Konuları
          </h3>
          <form onSubmit={(e) => { e.preventDefault(); handleKonuEkle(); }} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Input placeholder="Yeni konu adı" value={yeniKonuAdi} onChange={(e) => setYeniKonuAdi(e.target.value)} />
            <Btn variant="primary" type="submit" size="sm">Ekle</Btn>
          </form>
          <div className="rule-lines" style={{ borderRadius: 8, overflow: "hidden" }}>
            {konular.length === 0 ? (
              <p style={{ padding: "10px 12px", fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Konu yok. Ekleyin.</p>
            ) : konular.map((k) => (
              <div key={k.id} style={{ padding: "9px 12px", fontSize: 13, color: "#0F1B2D" }}>{k.ad}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
