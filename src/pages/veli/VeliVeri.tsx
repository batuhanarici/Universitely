import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { veliSonuclari, veliCocukVerisiniGetir, velininKocu, type VeliSonucSatiri, type VeliCocukVerisi } from "../../lib/veliQueries";
import { mesajlariGetir } from "../../lib/mesajQueries";
import type { Mesaj } from "../../types/database";

const BOS_VERI: VeliCocukVerisi = {
  ogrenci_id: null,
  cocuk_adi: "",
  profil: null,
  calismalar: [],
  gorevler: [],
  kitaplar: [],
  konuIlerlemeleri: [],
  tekrarPlanlari: [],
  gorusmeler: [],
  konular: [],
};

interface VeliVeriValue {
  yukleniyor: boolean;
  veri: VeliCocukVerisi;
  sonuclar: VeliSonucSatiri[];
  kocId: string | null;
  mesajlar: Mesaj[];
  setMesajlar: Dispatch<SetStateAction<Mesaj[]>>;
}

const Ctx = createContext<VeliVeriValue>({
  yukleniyor: true,
  veri: BOS_VERI,
  sonuclar: [],
  kocId: null,
  mesajlar: [],
  setMesajlar: () => {},
});

export function VeliVeriProvider({ children }: { children: ReactNode }) {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [sonuclar, setSonuclar] = useState<VeliSonucSatiri[]>([]);
  const [veri, setVeri] = useState<VeliCocukVerisi>(BOS_VERI);
  const [kocId, setKocId] = useState<string | null>(null);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);

  useEffect(() => {
    Promise.all([veliSonuclari(), veliCocukVerisiniGetir(), velininKocu(), mesajlariGetir()])
      .then(([s, v, k, m]) => {
        setSonuclar(s);
        setVeri(v);
        setKocId(k);
        setMesajlar(m);
      })
      .catch(() => {})
      .finally(() => setYukleniyor(false));
  }, []);

  const value = useMemo(
    () => ({ yukleniyor, veri, sonuclar, kocId, mesajlar, setMesajlar }),
    [yukleniyor, veri, sonuclar, kocId, mesajlar]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVeliVeri(): VeliVeriValue {
  return useContext(Ctx);
}
