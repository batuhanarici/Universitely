import { useEffect, useMemo, useState } from "react";
import { ogrencileriGetir } from "../../lib/sonucQueries";
import { kocVelileriniGetir } from "../../lib/kocAraclariQueries";
import { mesajGonder } from "../../lib/mesajQueries";
import type { Ogrenci, VeliAlici } from "../../types/database";
import { Card, Textarea, Btn, Checkbox, Badge } from "../../components/ui";

interface Secim {
  ogrenciler: Set<string>;
  veliler: Set<string>;
}

export default function TopluBildirim() {
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [veliler, setVeliler] = useState<VeliAlici[]>([]);
  const [secim, setSecim] = useState<Secim>({ ogrenciler: new Set(), veliler: new Set() });
  const [mesaj, setMesaj] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [sonuc, setSonuc] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([ogrencileriGetir(), kocVelileriniGetir()])
      .then(([o, v]) => {
        setOgrenciler(o);
        setVeliler(v);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const secilenSayi = useMemo(
    () => secim.ogrenciler.size + secim.veliler.size,
    [secim]
  );

  function toggleOgrenci(id: string) {
    setSecim((s) => {
      const yeni = new Set(s.ogrenciler);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return { ...s, ogrenciler: yeni };
    });
  }

  function toggleVeli(id: string) {
    setSecim((s) => {
      const yeni = new Set(s.veliler);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return { ...s, veliler: yeni };
    });
  }

  function tumOgrenciler() {
    setSecim((s) => ({
      ...s,
      ogrenciler: s.ogrenciler.size === ogrenciler.length ? new Set() : new Set(ogrenciler.map((o) => o.id)),
    }));
  }

  function tumVeliler() {
    setSecim((s) => ({
      ...s,
      veliler: s.veliler.size === veliler.length ? new Set() : new Set(veliler.map((v) => v.id)),
    }));
  }

  async function handleGonder() {
    const metin = mesaj.trim();
    if (!metin || secilenSayi === 0) return;
    setGonderiliyor(true);
    setSonuc(null);
    setHata(null);
    try {
      const alicilar = [...secim.ogrenciler, ...secim.veliler];
      let basarili = 0;
      for (const aliciId of alicilar) {
        try {
          await mesajGonder(aliciId, metin);
          basarili++;
        } catch {}
      }
      setSonuc(`${basarili}/${alicilar.length} alıcıya gönderildi.`);
      setMesaj("");
      setSecim({ ogrenciler: new Set(), veliler: new Set() });
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 className="page-title">Toplu Bildirim</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrencilere ve velilere toplu mesaj gönderin</p>
      </div>

      <Card className="tape-accent">
        <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Alıcılar</h3>
        {ogrenciler.length === 0 && veliler.length === 0 ? (
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz öğrenci veya velin yok.</p>
        ) : (
          <>
            {ogrenciler.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <p className="mono" style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)" }}>Öğrenciler ({ogrenciler.length})</p>
                  <button onClick={tumOgrenciler} style={{ border: "none", background: "none", fontSize: 11.5, cursor: "pointer", textDecoration: "underline" }}>
                    {secim.ogrenciler.size === ogrenciler.length ? "Temizle" : "Tümünü Seç"}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 12 }}>
                  {ogrenciler.map((o) => (
                    <label key={o.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer", padding: "3px 0" }}>
                      <Checkbox checked={secim.ogrenciler.has(o.id)} onChange={() => toggleOgrenci(o.id)} />
                      {o.ad_soyad}
                    </label>
                  ))}
                </div>
              </>
            )}
            {veliler.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <p className="mono" style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)" }}>Veliler ({veliler.length})</p>
                  <button onClick={tumVeliler} style={{ border: "none", background: "none", fontSize: 11.5, cursor: "pointer", textDecoration: "underline" }}>
                    {secim.veliler.size === veliler.length ? "Temizle" : "Tümünü Seç"}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {veliler.map((v) => (
                    <label key={v.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer", padding: "3px 0" }}>
                      <Checkbox checked={secim.veliler.has(v.id)} onChange={() => toggleVeli(v.id)} />
                      {v.ad_soyad} <span className="tabular" style={{ fontSize: 10.5, color: "rgba(15,27,45,0.5)" }}>({v.ogrenci_adi})</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </Card>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 10, fontSize: 16 }}>Mesaj</h3>
        <Textarea
          style={{ width: "100%" }}
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          placeholder="Tüm seçilenlere gönderilecek mesaj…"
        />
        <Btn
          onClick={handleGonder}
          disabled={gonderiliyor || !mesaj.trim() || secilenSayi === 0}
          style={{ marginTop: 10, width: "100%" }}
        >
          {gonderiliyor ? "Gönderiliyor…" : `${secilenSayi > 0 ? `${secilenSayi} alıcıya ` : ""}Gönder`}
        </Btn>
        {sonuc && <Badge variant="teal" >{sonuc}</Badge>}
        {hata && <Badge variant="brick" >{hata}</Badge>}
      </Card>
    </div>
  );
}
