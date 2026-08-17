import { useEffect, useMemo, useState, type ReactNode } from "react";
import { veliSonuclari, veliCocukVerisiniGetir, velininKocu, type VeliSonucSatiri, type VeliCocukVerisi } from "../../lib/veliQueries";
import { mesajlariGetir } from "../../lib/mesajQueries";
import type { Mesaj } from "../../types/database";
import { BOS_VELI_VERISI, VeliVeriContext } from "./veliContext";


export function VeliVeriProvider({ children }: { children: ReactNode }) {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [sonuclar, setSonuclar] = useState<VeliSonucSatiri[]>([]);
  const [veri, setVeri] = useState<VeliCocukVerisi>(BOS_VELI_VERISI);
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

  return <VeliVeriContext.Provider value={value}>{children}</VeliVeriContext.Provider>;
}
