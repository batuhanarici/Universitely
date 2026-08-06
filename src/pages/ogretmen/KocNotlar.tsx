import { useEffect, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import { kocNotlariniGetir, kocNotEkle, kocNotSil } from "../../lib/kocAraclariQueries";
import type { KocNot } from "../../types/database";
import { Card, Select, Textarea, Btn, Badge } from "../../components/ui";

const ONEM_ETIKET: Record<string, string> = { dusuk: "düşük", normal: "normal", yuksek: "yüksek" };

const ONEM_VAZIAN: Record<string, "gray" | "gold" | "brick"> = { dusuk: "gray", normal: "gold", yuksek: "brick" };

export default function KocNotlar() {
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [ogrenciId, setOgrenciId] = useState("");
  const [notlar, setNotlar] = useState<KocNot[]>([]);
  const [metin, setMetin] = useState("");
  const [onem, setOnem] = useState("normal");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    kocOgrencileri()
      .then((o) => {
        setOgrenciler(o);
        if (o.length > 0) setOgrenciId(o[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    if (!ogrenciId) {
      setNotlar([]);
      return;
    }
    kocNotlariniGetir(ogrenciId).then(setNotlar).catch(() => {});
  }, [ogrenciId]);

  async function handleEkle() {
    if (!ogrenciId || !metin.trim()) return;
    setKaydediliyor(true);
    try {
      const yeni = await kocNotEkle(ogrenciId, metin.trim(), onem);
      setNotlar((n) => [yeni, ...n]);
      setMetin("");
      setOnem("normal");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function handleSil(id: string) {
    setNotlar((n) => n.filter((x) => x.id !== id));
    await kocNotSil(id);
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Koç Notları</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrenciler hakkında özel notlar tutun</p>
      </div>

      {ogrenciler.length === 0 ? (
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz öğrencin yok.</p>
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Öğrenci</h3>
            <Select style={{ width: "100%" }} value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)}>
              {ogrenciler.map((o) => (
                <option key={o.id} value={o.id}>{o.ad_soyad}</option>
              ))}
            </Select>
          </Card>

          <Card className="tape-accent">
            <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Not Ekle</h3>
            <Textarea
              style={{ width: "100%" }}
              value={metin}
              onChange={(e) => setMetin(e.target.value)}
              placeholder="Bu öğrenci hakkında notun…"
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Select style={{ width: 140 }} value={onem} onChange={(e) => setOnem(e.target.value)}>
                {Object.entries(ONEM_ETIKET).map(([d, et]) => (
                  <option key={d} value={d}>{et}</option>
                ))}
              </Select>
              <Btn onClick={handleEkle} disabled={kaydediliyor || !metin.trim()} style={{ flex: 1 }}>
                {kaydediliyor ? "Kaydediliyor…" : "Notu Kaydet"}
              </Btn>
            </div>
          </Card>

          <Card>
            <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Notlar</h3>
            {notlar.length === 0 && <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Bu öğrenci için henüz not yok.</p>}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {notlar.map((n) => (
                <div key={n.id} style={{ padding: "11px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <Badge variant={ONEM_VAZIAN[n.onem] ?? "gray"}>{ONEM_ETIKET[n.onem] ?? n.onem}</Badge>
                        <span className="tabular" style={{ fontSize: 11, color: "rgba(15,27,45,0.5)" }}>
                          {new Date(n.created_at).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p style={{ fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{n.not_metni}</p>
                    </div>
                    <Btn variant="ghost" size="sm" onClick={() => handleSil(n.id)}>Sil</Btn>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
