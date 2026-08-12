import YardimIcerigi from "../../components/YardimIcerigi";
import { veliRehberGruplari } from "../../lib/veliRehberIcerik";

export default function YardimSayfasi({ onTuruBaslat }: { onTuruBaslat?: () => void }) {
  return <YardimIcerigi gruplar={veliRehberGruplari} onTuruBaslat={onTuruBaslat} />;
}
