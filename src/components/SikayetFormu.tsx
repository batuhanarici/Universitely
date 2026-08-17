import { useToast } from "./useToast";
import { useState } from "react";
import { sikayetOlustur } from "../lib/adminQueries";
import { Btn, Card, FormGroup, Label, Select, Textarea, Input } from "./ui";

export default function SikayetFormu() {
  const { toast, show } = useToast();
  const [kategori, setKategori] = useState("teknik");
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState("");

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setGonderiliyor(true);
    setHata("");
    try {
      await sikayetOlustur({ kategori: kategori as "teknik" | "koc" | "ogrenci" | "icerik" | "diger", baslik: baslik.trim(), aciklama: aciklama.trim() });
      setBaslik("");
      setAciklama("");
      show("Şikâyetin admin ekibine iletildi.");
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Şikâyet gönderilemedi.");
    } finally {
      setGonderiliyor(false);
    }
  }

  return <Card>
    <h2 className="section-title" style={{ fontSize: 17 }}>Şikâyet veya destek bildir</h2>
    <p style={{ color: "rgba(15,27,45,0.56)", fontSize: 13, lineHeight: 1.55, marginBottom: 16 }}>Teknik bir problem, koç/öğrenci ilişkisi veya içerikle ilgili bir durum varsa bize iletebilirsin.</p>
    <form onSubmit={gonder} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <FormGroup><Label>Kategori</Label><Select value={kategori} onChange={(e) => setKategori(e.target.value)}><option value="teknik">Teknik problem</option><option value="koc">Koçla ilgili</option><option value="ogrenci">Öğrenciyle ilgili</option><option value="icerik">İçerik</option><option value="diger">Diğer</option></Select></FormGroup>
      <FormGroup><Label>Başlık</Label><Input value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Kısa bir başlık yaz" required maxLength={160} /></FormGroup>
      <FormGroup><Label>Açıklama</Label><Textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Yaşadığın durumu mümkün olduğunca açık anlat" required maxLength={3000} /></FormGroup>
      <div><Btn type="submit" disabled={gonderiliyor || !baslik.trim() || !aciklama.trim()}>{gonderiliyor ? "Gönderiliyor…" : "Bildirimi gönder"}</Btn></div>
    </form>
    {hata && <p style={{ color: "#C4503A", fontSize: 12, marginTop: 10 }}>{hata}</p>}
    {toast}
  </Card>;
}
