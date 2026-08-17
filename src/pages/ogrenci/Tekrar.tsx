import { useToast } from "../../components/useToast";
import { useEffect, useMemo, useState } from "react";
import { tekrarPlanlariniGetir, tekrarPlanEkle, tekrarPlanYapildi, tekrarPlanSil } from "../../lib/tekrarPlanQueries";
import type { TekrarPlan } from "../../types/database";
import { Card, Btn, Input, Label, FormGroup, Checkbox, Badge, EmptyState } from "../../components/ui";
import { Icon } from "../../components/Icon";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function relativeDate(tarih: string): string {
  const d = new Date(tarih + "T00:00:00");
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const fark = Math.round((d.getTime() - bugun.getTime()) / 86400000);
  if (fark === 0) return "Bugün";
  if (fark === 1) return "Yarın";
  if (fark === -1) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function Tekrar() {
  const { toast, show } = useToast();
  const [planlar, setPlanlar] = useState<TekrarPlan[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aciklama, setAciklama] = useState("");
  const [planTarihi, setPlanTarihi] = useState(bugunIso());
  const [bekleyenIslemler, setBekleyenIslemler] = useState<Set<string>>(() => new Set());
  const [ekleniyor, setEkleniyor] = useState(false);

  useEffect(() => {
    tekrarPlanlariniGetir().then(setPlanlar).catch(() => {}).finally(() => setYukleniyor(false));
  }, []);

  async function handleEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!aciklama.trim() || ekleniyor) return;
    const bekleyenAciklama = aciklama.trim();
    setEkleniyor(true);
    try {
      const yeni = await tekrarPlanEkle(bekleyenAciklama, null, planTarihi);
      setPlanlar((p) => [...p, yeni]);
      setAciklama("");
      show("Tekrar planına eklendi ✓");
    } catch {
      show("Tekrar planı eklenemedi. Yazdığın açıklama korundu.");
    } finally {
      setEkleniyor(false);
    }
  }

  async function toggleYapildi(p: TekrarPlan) {
    const islemId = `toggle:${p.id}`;
    if (bekleyenIslemler.has(islemId)) return;
    setBekleyenIslemler((ids) => new Set(ids).add(islemId));
    const oncekiDurum = p.yapildi;
    const yeni = !oncekiDurum;
    setPlanlar((ps) => ps.map((x) => (x.id === p.id ? { ...x, yapildi: yeni } : x)));
    try {
      await tekrarPlanYapildi(p.id, yeni);
      show("Kaydedildi ✓");
    } catch {
      setPlanlar((ps) => ps.map((x) => (x.id === p.id ? { ...x, yapildi: oncekiDurum } : x)));
      show("Tekrar güncellenemedi. Değişiklik geri alındı.");
    } finally {
      setBekleyenIslemler((ids) => {
        const sonraki = new Set(ids);
        sonraki.delete(islemId);
        return sonraki;
      });
    }
  }

  async function handleSil(id: string) {
    const islemId = `sil:${id}`;
    if (bekleyenIslemler.has(islemId)) return;
    setBekleyenIslemler((ids) => new Set(ids).add(islemId));
    const silinen = planlar.find((p) => p.id === id);
    setPlanlar((ps) => ps.filter((x) => x.id !== id));
    try {
      await tekrarPlanSil(id);
      show("Tekrar planı silindi ✓");
    } catch {
      if (silinen) {
        setPlanlar((ps) => [...ps, silinen].sort((a, b) => a.plan_tarihi.localeCompare(b.plan_tarihi)));
      }
      show("Tekrar planı silinemedi. Değişiklik geri alındı.");
    } finally {
      setBekleyenIslemler((ids) => {
        const sonraki = new Set(ids);
        sonraki.delete(islemId);
        return sonraki;
      });
    }
  }

  const bugun = bugunIso();
  const bugunku = useMemo(() => planlar.filter((p) => p.plan_tarihi === bugun && !p.yapildi), [planlar, bugun]);
  const gelecek = useMemo(() => planlar.filter((p) => p.plan_tarihi !== bugun && !p.yapildi), [planlar, bugun]);
  const tamamlananlar = useMemo(() => planlar.filter((p) => p.yapildi), [planlar]);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  function RepItem({ p }: { p: TekrarPlan }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px" }}>
        <Checkbox checked={p.yapildi} disabled={bekleyenIslemler.has(`toggle:${p.id}`)} onChange={() => void toggleYapildi(p)} />
        <span style={{ flex: 1, fontSize: 13, textDecoration: p.yapildi ? "line-through" : "none", color: p.yapildi ? "rgba(15,27,45,0.35)" : "#0F1B2D" }}>{p.aciklama}</span>
        <span style={{ fontSize: 11, color: "rgba(15,27,45,0.4)" }}>{relativeDate(p.plan_tarihi)}</span>
        <button className="btn btn-danger btn-sm btn-icon" type="button" disabled={bekleyenIslemler.has(`sil:${p.id}`)} onClick={() => void handleSil(p.id)}><Icon name="trash" size={13} /></button>
      </div>
    );
  }

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Tekrar Planı</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Aralıklı tekrar planla ve tamamla</p>
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Yeni Tekrar Ekle</h3>
        <form onSubmit={handleEkle} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <FormGroup style={{ flex: 1, minWidth: 220 }}>
            <Label>Konu / Soru Açıklaması *</Label>
            <Input placeholder="Fonksiyonlar — TYT q.12" value={aciklama} onChange={(e) => setAciklama(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Tarih</Label>
            <Input type="date" value={planTarihi} onChange={(e) => setPlanTarihi(e.target.value)} />
          </FormGroup>
          <Btn variant="primary" type="submit" size="sm" disabled={ekleniyor}><Icon name="plus" size={14} /> {ekleniyor ? "Ekleniyor…" : "Ekle"}</Btn>
        </form>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>Bugün</h3>
          <Badge variant={bugunku.length > 0 ? "brick" : "teal"}>{bugunku.length} bekliyor</Badge>
        </div>
        {bugunku.length === 0 ? (
          <EmptyState icon="✅" title="Bugünkü tekrarlar tamam!" desc="Yarın için plan hazırla." />
        ) : (
          <div className="rule-lines" style={{ borderRadius: 8, overflow: "hidden" }}>
            {bugunku.map((p) => <RepItem key={p.id} p={p} />)}
          </div>
        )}
      </Card>

      {gelecek.length > 0 && (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Gelecek Tekrarlar</h3>
          <div className="rule-lines" style={{ borderRadius: 8, overflow: "hidden" }}>
            {gelecek.map((p) => <RepItem key={p.id} p={p} />)}
          </div>
        </Card>
      )}

      {tamamlananlar.length > 0 && (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Tamamlananlar</h3>
          <div className="rule-lines" style={{ borderRadius: 8, overflow: "hidden", opacity: 0.6 }}>
            {tamamlananlar.map((p) => <RepItem key={p.id} p={p} />)}
          </div>
        </Card>
      )}
    </div>
  );
}
