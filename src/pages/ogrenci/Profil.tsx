import { useEffect, useState } from "react";
import { profiliGetir, profiliKaydet } from "../../lib/profilQueries";
import type { OgrenciProfili, SinavTuru } from "../../types/database";

const SINAV_SECENEKLERI: { deger: SinavTuru; etiket: string }[] = [
  { deger: "tyt", etiket: "TYT" },
  { deger: "ayt", etiket: "AYT" },
  { deger: "her_ikisi", etiket: "TYT + AYT" },
];

export default function Profil() {
  const [profil, setProfil] = useState<OgrenciProfili | null>(null);
  const [hedefUniversite, setHedefUniversite] = useState("");
  const [hedefBolum, setHedefBolum] = useState("");
  const [sinavTuru, setSinavTuru] = useState<SinavTuru>("tyt");
  const [hedefNet, setHedefNet] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    profiliGetir().then((p) => {
      if (p) {
        setProfil(p);
        setHedefUniversite(p.hedef_universite ?? "");
        setHedefBolum(p.hedef_bolum ?? "");
        setSinavTuru(p.sinav_turu);
        setHedefNet(p.hedef_net != null ? String(p.hedef_net) : "");
      }
    }).catch(() => {}).finally(() => setYukleniyor(false));
  }, []);

  async function handleKaydet() {
    setKaydediliyor(true);
    setMesaj("");
    try {
      await profiliKaydet({
        hedef_universite: hedefUniversite.trim() || undefined,
        hedef_bolum: hedefBolum.trim() || undefined,
        sinav_turu: sinavTuru,
        hedef_net: hedefNet.trim() === "" ? null : Number(hedefNet),
      });
      setMesaj("Profil kaydedildi.");
    } catch {
      setMesaj("Kaydederken bir hata oluştu.");
    } finally {
      setKaydediliyor(false);
    }
  }

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Profilim</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <label className="fld">Hedef Üniversite</label>
        <input className="input" value={hedefUniversite} onChange={(e) => setHedefUniversite(e.target.value)} placeholder="örn. Boğaziçi Üniversitesi" />

        <label className="fld">Hedef Bölüm</label>
        <input className="input" value={hedefBolum} onChange={(e) => setHedefBolum(e.target.value)} placeholder="örn. Bilgisayar Mühendisliği" />

        <label className="fld">Sınav Türü</label>
        <div style={{ display: "flex", gap: 6 }}>
          {SINAV_SECENEKLERI.map((s) => (
            <button
              key={s.deger}
              onClick={() => setSinavTuru(s.deger)}
              className={`chip${sinavTuru === s.deger ? " active" : ""}`}
              style={{ flex: 1 }}
            >
              {s.etiket}
            </button>
          ))}
        </div>

        <label className="fld">Hedef Net</label>
        <input className="input" value={hedefNet} onChange={(e) => setHedefNet(e.target.value)} placeholder="örn. 85.5" type="number" step="0.5" />

        <button onClick={handleKaydet} disabled={kaydediliyor} className="btn btn-primary" style={{ marginTop: 18 }}>
          {kaydediliyor ? "Kaydediliyor…" : "Profili Kaydet"}
        </button>
        {mesaj && <p style={{ marginTop: 10, color: mesaj.startsWith("Profil") ? "var(--dogru)" : "var(--yanlis)", fontSize: 13 }}>{mesaj}</p>}
      </div>

      {profil && (profil.hedef_universite || profil.hedef_bolum || profil.hedef_net != null) && (
        <div className="card stagger-item" style={{ marginTop: 16, animationDelay: "0.1s", borderLeft: "4px solid var(--gold)" }}>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>HEDEF ÖZETİ</p>
          {profil.hedef_universite && <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{profil.hedef_universite}</p>}
          {profil.hedef_bolum && <p style={{ fontSize: 13, color: "var(--muted)" }}>{profil.hedef_bolum}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <span className="chip">{profil.sinav_turu === "her_ikisi" ? "TYT + AYT" : profil.sinav_turu.toUpperCase()}</span>
            {profil.hedef_net != null && <span className="chip mono">Hedef {profil.hedef_net} net</span>}
          </div>
        </div>
      )}
    </div>
  );
}