import { useEffect, useMemo, useState } from "react";
import { gorevleriGetir, gorevEkle, gorevTamamla, gorevSil } from "../../lib/gorevQueries";
import type { Gorev, GorevTipi } from "../../types/database";
import { Card, Btn, Input, Label, FormGroup, Select, Badge, Checkbox, useToast } from "../../components/ui";
import { Icon } from "../../components/Icon";
import GorevDosyaPaneli from "../../components/GorevDosyaPaneli";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function tarihEtiketi(tarih: string): string {
  const d = new Date(tarih + "T00:00:00");
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const fark = Math.round((d.getTime() - bugun.getTime()) / 86400000);
  if (fark === 0) return "Bugün";
  if (fark === 1) return "Yarın";
  if (fark === -1) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function Gorevler() {
  const { toast, show } = useToast();
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [baslik, setBaslik] = useState("");
  const [tarih, setTarih] = useState(bugunIso());
  const [tip, setTip] = useState<GorevTipi>("gunluk");

  useEffect(() => {
    gorevleriGetir().then(setGorevler).catch(() => {}).finally(() => setYukleniyor(false));
  }, []);

  async function handleEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!baslik.trim()) return;
    const yeni = await gorevEkle({ baslik: baslik.trim(), tarih, tip });
    setGorevler((g) => [yeni, ...g]);
    setBaslik("");
    show("Görev eklendi ✓");
  }

  async function toggleGorev(g: Gorev) {
    const yeniDurum = !g.tamamlandi;
    setGorevler((gs) => gs.map((x) => (x.id === g.id ? { ...x, tamamlandi: yeniDurum, ...(yeniDurum ? {} : { kontrol_edildi: false }) } : x)));
    await gorevTamamla(g.id, yeniDurum);
  }

  async function handleSil(id: string) {
    setGorevler((gs) => gs.filter((x) => x.id !== id));
    await gorevSil(id);
  }

  const kocGorevleri = useMemo(
    () => gorevler.filter((g) => g.tip === "koc").sort((a, b) => a.tarih.localeCompare(b.tarih)),
    [gorevler]
  );
  const gunlukGorevler = useMemo(() => gorevler.filter((g) => g.tip === "gunluk"), [gorevler]);
  const haftalikGorevler = useMemo(() => gorevler.filter((g) => g.tip === "haftalik"), [gorevler]);

  const bugunGunluk = gunlukGorevler.filter((g) => g.tarih === bugunIso());
  const bugunDiger = gunlukGorevler.filter((g) => g.tarih !== bugunIso());
  const bugunTamamlanan = bugunGunluk.filter((g) => g.tamamlandi).length;

  function KendiGorevSatiri({ g }: { g: Gorev }) {
    return (
      <div className="gorev-satiri" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
        <Checkbox checked={g.tamamlandi} onChange={() => toggleGorev(g)} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, textDecoration: g.tamamlandi ? "line-through" : "none", color: g.tamamlandi ? "rgba(15,27,45,0.35)" : "#0F1B2D", overflowWrap: "anywhere" }}>{g.baslik}</span>
        <span style={{ flexShrink: 0, fontSize: 11, color: "rgba(15,27,45,0.4)" }}>{tarihEtiketi(g.tarih)}</span>
        <button
          type="button"
          className="gorev-sil btn btn-danger btn-sm"
          aria-label={`${g.baslik} görevini sil`}
          onClick={() => void handleSil(g.id)}
        >
          <Icon name="trash" size={13} />
        </button>
      </div>
    );
  }

  function KocGorevSatiri({ g }: { g: Gorev }) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
          <Checkbox checked={g.tamamlandi} onChange={() => toggleGorev(g)} />
          <span style={{ flex: 1, fontSize: 13, textDecoration: g.tamamlandi ? "line-through" : "none", color: g.tamamlandi ? "rgba(15,27,45,0.35)" : "#0F1B2D" }}>{g.baslik}</span>
          <span style={{ fontSize: 11, color: "rgba(15,27,45,0.4)" }}>{tarihEtiketi(g.tarih)}</span>
          {g.tamamlandi && (
            <Badge variant={g.kontrol_edildi ? "teal" : "gold"}>{g.kontrol_edildi ? "✓ Onaylandı" : "Onay bekleniyor"}</Badge>
          )}
        </div>
        {g.geri_bildirim && (
          <div style={{ marginLeft: 26, padding: "6px 10px", background: "rgba(228,187,96,0.1)", borderRadius: 6, fontSize: 12, color: "#0F1B2D", marginBottom: 4 }}>
            💬 Koçundan: {g.geri_bildirim}
          </div>
        )}
        <GorevDosyaPaneli gorevId={g.id} ogrenciId={g.ogrenci_id} yuklemeTuru="teslim" />
      </div>
    );
  }

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Görevler</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Kişisel ve koç görevleri</p>
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Yeni Görev</h3>
        <form onSubmit={handleEkle} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
          <FormGroup>
            <Label>Görev Başlığı *</Label>
            <Input placeholder="Matematik soru çöz" value={baslik} onChange={(e) => setBaslik(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Tarih</Label>
            <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Tip</Label>
            <Select value={tip} onChange={(e) => setTip(e.target.value as GorevTipi)}>
              <option value="gunluk">Günlük</option>
              <option value="haftalik">Haftalık</option>
            </Select>
          </FormGroup>
          <Btn variant="primary" type="submit" size="sm"><Icon name="plus" size={14} /> Ekle</Btn>
        </form>
      </Card>

      {kocGorevleri.length > 0 && (
        <Card className="tape-accent">
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Koçtan Görevler</h3>
          {kocGorevleri.map((g) => <KocGorevSatiri key={g.id} g={g} />)}
        </Card>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Bugün</h3>
          <Badge variant="ink">{bugunTamamlanan}/{bugunGunluk.length} tamamlandı</Badge>
        </div>
        {bugunGunluk.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)", fontStyle: "italic" }}>Bugün için görev yok.</p>
        ) : (
          bugunGunluk.map((g) => <KendiGorevSatiri key={g.id} g={g} />)
        )}
      </Card>

      {bugunDiger.length > 0 && (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Tüm Günlük Görevler</h3>
          {bugunDiger.map((g) => <KendiGorevSatiri key={g.id} g={g} />)}
        </Card>
      )}

      {haftalikGorevler.length > 0 && (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Haftalık Hedefler</h3>
          {haftalikGorevler.map((g) => <KendiGorevSatiri key={g.id} g={g} />)}
        </Card>
      )}
    </div>
  );
}
