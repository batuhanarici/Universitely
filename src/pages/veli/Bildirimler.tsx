import { useMemo } from "react";
import BildirimMerkezi from "../BildirimMerkezi";
import { useVeliDerived } from "./veliDerived";
import type { SistemHatirlatmasi } from "../../lib/bildirimQueries";

export default function Bildirimler({ onNavigate }: { onNavigate: (p: string) => void }) {
  const d = useVeliDerived();

  const hatirlatmalar: SistemHatirlatmasi[] = useMemo(
    () =>
      d.hatirlatmalar.map((h) => ({
        baslik: h.baslik,
        detay: h.detay,
        oncelik: h.oncelik,
        hedef: "/parent/overview",
      })),
    [d]
  );

  return <BildirimMerkezi onNavigate={onNavigate} hatirlatmalar={hatirlatmalar} />;
}
