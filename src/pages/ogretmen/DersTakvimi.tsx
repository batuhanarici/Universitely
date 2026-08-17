import { useEffect, useMemo, useState } from "react";
import { kocOgrencileri, type KocOgrencisi } from "../../lib/ogrenciYonetimQueries";
import {
  dersleriGetir,
  dersEkle,
  gorusmeDurumGuncelle,
  gorusmeSil,
  seansNotlariniGetir,
  takipMaddeleriniGetir,
} from "../../lib/kocAraclariQueries";
import type { Gorusme, SeansNotu, TakipMaddesi } from "../../types/database";
import { SeansKapanisPaneli } from "../../components/SeansKapanisPaneli";
import { subeleriGetir, subeyeGoreFiltrele, type Sube } from "../../lib/subeQueries";
import { Card, Select, Input, Btn, Badge, Label, FormGroup, useToast } from "../../components/ui";

const DURUM_ETIKET: Record<string, string> = {
  planlandi: "planlandı",
  tamamlandi: "tamamlandı",
  iptal: "iptal",
};

const DURUM_VAZIAN: Record<string, "gold" | "teal" | "brick"> = {
  planlandi: "gold",
  tamamlandi: "teal",
  iptal: "brick",
};

function tarihSaatEtiketi(tarih: string) {
  return new Date(tarih).toLocaleString("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function varsayilanDersSaati() {
  const tarih = new Date();
  tarih.setMinutes(Math.ceil((tarih.getMinutes() + 1) / 15) * 15, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${tarih.getFullYear()}-${pad(tarih.getMonth() + 1)}-${pad(tarih.getDate())}T${pad(tarih.getHours())}:${pad(tarih.getMinutes())}`;
}

export default function DersTakvimi() {
  const { toast, show } = useToast();
  const [ogrenciler, setOgrenciler] = useState<KocOgrencisi[]>([]);
  const [subeler, setSubeler] = useState<Sube[]>([]);
  const [seciliSubeId, setSeciliSubeId] = useState("");
  const [dersler, setDersler] = useState<Gorusme[]>([]);
  const [seansNotlari, setSeansNotlari] = useState<SeansNotu[]>([]);
  const [takipMaddeleri, setTakipMaddeleri] = useState<TakipMaddesi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const [ogrenciId, setOgrenciId] = useState("");
  const [baslik, setBaslik] = useState("");
  const [tarih, setTarih] = useState(varsayilanDersSaati);
  const [notlar, setNotlar] = useState("");

  useEffect(() => {
    Promise.all([kocOgrencileri(), dersleriGetir(), subeleriGetir(), seansNotlariniGetir(), takipMaddeleriniGetir()])
      .then(([o, d, s, notlar, takipler]) => {
        setOgrenciler(o);
        setDersler(d);
        setSubeler(s);
        setSeansNotlari(notlar);
        setTakipMaddeleri(takipler);
        if (o.length > 0) setOgrenciId(o[0].id);
      })
      .catch((error) => console.error("Ders takvimi yüklenemedi:", error))
      .finally(() => setYukleniyor(false));
  }, []);

  const filtreliOgrenciler = useMemo(
    () => subeyeGoreFiltrele(ogrenciler, seciliSubeId),
    [ogrenciler, seciliSubeId]
  );

  useEffect(() => {
    if (filtreliOgrenciler.length === 0) return;
    if (!filtreliOgrenciler.some((o) => o.id === ogrenciId)) {
      setOgrenciId(filtreliOgrenciler[0].id);
    }
  }, [filtreliOgrenciler, ogrenciId]);

  const ogrenciAdi = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of ogrenciler) map.set(o.id, o.ad_soyad);
    return map;
  }, [ogrenciler]);

  const subeHaritasi = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const o of ogrenciler) map.set(o.id, o.sube_id);
    return map;
  }, [ogrenciler]);

  const filtreliDersler = useMemo(() => {
    const liste = seciliSubeId
      ? dersler.filter((d) => subeHaritasi.get(d.ogrenci_id) === seciliSubeId)
      : dersler;
    return [...liste].sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime());
  }, [dersler, seciliSubeId, subeHaritasi]);

  const seansNotuHaritasi = useMemo(() => new Map(seansNotlari.map((not) => [not.gorusme_id, not])), [seansNotlari]);

  function dersSeansNotunuGuncelle(not: SeansNotu) {
    setSeansNotlari((mevcut) => [...mevcut.filter((x) => x.gorusme_id !== not.gorusme_id), not]);
  }

  function takipMaddesiEklendi(takip: TakipMaddesi) {
    setTakipMaddeleri((mevcut) => [...mevcut, takip].sort((a, b) => a.son_tarih.localeCompare(b.son_tarih)));
  }

  function takipMaddesiGuncellendi(takip: TakipMaddesi) {
    setTakipMaddeleri((mevcut) => mevcut.map((x) => (x.id === takip.id ? takip : x)));
  }

  async function handleDersEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!ogrenciId || !baslik.trim() || !tarih) return;
    setKaydediliyor(true);
    try {
      const yeni = await dersEkle({
        ogrenci_id: ogrenciId,
        baslik: baslik.trim(),
        tarih: new Date(tarih).toISOString(),
        notlar: notlar.trim() || null,
      });
      setDersler((mevcut) => [...mevcut, yeni]);
      setBaslik("");
      setNotlar("");
      setTarih(varsayilanDersSaati());
      show("Ders takvime eklendi ✓");
    } catch {
      show("Ders eklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function dersDurumunaGec(ders: Gorusme, durum: string) {
    setDersler((mevcut) => mevcut.map((x) => (x.id === ders.id ? { ...x, durum } : x)));
    try {
      await gorusmeDurumGuncelle(ders.id, durum);
    } catch {
      setDersler((mevcut) => mevcut.map((x) => (x.id === ders.id ? { ...x, durum: ders.durum } : x)));
      show("Ders durumu güncellenemedi.");
    }
  }

  async function dersSil(ders: Gorusme) {
    setDersler((mevcut) => mevcut.filter((x) => x.id !== ders.id));
    try {
      await gorusmeSil(ders.id);
    } catch {
      setDersler((mevcut) => [...mevcut, ders]);
      show("Ders silinemedi.");
    }
  }

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  if (ogrenciler.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {toast}
        <h1 className="page-title">Ders Takvimi</h1>
        <Card><p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Henüz öğrencin yok. Öğrenciler sekmesinden davet kodu oluşturup öğrenci ekleyebilirsin.</p></Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Ders Takvimi</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Öğrencilerinle yapacağın dersleri planla ve takip et.</p>
      </div>

      <Card>
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 16 }}>Yeni Ders Planla</h3>
        <form onSubmit={handleDersEkle} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr", gap: 10 }}>
          <FormGroup>
            <Label>Şube</Label>
            <Select value={seciliSubeId} onChange={(e) => setSeciliSubeId(e.target.value)}>
              <option value="">Tüm Şubeler</option>
              {subeler.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Öğrenci *</Label>
            <Select value={ogrenciId} onChange={(e) => setOgrenciId(e.target.value)} required>
              {filtreliOgrenciler.map((o) => <option key={o.id} value={o.id}>{o.ad_soyad}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Tarih-Saat *</Label>
            <Input type="datetime-local" value={tarih} onChange={(e) => setTarih(e.target.value)} required />
          </FormGroup>
          <FormGroup style={{ gridColumn: "1 / 3" }}>
            <Label>Ders Başlığı *</Label>
            <Input placeholder="Örn. Haftalık koçluk görüşmesi" value={baslik} onChange={(e) => setBaslik(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label>Not</Label>
            <Input placeholder="Opsiyonel not" value={notlar} onChange={(e) => setNotlar(e.target.value)} />
          </FormGroup>
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="primary" type="submit" disabled={kaydediliyor || filtreliOgrenciler.length === 0}>{kaydediliyor ? "…" : "Dersi Planla"}</Btn>
          </div>
        </form>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: 3, fontSize: 16 }}>Planlanan Dersler</h3>
            <p style={{ fontSize: 12, color: "rgba(15,27,45,0.45)" }}>{filtreliDersler.length} ders · saatler Türkiye yerel saatine göre gösterilir</p>
          </div>
          {subeler.length > 0 && (
            <Select value={seciliSubeId} onChange={(e) => setSeciliSubeId(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="">Tüm Şubeler</option>
              {subeler.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
            </Select>
          )}
        </div>
        {filtreliDersler.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(15,27,45,0.45)" }}>Henüz planlanmış ders yok.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtreliDersler.map((ders) => (
              <div key={ders.id} style={{ display: "flex", gap: 12, padding: "12px", borderRadius: 8, background: "rgba(228,187,96,0.07)", border: "1px solid rgba(228,187,96,0.26)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 650, fontSize: 14 }}>{ders.baslik}</span>
                    <Badge variant={DURUM_VAZIAN[ders.durum] ?? "gold"}>{DURUM_ETIKET[ders.durum] ?? ders.durum}</Badge>
                  </div>
                  <p style={{ fontSize: 13, color: "#0F1B2D" }}>{ogrenciAdi.get(ders.ogrenci_id) ?? "Öğrenci"}</p>
                  <p style={{ fontSize: 11, color: "rgba(15,27,45,0.5)" }}>{tarihSaatEtiketi(ders.tarih)}</p>
                  {ders.notlar && <p style={{ fontSize: 12, color: "rgba(15,27,45,0.6)", marginTop: 4, whiteSpace: "pre-wrap" }}>{ders.notlar}</p>}
                  {ders.durum === "tamamlandi" && (
                    <SeansKapanisPaneli
                      ders={ders}
                      seansNotu={seansNotuHaritasi.get(ders.id) ?? null}
                      takipMaddeleri={takipMaddeleri.filter((takip) => takip.gorusme_id === ders.id)}
                      onNotKaydedildi={dersSeansNotunuGuncelle}
                      onTakipEklendi={takipMaddesiEklendi}
                      onTakipGuncellendi={takipMaddesiGuncellendi}
                    />
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {ders.durum === "planlandi" && (
                    <>
                      <Btn variant="ghost" size="sm" onClick={() => dersDurumunaGec(ders, "tamamlandi")}>Tamamlandı</Btn>
                      <Btn variant="danger" size="sm" onClick={() => dersDurumunaGec(ders, "iptal")}>İptal</Btn>
                    </>
                  )}
                  <Btn variant="danger" size="sm" onClick={() => dersSil(ders)}>Sil</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
