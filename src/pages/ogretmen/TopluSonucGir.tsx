import { useEffect, useMemo, useState } from "react";
import type { Ogrenci, SoruDurumu } from "../../types/database";
import { denemeleriGetir } from "../../lib/denemeQueries";
import {
  ogrencileriGetir,
  sablonSorulariniGetir,
  denemeSonuclariniGetir,
  topluSonucGir,
  type SablonSorusuDetayli,
  type TopluSonucGirdisi,
} from "../../lib/sonucQueries";
import type { Deneme } from "../../types/database";

type DenemeDetayli = Deneme & { sablon_adi: string };
type Mod = "grid" | "yapistir";

const SIRADAKI: Record<SoruDurumu, SoruDurumu | null> = { dogru: "yanlis", yanlis: "bos", bos: null };

const HUCRENIN_RENGI: Record<SoruDurumu, string> = {
  dogru: "var(--dogru)",
  yanlis: "var(--yanlis)",
  bos: "var(--bos)",
};

const ORNEK = `Ayşe Yılmaz;DDYYBDDBDDY
Mehmet Kaya;DYBDYBBDDDY
Zeynep Demir;DBYDDBYDBD`;

export default function TopluSonucGir() {
  const [denemeler, setDenemeler] = useState<DenemeDetayli[]>([]);
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [denemeId, setDenemeId] = useState("");
  const [sorular, setSorular] = useState<SablonSorusuDetayli[]>([]);
  const [soruSayisi, setSoruSayisi] = useState("40");
  const [mod, setMod] = useState<Mod>("grid");
  const [grid, setGrid] = useState<Record<string, Record<number, SoruDurumu>>>({});
  const [pasteMetin, setPasteMetin] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    Promise.all([denemeleriGetir(), ogrencileriGetir()])
      .then(([d, o]) => {
        setDenemeler(d);
        setOgrenciler(o);
        if (d.length > 0) setDenemeId(d[0].id);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const secilenDeneme = denemeler.find((d) => d.id === denemeId);

  useEffect(() => {
    if (!secilenDeneme?.sablon_id) {
      setSorular([]);
      return;
    }
    sablonSorulariniGetir(secilenDeneme.sablon_id).then(setSorular).catch(() => {});
  }, [denemeId, denemeler, secilenDeneme?.sablon_id]);

  useEffect(() => {
    if (!denemeId) return;
    setGrid({});
    denemeSonuclariniGetir(denemeId)
      .then((satirlar) => {
        const g: Record<string, Record<number, SoruDurumu>> = {};
        for (const s of satirlar) {
          if (!g[s.ogrenci_id]) g[s.ogrenci_id] = {};
          g[s.ogrenci_id][s.soru_no] = s.durum;
        }
        setGrid(g);
      })
      .catch(() => {});
  }, [denemeId]);

  const soruNumaralari = useMemo(() => {
    if (sorular.length > 0) return sorular.map((s) => s.soru_no).sort((a, b) => a - b);
    const n = Math.max(1, Math.min(200, Number(soruSayisi) || 40));
    return Array.from({ length: n }, (_, i) => i + 1);
  }, [sorular, soruSayisi]);

  const konuHaritasi = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of sorular) map.set(s.soru_no, s.konu_ad);
    return map;
  }, [sorular]);

  function hucreyiTikla(ogrenciId: string, soruNo: number) {
    setGrid((g) => {
      const satir = { ...(g[ogrenciId] ?? {}) };
      const mevcut = satir[soruNo];
      if (mevcut === undefined) satir[soruNo] = "dogru";
      else if (SIRADAKI[mevcut] === null) delete satir[soruNo];
      else satir[soruNo] = SIRADAKI[mevcut]!;
      return { ...g, [ogrenciId]: satir };
    });
  }

  function satiriTemizle(ogrenciId: string) {
    setGrid((g) => {
      const yeni = { ...g };
      delete yeni[ogrenciId];
      return yeni;
    });
  }

  function yapistirVeGridiDoldur() {
    setHata("");
    setMesaj("");
    const eslesmeyen: string[] = [];
    setGrid((g) => {
      const yeni = { ...g };
      for (const satir of pasteMetin.split("\n")) {
        const t = satir.trim();
        if (!t) continue;
        const [ad, dizi] = t.split(/[;\t]/).map((s) => s.trim());
        if (!ad || !dizi) {
          eslesmeyen.push(t);
          continue;
        }
        const ogr = ogrenciler.find((o) => o.ad_soyad.trim().toLowerCase() === ad.toLowerCase());
        if (!ogr) {
          eslesmeyen.push(t);
          continue;
        }
        const satirDurum: Record<number, SoruDurumu> = {};
        const sorus = dizi.replace(/\s+/g, "").toUpperCase();
        for (let i = 0; i < sorus.length; i++) {
          const c = sorus[i];
          satirDurum[i + 1] = c === "D" ? "dogru" : c === "Y" ? "yanlis" : "bos";
        }
        yeni[ogr.id] = satirDurum;
      }
      return yeni;
    });
    if (eslesmeyen.length > 0) {
      setHata(`Eşleşmeyen satırlar: ${eslesmeyen.join("  |  ")}`);
    }
  }

  async function handleKaydet() {
    setKaydediliyor(true);
    setMesaj("");
    setHata("");
    try {
      const girdi: TopluSonucGirdisi[] = [];
      const eksikler: string[] = [];
      for (const o of ogrenciler) {
        const satir = grid[o.id] ?? {};
        const dolu = soruNumaralari.filter((n) => satir[n] !== undefined);
        if (dolu.length === 0) continue;
        if (dolu.length < soruNumaralari.length) {
          eksikler.push(`${o.ad_soyad} (${dolu.length}/${soruNumaralari.length})`);
          continue;
        }
        girdi.push({
          ogrenci_id: o.id,
          sorular: soruNumaralari.map((n) => ({ soru_no: n, durum: satir[n]! })),
        });
      }
      if (girdi.length === 0) {
        setHata("Kaydedilecek veri yok — en az bir öğrencinin satırını tamamen doldur.");
        return;
      }
      await topluSonucGir(denemeId, girdi);
      setMesaj(
        `${girdi.length} öğrenci kaydedildi.${eksikler.length ? ` Eksik bırakıldı: ${eksikler.join(", ")}` : ""}`
      );
      setGrid({});
      setPasteMetin("");
    } catch (e: any) {
      setHata(e.message ?? "Kayıt sırasında hata oluştu.");
    } finally {
      setKaydediliyor(false);
    }
  }

  const doluOgrenciSayisi = ogrenciler.filter((o) => {
    const satir = grid[o.id] ?? {};
    return soruNumaralari.some((n) => satir[n] !== undefined);
  }).length;

  if (yukleniyor) return <p className="mono" style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  if (denemeler.length === 0) {
    return <p style={{ textAlign: "center", marginTop: 60, color: "var(--yanlis)" }}>Önce bir deneme oluşturman lazım.</p>;
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <h1 className="display stagger-item" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 20 }}>Toplu Sonuç Gir</h1>

      <div className="card stagger-item" style={{ animationDelay: "0.05s" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="input" style={{ flex: 2, minWidth: 220 }} value={denemeId} onChange={(e) => setDenemeId(e.target.value)}>
            {denemeler.map((d) => (
              <option key={d.id} value={d.id}>{d.ad} · {d.tur ?? "brans"}</option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.05)", padding: 4, borderRadius: 10, flex: 1, minWidth: 260 }}>
            {(
              [
                { id: "grid", etiket: "Sınıf Grid" },
                { id: "yapistir", etiket: "Kopyala-Yapıştır" },
              ] as { id: Mod; etiket: string }[]
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMod(m.id)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 7, border: "none", fontSize: 12.5, fontWeight: 600,
                  background: mod === m.id ? "var(--gold)" : "transparent",
                  color: mod === m.id ? "var(--ink)" : "var(--muted)",
                  transition: "all 0.2s var(--ease)", cursor: "pointer",
                }}
              >
                {m.etiket}
              </button>
            ))}
          </div>
        </div>
        {sorular.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>Şablon yok — soru sayısı:</span>
            <input
              className="input"
              type="number"
              min={1}
              max={200}
              value={soruSayisi}
              onChange={(e) => setSoruSayisi(e.target.value)}
              style={{ width: 80 }}
            />
          </div>
        )}
      </div>

      {mod === "yapistir" && (
        <div className="card stagger-item" style={{ marginTop: 12, animationDelay: "0.08s" }}>
          <h2 className="card-title">Optik Dizi Yapıştır</h2>
          <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 8 }}>
            Her satır: <span className="mono">Ad Soyad; DDYYBDD…</span> (D=doğru, Y=yanlış, diğer=boş). Bir karakter bir soru.
          </p>
          <textarea
            className="input"
            rows={5}
            value={pasteMetin}
            onChange={(e) => setPasteMetin(e.target.value)}
            placeholder={ORNEK}
            style={{ width: "100%", resize: "vertical", fontFamily: "var(--font-mono)" }}
          />
          <button onClick={yapistirVeGridiDoldur} disabled={!pasteMetin.trim()} className="btn btn-primary" style={{ marginTop: 8 }}>
            Grid'e Aktar
          </button>
        </div>
      )}

      <div className="card stagger-item" style={{ marginTop: 12, animationDelay: "0.1s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>
            Cevap Gridi <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>({doluOgrenciSayisi} öğrenci dolduruldu · hücreye tıklayınca D→Y→B döner)</span>
          </h2>
          <button onClick={handleKaydet} disabled={kaydediliyor || doluOgrenciSayisi === 0} className="btn btn-primary">
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ position: "sticky", left: 0, background: "white", zIndex: 2, textAlign: "left", padding: "6px 10px", fontSize: 12, color: "var(--muted)", borderBottom: "2px solid var(--paper-dim)" }}>
                  Öğrenci
                </th>
                {soruNumaralari.map((n) => (
                  <th key={n} style={{ padding: "4px 2px", fontSize: 10.5, color: "var(--muted)", borderBottom: "2px solid var(--paper-dim)", minWidth: 30 }} title={konuHaritasi.get(n)}>
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ogrenciler.map((o) => {
                const satir = grid[o.id] ?? {};
                const dolu = soruNumaralari.filter((n) => satir[n] !== undefined).length;
                return (
                  <tr key={o.id}>
                    <td style={{ position: "sticky", left: 0, background: "white", zIndex: 1, padding: "4px 10px", fontSize: 12.5, color: "var(--ink)", whiteSpace: "nowrap", borderBottom: "1px solid #f2f2f2" }}>
                      {o.ad_soyad}
                      <span className="mono" style={{ marginLeft: 6, fontSize: 10.5, color: dolu === soruNumaralari.length ? "var(--dogru)" : "var(--muted)" }}>
                        {dolu}/{soruNumaralari.length}
                      </span>
                      {dolu > 0 && (
                        <button onClick={() => satiriTemizle(o.id)} style={{ marginLeft: 6, border: "none", background: "none", color: "var(--yanlis)", fontSize: 11, cursor: "pointer" }}>
                          temizle
                        </button>
                      )}
                    </td>
                    {soruNumaralari.map((n) => {
                      const durum = satir[n];
                      return (
                        <td key={n} style={{ padding: 2, borderBottom: "1px solid #f2f2f2" }}>
                          <button
                            onClick={() => hucreyiTikla(o.id, n)}
                            style={{
                              width: 26, height: 26, borderRadius: 6, border: "1px solid #e3e3e3",
                              background: durum ? HUCRENIN_RENGI[durum] : "white",
                              color: durum ? "white" : "#bbb",
                              fontWeight: 700, fontSize: 11, cursor: "pointer", transition: "all 0.12s var(--ease)",
                            }}
                          >
                            {durum === "dogru" ? "D" : durum === "yanlis" ? "Y" : durum === "bos" ? "B" : "·"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {mesaj && <p style={{ marginTop: 10, color: "var(--dogru)", fontSize: 13 }}>{mesaj}</p>}
        {hata && <p style={{ marginTop: 10, color: "var(--yanlis)", fontSize: 13 }}>{hata}</p>}
      </div>
    </div>
  );
}
