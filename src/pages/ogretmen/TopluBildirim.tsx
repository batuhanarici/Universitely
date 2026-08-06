import { useEffect, useMemo, useState } from "react";
import { ogrencileriGetir } from "../../lib/sonucQueries";
import { kocVelileriniGetir } from "../../lib/kocAraclariQueries";
import { mesajGonder } from "../../lib/mesajQueries";
import type { Ogrenci, VeliAlici } from "../../types/database";
import { Card, Textarea, Btn, Checkbox, useToast } from "../../components/ui";

interface Secim {
  ogrenciler: Set<string>;
  veliler: Set<string>;
}

export default function TopluBildirim() {
  const { toast, show } = useToast();
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [veliler, setVeliler] = useState<VeliAlici[]>([]);
  const [secim, setSecim] = useState<Secim>({ ogrenciler: new Set(), veliler: new Set() });
  const [mesaj, setMesaj] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
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

  const secilenSayi = useMemo(() => secim.ogrenciler.size + secim.veliler.size, [secim]);

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

  function selectAllOgrenciler() {
    setSecim((s) => ({ ...s, ogrenciler: new Set(ogrenciler.map((o) => o.id)) }));
  }

  function clearOgrenciler() {
    setSecim((s) => ({ ...s, ogrenciler: new Set() }));
  }

  function selectAllVeliler() {
    setSecim((s) => ({ ...s, veliler: new Set(veliler.map((v) => v.id)) }));
  }

  function clearVeliler() {
    setSecim((s) => ({ ...s, veliler: new Set() }));
  }

  async function handleGonder() {
    const metin = mesaj.trim();
    if (!metin || secilenSayi === 0) return;
    setGonderiliyor(true);
    try {
      const alicilar = [...secim.ogrenciler, ...secim.veliler];
      let basarili = 0;
      for (const aliciId of alicilar) {
        try {
          await mesajGonder(aliciId, metin);
          basarili++;
        } catch {}
      }
      show(`${basarili}/${alicilar.length} alıcıya gönderildi ✓`);
      setMesaj("");
      setSecim({ ogrenciler: new Set(), veliler: new Set() });
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Toplu Bildirim</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrencilere ve velilere toplu mesaj gönderin</p>
      </div>

      {ogrenciler.length === 0 && veliler.length === 0 ? (
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz öğrenci veya velin yok.</p>
        </Card>
      ) : (
        <div className="grid-2">
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Öğrenciler</h3>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn variant="ghost" size="sm" onClick={selectAllOgrenciler}>Tümünü Seç</Btn>
                <Btn variant="ghost" size="sm" onClick={clearOgrenciler}>Temizle</Btn>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ogrenciler.map((o) => (
                <label key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <Checkbox checked={secim.ogrenciler.has(o.id)} onChange={() => toggleOgrenci(o.id)} />
                  <span style={{ fontSize: 13 }}>{o.ad_soyad}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Veliler</h3>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn variant="ghost" size="sm" onClick={selectAllVeliler}>Tümünü Seç</Btn>
                <Btn variant="ghost" size="sm" onClick={clearVeliler}>Temizle</Btn>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {veliler.length === 0 && <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Bağlı veli yok.</p>}
              {veliler.map((v) => (
                <label key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <Checkbox checked={secim.veliler.has(v.id)} onChange={() => toggleVeli(v.id)} />
                  <span style={{ fontSize: 13 }}>{v.ad_soyad} velisi</span>
                </label>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Mesaj</h3>
        <Textarea placeholder="Gönderilecek mesaj…" value={mesaj} onChange={(e) => setMesaj(e.target.value)} style={{ minHeight: 100 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <Btn variant="primary" onClick={handleGonder} disabled={gonderiliyor || !mesaj.trim() || secilenSayi === 0}>
            {gonderiliyor ? "Gönderiliyor…" : `Gönder (${secilenSayi} alıcı)`}
          </Btn>
        </div>
      </Card>
    </div>
  );
}
