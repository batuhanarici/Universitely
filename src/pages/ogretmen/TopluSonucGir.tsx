import { useToast } from "../../components/useToast";
import { useEffect, useMemo, useState } from "react";
import type { Ogrenci } from "../../types/database";
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
import { denemeAksiyonTaslagiOlustur } from "../../lib/denemeAksiyonQueries";
import { DenemeAksiyonKocPaneli } from "../../components/DenemeAksiyonPaneli";
import { Card, Select, Input, Textarea, Btn, Badge, Tabs, Label, FormGroup } from "../../components/ui";

type DenemeDetayli = Deneme & { sablon_adi: string };
type Mod = "grid" | "yapistir";
type Cell = "dogru" | "yanlis" | "bos";

const SIRADAKI: Record<Cell, Cell | null> = { dogru: "yanlis", yanlis: "bos", bos: null };

const COLORS: Record<Cell, string> = {
  dogru: "#2A9D8F",
  yanlis: "#C4503A",
  bos: "#9A9FA8",
};

const ORNEK = `Ayşe Yılmaz;DDYYBDDBDDY
Mehmet Kaya;DYBDYBBDDDY
Zeynep Demir;DBYDDBYDBD`;

export default function TopluSonucGir() {
  const { toast, show } = useToast();
  const [denemeler, setDenemeler] = useState<DenemeDetayli[]>([]);
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [denemeId, setDenemeId] = useState("");
  const [sorular, setSorular] = useState<SablonSorusuDetayli[]>([]);
  const [soruSayisi, setSoruSayisi] = useState("40");
  const [mod, setMod] = useState<Mod>("grid");
  const [grid, setGrid] = useState<Record<string, Record<number, Cell>>>({});
  const [pasteMetin, setPasteMetin] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [aksiyonYenileme, setAksiyonYenileme] = useState(0);

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
        const g: Record<string, Record<number, Cell>> = {};
        for (const s of satirlar) {
          if (!g[s.ogrenci_id]) g[s.ogrenci_id] = {};
          g[s.ogrenci_id][s.soru_no] = s.durum as Cell;
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

  function cycleCell(ogrenciId: string, soruNo: number) {
    setGrid((g) => {
      const satir = { ...(g[ogrenciId] ?? {}) };
      const mevcut = satir[soruNo];
      if (mevcut === undefined) satir[soruNo] = "dogru";
      else if (SIRADAKI[mevcut] === null) delete satir[soruNo];
      else satir[soruNo] = SIRADAKI[mevcut]!;
      return { ...g, [ogrenciId]: satir };
    });
  }

  function clearRow(ogrenciId: string) {
    setGrid((g) => {
      const yeni = { ...g };
      delete yeni[ogrenciId];
      return yeni;
    });
  }

  function parseAndImport() {
    setErrors([]);
    setMesaj("");
    setHata("");
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
        const satirDurum: Record<number, Cell> = {};
        const sorus = dizi.replace(/\s+/g, "").toUpperCase();
        for (let i = 0; i < sorus.length; i++) {
          const c = sorus[i];
          satirDurum[i + 1] = c === "D" ? "dogru" : c === "Y" ? "yanlis" : "bos";
        }
        yeni[ogr.id] = satirDurum;
      }
      return yeni;
    });
    const satirSayisi = pasteMetin.split("\n").filter((s) => s.trim()).length;
    if (eslesmeyen.length === 0 && satirSayisi > 0) {
      show(`${satirSayisi} öğrenci aktarıldı ✓`);
    }
    setErrors(eslesmeyen);
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
      const aksiyonSonuclari = await Promise.allSettled(girdi.map((satir) => denemeAksiyonTaslagiOlustur(denemeId, satir.ogrenci_id)));
      const aksiyonHatasi = aksiyonSonuclari.some((sonuc) => sonuc.status === "rejected");
      setMesaj(`${girdi.length} öğrenci kaydedildi.${eksikler.length ? ` Eksik bırakıldı: ${eksikler.join(", ")}` : ""}${aksiyonHatasi ? " Bazı aksiyon taslakları oluşturulamadı." : " Aksiyon taslakları koç incelemesine hazır."}`);
      setAksiyonYenileme((anahtar) => anahtar + 1);
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
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 className="page-title">Toplu Sonuç Gir</h1>
        <Card><p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)" }}>Önce bir deneme oluşturman lazım.</p></Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast}
      <div>
        <h1 className="page-title">Toplu Sonuç Gir</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>Grid veya kopyala-yapıştır ile toplu cevap girişi</p>
      </div>

      <Card style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <FormGroup style={{ minWidth: 200 }}>
            <Label>Deneme</Label>
            <Select value={denemeId} onChange={(e) => setDenemeId(e.target.value)}>
              {denemeler.map((d) => (
                <option key={d.id} value={d.id}>{d.ad} · {d.tur ?? "brans"}</option>
              ))}
            </Select>
          </FormGroup>
          {sorular.length === 0 && (
            <FormGroup style={{ minWidth: 100 }}>
              <Label>Soru Sayısı</Label>
              <Input type="number" min={1} max={200} value={soruSayisi} onChange={(e) => setSoruSayisi(e.target.value)} style={{ width: 100 }} />
            </FormGroup>
          )}
        </div>
      </Card>

      <Card>
        <Tabs tabs={["Sınıf Grid", "Kopyala-Yapıştır"]} active={mod === "grid" ? "Sınıf Grid" : "Kopyala-Yapıştır"} onChange={(t) => setMod(t === "Sınıf Grid" ? "grid" : "yapistir")} />
        <div style={{ marginTop: 16 }}>
          {mod === "grid" ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", minWidth: Math.max(600, soruNumaralari.length * 28 + 200) }}>
                <thead>
                  <tr>
                    <th style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, textAlign: "left", padding: "6px 12px", position: "sticky", left: 0, background: "#FDFBF7" }}>Öğrenci</th>
                    {soruNumaralari.map((n) => (
                      <th key={n} title={konuHaritasi.get(n)} style={{ fontSize: 10, color: "rgba(15,27,45,0.35)", fontWeight: 700, padding: "6px 4px", minWidth: 24, textAlign: "center" }}>{n}</th>
                    ))}
                    <th style={{ fontSize: 11, color: "rgba(15,27,45,0.4)", fontWeight: 700, padding: "6px 8px" }}>Dolu</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ogrenciler.map((o) => {
                    const satir = grid[o.id] ?? {};
                    const filled = soruNumaralari.filter((n) => satir[n] !== undefined).length;
                    return (
                      <tr key={o.id}>
                        <td style={{ fontSize: 13, fontWeight: 500, padding: "6px 12px", whiteSpace: "nowrap", position: "sticky", left: 0, background: "#FDFBF7", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>{o.ad_soyad}</td>
                        {soruNumaralari.map((n) => {
                          const cell = satir[n];
                          return (
                            <td key={n} style={{ padding: "3px 2px", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                              <div
                                onClick={() => cycleCell(o.id, n)}
                                title={konuHaritasi.get(n)}
                                style={{
                                  width: 20, height: 20, borderRadius: 4, cursor: "pointer",
                                  background: cell ? `${COLORS[cell]}20` : "rgba(15,27,45,0.04)",
                                  border: `1px solid ${cell ? COLORS[cell] : "rgba(15,27,45,0.12)"}`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 9, fontWeight: 700, color: cell ? COLORS[cell] : "rgba(15,27,45,0.2)",
                                }}
                              >
                                {cell === "dogru" ? "D" : cell === "yanlis" ? "Y" : cell === "bos" ? "B" : ""}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: "6px 8px", fontSize: 12, fontWeight: 600, color: filled === soruNumaralari.length ? "#2A9D8F" : "rgba(15,27,45,0.5)", borderBottom: "1px solid rgba(15,27,45,0.06)" }}>{filled}/{soruNumaralari.length}</td>
                        <td style={{ borderBottom: "1px solid rgba(15,27,45,0.06)" }}>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => clearRow(o.id)}>Temizle</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 13, color: "rgba(15,27,45,0.6)" }}>
                Her satır: <code style={{ background: "rgba(15,27,45,0.07)", padding: "2px 6px", borderRadius: 4 }}>Ad Soyad;DDYYBDD…</code> (D=doğru, Y=yanlış, diğer=boş)
              </p>
              <Textarea
                placeholder={ORNEK}
                value={pasteMetin}
                onChange={(e) => setPasteMetin(e.target.value)}
                style={{ minHeight: 160, fontFamily: "var(--font-mono)", fontSize: 12 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost" size="sm" onClick={parseAndImport} disabled={!pasteMetin.trim()}>Grid'e Aktar</Btn>
              </div>
              {errors.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {errors.map((e, i) => (
                    <p key={i} style={{ fontSize: 12, color: "#C4503A" }}>{`Eşleşmeyen satır: "${e}"`}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {mesaj && <Badge variant="teal">{mesaj}</Badge>}
              {hata && <Badge variant="brick">{hata}</Badge>}
            </div>
            <Btn variant="primary" size="sm" onClick={handleKaydet} disabled={kaydediliyor || doluOgrenciSayisi === 0}>
              {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
            </Btn>
          </div>
        </div>
      </Card>

      <DenemeAksiyonKocPaneli denemeId={denemeId} ogrenciler={ogrenciler} yenilemeAnahtari={aksiyonYenileme} />
    </div>
  );
}
