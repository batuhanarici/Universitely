import { useToast } from "../../components/useToast";
import { useEffect, useState } from "react";
import {
  ogrenciHedefiEkle,
  ogrenciHedefiSil,
  ogrenciHedefleriniGetir,
  programlariGetir,
  universiteleriGetir,
  type ProgramKatalogKaydi,
  type UniversiteKatalogKaydi,
} from "../../lib/universiteQueries";
import type { OgrenciHedefi } from "../../types/database";
import { Badge, Btn, Card, FormGroup, Label, Select } from "../../components/ui";

export default function Hedefler() {
  const { toast, show } = useToast();
  const [tur, setTur] = useState<"lisans" | "onlisans">("lisans");
  const [universiteler, setUniversiteler] = useState<UniversiteKatalogKaydi[]>([]);
  const [programlar, setProgramlar] = useState<ProgramKatalogKaydi[]>([]);
  const [hedefler, setHedefler] = useState<OgrenciHedefi[]>([]);
  const [universiteKodu, setUniversiteKodu] = useState("");
  const [programKodu, setProgramKodu] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [programlarYukleniyor, setProgramlarYukleniyor] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");

  useEffect(() => {
    let aktif = true;
    setYukleniyor(true);
    setHata("");
    Promise.all([universiteleriGetir(tur), ogrenciHedefleriniGetir()])
      .then(([uni, kayitlar]) => {
        if (!aktif) return;
        setUniversiteler(uni);
        setHedefler(kayitlar);
        setUniversiteKodu("");
        setProgramlar([]);
        setProgramKodu("");
      })
      .catch(() => { if (aktif) setHata("Üniversite kataloğu şu anda alınamadı. Lütfen biraz sonra tekrar dene."); })
      .finally(() => { if (aktif) setYukleniyor(false); });
    return () => { aktif = false; };
  }, [tur]);

  useEffect(() => {
    if (!universiteKodu) {
      setProgramlar([]);
      setProgramKodu("");
      return;
    }
    let aktif = true;
    setProgramlarYukleniyor(true);
    setHata("");
    programlariGetir(tur, universiteKodu)
      .then((liste) => {
        if (!aktif) return;
        setProgramlar(liste);
        setProgramKodu("");
      })
      .catch(() => { if (aktif) setHata("Bu üniversitenin bölüm listesi alınamadı."); })
      .finally(() => { if (aktif) setProgramlarYukleniyor(false); });
    return () => { aktif = false; };
  }, [tur, universiteKodu]);

  async function hedefEkle(e: React.FormEvent) {
    e.preventDefault();
    const program = programlar.find((p) => p.kod === programKodu);
    const universite = universiteler.find((u) => u.kod === universiteKodu);
    if (!program || !universite) return;
    setKaydediliyor(true);
    setHata("");
    try {
      const yeni = await ogrenciHedefiEkle(program, universite.ad);
      setHedefler((mevcut) => [yeni, ...mevcut]);
      setProgramKodu("");
      show("Hedef eklendi ✓");
    } catch (error) {
      setHata(error instanceof Error && error.message.includes("duplicate") ? "Bu bölümü hedeflerine zaten ekledin." : "Hedef eklenemedi.");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function hedefSil(id: string) {
    setHedefler((mevcut) => mevcut.filter((hedef) => hedef.id !== id));
    try {
      await ogrenciHedefiSil(id);
    } catch {
      setHata("Hedef silinemedi. Lütfen tekrar dene.");
      const yeniler = await ogrenciHedefleriniGetir().catch(() => []);
      setHedefler(yeniler);
    }
  }

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Üniversite Hedeflerim</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>YÖK Atlas program kataloğundan hedef bölüm ve üniversitelerini seç.</p>
      </div>

      <Card>
        <form onSubmit={hedefEkle} style={{ display: "grid", gridTemplateColumns: "150px 1.3fr 1.7fr auto", gap: 10, alignItems: "end" }}>
          <FormGroup>
            <Label>Program türü</Label>
            <Select value={tur} onChange={(e) => setTur(e.target.value as "lisans" | "onlisans")}>
              <option value="lisans">Lisans</option>
              <option value="onlisans">Ön lisans</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Üniversite</Label>
            <Select value={universiteKodu} onChange={(e) => setUniversiteKodu(e.target.value)} disabled={yukleniyor || universiteler.length === 0}>
              <option value="">Üniversite seç</option>
              {universiteler.map((uni) => <option key={uni.kod} value={uni.kod}>{uni.ad}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Bölüm / program</Label>
            <Select value={programKodu} onChange={(e) => setProgramKodu(e.target.value)} disabled={!universiteKodu || programlarYukleniyor || programlar.length === 0}>
              <option value="">{programlarYukleniyor ? "Bölümler yükleniyor…" : "Bölüm seç"}</option>
              {programlar.map((program) => <option key={program.kod} value={program.kod}>{program.ad}</option>)}
            </Select>
          </FormGroup>
          <Btn variant="primary" type="submit" disabled={!programKodu || kaydediliyor}>{kaydediliyor ? "Ekleniyor…" : "Hedefe ekle"}</Btn>
        </form>
        {hata && <p style={{ color: "#C4503A", fontSize: 12, margin: "10px 0 0" }}>{hata}</p>}
        {!yukleniyor && !hata && universiteler.length === 0 && <p style={{ color: "rgba(15,27,45,0.45)", fontSize: 12, margin: "10px 0 0" }}>Katalogda üniversite bulunamadı.</p>}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: 17, marginBottom: 4 }}>Kayıtlı hedefler</h2>
            <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 12 }}>Seçimlerini daha sonra tercih robotunda kullanacağız.</p>
          </div>
          <Badge variant="ink">{hedefler.length} hedef</Badge>
        </div>
        {hedefler.length === 0 ? (
          <p style={{ color: "rgba(15,27,45,0.45)", fontSize: 13 }}>Henüz hedef eklemedin.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hedefler.map((hedef) => (
              <div key={hedef.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 8, border: "1px solid rgba(15,27,45,0.08)", background: "rgba(228,187,96,0.07)" }}>
                <div style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "#16283F", color: "#F4EFE4", fontSize: 11, fontWeight: 800 }}>{hedef.tur === "lisans" ? "4Y" : "2Y"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#16283F", fontWeight: 700, fontSize: 13 }}>{hedef.program_adi}</div>
                  <div style={{ color: "rgba(15,27,45,0.5)", fontSize: 11, marginTop: 2 }}>{hedef.universite_adi} · {hedef.program_kodu}</div>
                </div>
                <button type="button" onClick={() => void hedefSil(hedef.id)} aria-label={`${hedef.program_adi} hedefini sil`} style={{ border: 0, background: "none", color: "#C4503A", cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
