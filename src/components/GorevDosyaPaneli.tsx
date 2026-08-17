import { useEffect, useRef, useState } from "react";
import {
  dosyaBoyutuEtiketi,
  gorevDosyasiImzaliUrl,
  gorevDosyasiYukle,
  gorevDosyalariniGetir,
} from "../lib/gorevDosyaQueries";
import type { GorevDosyasi, GorevDosyaTuru } from "../types/database";
import { Btn } from "./ui";

interface Props {
  gorevId: string;
  ogrenciId: string;
  yuklemeTuru: GorevDosyaTuru;
}

function turEtiketi(tur: GorevDosyaTuru) {
  return tur === "kaynak" ? "Koç kaynağı" : "Öğrenci teslimi";
}

export default function GorevDosyaPaneli({ gorevId, ogrenciId, yuklemeTuru }: Props) {
  const [dosyalar, setDosyalar] = useState<GorevDosyasi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yukleniyorMu, setYukleniyorMu] = useState(false);
  const [hata, setHata] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let aktif = true;
    gorevDosyalariniGetir(gorevId)
      .then((data) => { if (aktif) setDosyalar(data); })
      .catch(() => { if (aktif) setHata("Dosyalar yüklenemedi."); })
      .finally(() => { if (aktif) setYukleniyor(false); });
    return () => { aktif = false; };
  }, [gorevId]);

  async function dosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setHata("");
    setYukleniyorMu(true);
    try {
      const yeni = await gorevDosyasiYukle(gorevId, ogrenciId, yuklemeTuru, file);
      setDosyalar((mevcut) => [yeni, ...mevcut]);
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Dosya yüklenemedi.");
    } finally {
      setYukleniyorMu(false);
    }
  }

  async function dosyayiAc(dosya: GorevDosyasi) {
    try {
      const url = await gorevDosyasiImzaliUrl(dosya.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setHata("Dosya açılamadı. Lütfen tekrar dene.");
    }
  }

  if (yukleniyor) return <span style={{ fontSize: 11, color: "rgba(15,27,45,0.4)" }}>Dosyalar yükleniyor…</span>;

  return (
    <div style={{ marginTop: 10, padding: "9px 10px", borderRadius: 7, background: "rgba(15,27,45,0.025)", border: "1px solid rgba(15,27,45,0.07)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: dosyalar.length > 0 ? 7 : 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(15,27,45,0.65)" }}>Dosyalar</span>
        <>
          <input ref={inputRef} type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.xls,.xlsx" onChange={dosyaSecildi} />
          <Btn variant="ghost" size="sm" type="button" onClick={() => inputRef.current?.click()} disabled={yukleniyorMu}>
            {yukleniyorMu ? "Yükleniyor…" : yuklemeTuru === "kaynak" ? "Kaynak yükle" : "Çözümü gönder"}
          </Btn>
        </>
      </div>
      {dosyalar.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {dosyalar.map((dosya) => (
            <button key={dosya.id} type="button" onClick={() => void dosyayiAc(dosya)} style={{ border: 0, padding: "5px 0", background: "none", display: "flex", alignItems: "center", gap: 8, textAlign: "left", cursor: "pointer", color: "#2A9D8F" }}>
              <span style={{ fontSize: 14 }}>↗</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12, color: "#16283F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dosya.dosya_adi}</span>
                <span style={{ display: "block", fontSize: 10, color: "rgba(15,27,45,0.42)" }}>{turEtiketi(dosya.tur)} · {dosyaBoyutuEtiketi(dosya.boyut)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {dosyalar.length === 0 && <p style={{ margin: 0, fontSize: 11, color: "rgba(15,27,45,0.4)" }}>Henüz dosya eklenmedi.</p>}
      {hata && <p style={{ margin: "7px 0 0", fontSize: 11, color: "#C4503A" }}>{hata}</p>}
    </div>
  );
}
