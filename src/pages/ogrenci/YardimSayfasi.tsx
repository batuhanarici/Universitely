import YardimIcerigi from "../../components/YardimIcerigi";
import { ogrenciRehberGruplari } from "../../lib/ogrenciRehberIcerik";

export default function YardimSayfasi({ onTuruBaslat }: { onTuruBaslat?: () => void }) {
  return <YardimIcerigi gruplar={ogrenciRehberGruplari} onTuruBaslat={onTuruBaslat} />;
}
