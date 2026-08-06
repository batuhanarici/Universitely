import { useEffect, useMemo, useState } from "react";
import { tekrarPlanlariniGetir, tekrarPlanEkle, tekrarPlanYapildi, tekrarPlanSil } from "../../lib/tekrarPlanQueries";
import type { TekrarPlan } from "../../types/database";
import { Card, Btn, Input, Label, FormGroup, Checkbox, Badge, EmptyState, useToast } from "../../components/ui";
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

  useEffect(() => {
    tekrarPlanlariniGetir().then(setPlanlar).catch(() => {}).finally(() => setYukleniyor(false));
  }, []);

  async function handleEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!aciklama.trim()) return;
    const yeni = await tekrarPlanEkle(aciklama.trim(), null, planTarihi);
    setPlanlar((p) => [...p, yeni]);
    setAciklama("");
    show("Tekrar planına eklendi ✓");
  }

  async function toggleYapildi(p: TekrarPlan) {
    const yeni = !p.yapildi;
    setPlanlar((ps) => ps.map((x) => (x.id === p.id ? { ...x, yapildi: yeni } : x)));
    await tekrarPlanYapildi(p.id, yeni);
    show("Kaydedildi ✓");
  }

  async function handleSil(id: string) {
    setPlanlar((ps) => ps.filter((x) => x.id !== id));
    await tekrarPlanSil(id);
  }

  const bugun = bugunIso();
  const bugunku = useMemo(() => planlar.filter((p) => p.plan_tarihi === bugun && !p.yapildi), [planlar, bugun]);
  const gelecek = useMemo(() => planlar.filter((p) => p.plan_tarihi !== bugun && !p.yapildi), [planlar, bugun]);
  const tamamlananlar = useMemo(() => planlar.filter((p) => p.yapildi), [planlar]);

  if (yukleniyor) return <p style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  function RepItem({ p }: { p: TekrarPlan }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px" }}>
        <Checkbox checked={p.yapildi} onChange={() => toggleYapildi(p)} />
        <span style={{ flex: 1, fontSize: 13, textDecoration: p.yapildi ? "line-through" : "none", color: p.yapildi ? "rgba(15,27,45,0.35)" : "#0F1B2D" }}>{p.aciklama}</span>
        <span style={{ fontSize: 11, color: "rgba(15,27,45,0.4)" }}>{relativeDate(p.plan_tarihi)}</span>
        <button className="btn btn-danger btn-sm" onClick={() => handleSil(p.id)}><Icon name="trash" size={13} /></button>
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
          <Btn variant="primary" type="submit" size="sm"><Icon name="plus" size={14} /> Ekle</Btn>
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
