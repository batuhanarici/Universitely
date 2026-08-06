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
import { Card, Select, Input, Textarea, Btn, Badge } from "../../components/ui";

type DenemeDetayli = Deneme & { sablon_adi: string };
type Mod = "grid" | "yapistir";

const SIRADAKI: Record<SoruDurumu, SoruDurumu | null> = { dogru: "yanlis", yanlis: "bos", bos: null };

const HUCRENIN_RENGI: Record<SoruDurumu, string> = {
  dogru: "#2A9D8F",
  yanlis: "#C4503A",
  bos: "#8C8780",
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

  if (yukleniyor) return <p className="mono" style={{ color: "rgba(15,27,45,0.5)" }}>Yükleniyor…</p>;

  if (denemeler.length === 0) {
    return <p style={{ textAlign: "center", marginTop: 60, color: "#C4503A" }}>Önce bir deneme oluşturman lazım.</p>;
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h1 className="page-title">Toplu Sonuç Gir</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Grid veya kopyala-yapıştır ile toplu cevap girişi</p>
      </div>

      <Card className="tape-accent">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Select style={{ flex: 2, minWidth: 220 }} value={denemeId} onChange={(e) => setDenemeId(e.target.value)}>
            {denemeler.map((d) => (
              <option key={d.id} value={d.id}>{d.ad} · {d.tur ?? "brans"}</option>
            ))}
          </Select>
          <div style={{ display: "flex", gap: 4, background: "rgba(15,27,45,0.05)", padding: 4, borderRadius: 10, flex: 1, minWidth: 260 }}>
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
                  background: mod === m.id ? "#E4BB60" : "transparent",
                  color: mod === m.id ? "#0F1B2D" : "rgba(15,27,45,0.5)",
                  transition: "all 0.2s ease", cursor: "pointer",
                }}
              >
                {m.etiket}
              </button>
            ))}
          </div>
        </div>
        {sorular.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 12.5, color: "rgba(15,27,45,0.5)" }}>Şablon yok — soru sayısı:</span>
            <Input
              type="number"
              min={1}
              max={200}
              value={soruSayisi}
              onChange={(e) => setSoruSayisi(e.target.value)}
              style={{ width: 80 }}
            />
          </div>
        )}
      </Card>

      {mod === "yapistir" && (
        <Card>
          <h3 className="section-title" style={{ marginBottom: 8, fontSize: 16 }}>Optik Dizi Yapıştır</h3>
          <p style={{ fontSize: 12.5, color: "rgba(15,27,45,0.5)", marginBottom: 8 }}>
            Her satır: <span className="mono">Ad Soyad; DDYYBDD…</span> (D=doğru, Y=yanlış, diğer=boş). Bir karakter bir soru.
          </p>
          <Textarea
            rows={5}
            value={pasteMetin}
            onChange={(e) => setPasteMetin(e.target.value)}
            placeholder={ORNEK}
            style={{ width: "100%", fontFamily: "var(--font-mono)" }}
          />
          <Btn onClick={yapistirVeGridiDoldur} disabled={!pasteMetin.trim()} size="sm" style={{ marginTop: 8 }}>
            Grid'e Aktar
          </Btn>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
          <h3 className="section-title" style={{ marginBottom: 0, fontSize: 16 }}>
            Cevap Gridi <span className="tabular" style={{ fontSize: 11.5, color: "rgba(15,27,45,0.5)" }}>({doluOgrenciSayisi} öğrenci dolduruldu · hücreye tıklayınca D→Y→B döner)</span>
          </h3>
          <Btn onClick={handleKaydet} disabled={kaydediliyor || doluOgrenciSayisi === 0} size="sm">
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </Btn>
        </div>

        <div style={{ overflowX: "auto", padding: "0 20px 16px" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ position: "sticky", left: 0, background: "white", zIndex: 2, textAlign: "left", padding: "6px 10px", fontSize: 12, color: "rgba(15,27,45,0.5)", borderBottom: "2px solid rgba(15,27,45,0.08)" }}>
                  Öğrenci
                </th>
                {soruNumaralari.map((n) => (
                  <th key={n} style={{ padding: "4px 2px", fontSize: 10.5, color: "rgba(15,27,45,0.5)", borderBottom: "2px solid rgba(15,27,45,0.08)", minWidth: 30 }} title={konuHaritasi.get(n)}>
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
                    <td style={{ position: "sticky", left: 0, background: "white", zIndex: 1, padding: "4px 10px", fontSize: 12.5, whiteSpace: "nowrap", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                      {o.ad_soyad}
                      <span className="tabular" style={{ marginLeft: 6, fontSize: 10.5, color: dolu === soruNumaralari.length ? "#2A9D8F" : "rgba(15,27,45,0.5)" }}>
                        {dolu}/{soruNumaralari.length}
                      </span>
                      {dolu > 0 && (
                        <button onClick={() => satiriTemizle(o.id)} style={{ marginLeft: 6, border: "none", background: "none", color: "#C4503A", fontSize: 11, cursor: "pointer" }}>
                          temizle
                        </button>
                      )}
                    </td>
                    {soruNumaralari.map((n) => {
                      const durum = satir[n];
                      return (
                        <td key={n} style={{ padding: 2, borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                          <button
                            onClick={() => hucreyiTikla(o.id, n)}
                            style={{
                              width: 26, height: 26, borderRadius: 6, border: "1px solid #e3e3e3",
                              background: durum ? HUCRENIN_RENGI[durum] : "white",
                              color: durum ? "white" : "#bbb",
                              fontWeight: 700, fontSize: 11, cursor: "pointer", transition: "all 0.12s ease",
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

        <div style={{ padding: "0 20px 16px" }}>
          {mesaj && <Badge variant="teal" >{mesaj}</Badge>}
          {hata && <Badge variant="brick" >{hata}</Badge>}
        </div>
      </Card>
    </div>
  );
}
