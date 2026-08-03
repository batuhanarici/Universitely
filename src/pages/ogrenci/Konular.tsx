import { useEffect, useMemo, useState } from "react";
import { konularVeDersler, konuIlerlemeleriGetir, konuIlerlemeIsaretle, type KonuDersBilgisi } from "../../lib/konuIlerlemeQueries";
import { kendiSonuclariniGetir, type SonucDetay } from "../../lib/ogrenciQueries";
import type { KonuIlerleme } from "../../types/database";

function zayifKonuIdleri(sonuclar: SonucDetay[]): Set<string> {
  const map = new Map<string, { dogru: number; toplam: number }>();
  for (const s of sonuclar) {
    const mevcut = map.get(s.konu_id ?? "") ?? { dogru: 0, toplam: 0 };
    mevcut.toplam++;
    if (s.durum === "dogru") mevcut.dogru++;
    map.set(s.konu_id ?? "", mevcut);
  }
  const zayif = new Set<string>();
  for (const [id, deger] of map) {
    if (deger.toplam > 0 && (deger.dogru / deger.toplam) * 100 < 55) zayif.add(id);
  }
  return zayif;
}

export default function Konular() {
  const [konular, setKonular] = useState<KonuDersBilgisi[]>([]);
  const [ilerlemeler, setIlerlemeler] = useState<KonuIlerleme[]>([]);
  const [zayiflar, setZayiflar] = useState<Set<string>>(new Set());
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([konularVeDersler(), konuIlerlemeleriGetir(), kendiSonuclariniGetir()])
      .then(([k, i, s]) => {
        setKonular(k);
        setIlerlemeler(i);
        setZayiflar(zayifKonuIdleri(s));
      })
      .finally(() => setYukleniyor(false));
  }, []);

  const ilerlemeHaritasi = useMemo(() => {
    const map = new Map<string, KonuIlerleme>();
    for (const i of ilerlemeler) map.set(i.konu_id, i);
    return map;
  }, [ilerlemeler]);

  async function toggle(konuId: string) {
    const mevcut = ilerlemeHaritasi.get(konuId);
    const yeniDurum = !mevcut?.tamamlandi;
    setIlerlemeler((iler) => {
      const kalan = iler.filter((x) => x.konu_id !== konuId);
      return yeniDurum
        ? [...kalan, { id: mevcut?.id ?? "", ogrenci_id: "", konu_id: konuId, tamamlandi: true, tamamlanma_tarihi: new Date().toISOString().slice(0, 10) }]
        : kalan;
    });
    await konuIlerlemeIsaretle(konuId, yeniDurum);
  }

  const dersGrubu = useMemo(() => {
    const map = new Map<string, KonuDersBilgisi[]>();
    for (const k of konular) {
      if (!map.has(k.ders_adi)) map.set(k.ders_adi, []);
      map.get(k.ders_adi)!.push(k);
    }
    return Array.from(map.entries());
  }, [konular]);

  const eksikler = useMemo(
    () => konular.filter((k) => !ilerlemeHaritasi.get(k.id)?.tamamlandi || zayiflar.has(k.id)),
    [konular, ilerlemeHaritasi, zayiflar]
  );
  const tamamlananSayisi = konular.filter((k) => ilerlemeHaritasi.get(k.id)?.tamamlandi).length;
  const ilerlemeYuzde = konular.length === 0 ? 0 : Math.round((tamamlananSayisi / konular.length) * 100);

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <div className="stagger-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 24, color: "var(--ink)" }}>Konular</h1>
        <span className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>
          <span style={{ color: "var(--ink)", fontWeight: 700 }}>{tamamlananSayisi}</span>/{konular.length} tamamlandı ({ilerlemeYuzde}%)
        </span>
      </div>

      {eksikler.length > 0 && (
        <div className="card stagger-item" style={{ animationDelay: "0.05s", borderLeft: "4px solid var(--yanlis)" }}>
          <h2 className="card-title">Eksik / Ağırlık Verilmesi Gerekenler</h2>
          {eksikler.map((k, i) => (
            <div key={k.id} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.1 + i * 0.04}s` }}>
              <input type="checkbox" checked={!!ilerlemeHaritasi.get(k.id)?.tamamlandi} onChange={() => toggle(k.id)} style={{ accentColor: "var(--gold-dim)", width: 15, height: 15 }} />
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--ink)", textDecoration: ilerlemeHaritasi.get(k.id)?.tamamlandi ? "line-through" : "none", opacity: ilerlemeHaritasi.get(k.id)?.tamamlandi ? 0.5 : 1 }}>{k.ad}</span>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{k.ders_adi}</span>
              {zayiflar.has(k.id) && <span className="badge-weak">Zayıf</span>}
            </div>
          ))}
        </div>
      )}

      {dersGrubu.map(([dersAdi, konularListesi], gi) => (
        <div key={dersAdi} className="card stagger-item" style={{ marginTop: 16, animationDelay: `${0.1 + gi * 0.05}s` }}>
          <h2 className="card-title">{dersAdi}</h2>
          {konularListesi.map((k, i) => {
            const durum = ilerlemeHaritasi.get(k.id);
            const zayif = zayiflar.has(k.id);
            return (
              <div key={k.id} className="stagger-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2", animationDelay: `${0.15 + i * 0.03}s` }}>
                <input type="checkbox" checked={!!durum?.tamamlandi} onChange={() => toggle(k.id)} style={{ accentColor: "var(--gold-dim)", width: 16, height: 16 }} />
                <span style={{ flex: 1, fontSize: 13.5, color: "var(--ink)", fontWeight: durum?.tamamlandi ? 400 : 500, textDecoration: durum?.tamamlandi ? "line-through" : "none", opacity: durum?.tamamlandi ? 0.5 : 1 }}>{k.ad}</span>
                {zayif && !durum?.tamamlandi && <span className="badge-weak">Zayıf</span>}
                {durum?.tamamlandi && <span style={{ fontSize: 11, color: "var(--dogru)", fontWeight: 600 }}>✓</span>}
              </div>
            );
          })}
        </div>
      ))}

      {konular.length === 0 && (
        <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz konu tanımlanmamış — öğretmenin konu eklediğinde burada listelenecek.</p>
        </div>
      )}
    </div>
  );
}
