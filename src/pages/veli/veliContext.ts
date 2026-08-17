import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { Mesaj } from "../../types/database";
import type { VeliCocukVerisi } from "../../lib/veliQueries";

export const BOS_VELI_VERISI: VeliCocukVerisi = {
  ogrenci_id: null,
  cocuk_adi: "",
  profil: null,
  calismalar: [],
  gorevler: [],
  kitaplar: [],
  konuIlerlemeleri: [],
  tekrarPlanlari: [],
  gorusmeler: [],
  seansNotlari: [],
  takipMaddeleri: [],
  konular: [],
};

export interface VeliVeriValue {
  yukleniyor: boolean;
  veri: VeliCocukVerisi;
  sonuclar: Array<{
    deneme_id: string;
    ogrenci_id: string;
    soru_no: number;
    durum: "dogru" | "yanlis" | "bos";
    deneme_adi: string;
    tarih: string;
    konu_adi: string;
    ders_adi: string;
  }>;
  kocId: string | null;
  mesajlar: Mesaj[];
  setMesajlar: Dispatch<SetStateAction<Mesaj[]>>;
}

export const VeliVeriContext = createContext<VeliVeriValue>({
  yukleniyor: true,
  veri: BOS_VELI_VERISI,
  sonuclar: [],
  kocId: null,
  mesajlar: [],
  setMesajlar: () => {},
});

export function useVeliVeri() {
  return useContext(VeliVeriContext);
}
