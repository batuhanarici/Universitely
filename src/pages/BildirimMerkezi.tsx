import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import BildirimSatiri from "../components/BildirimSatiri";
import {
  bildirimleriGetir,
  bildirimOkunduYap,
  bildirimArsivle,
  bildirimSil,
  bildirimleriDinle,
  ogrenciHatirlatmalariniHesapla,
  sistemHatirlatmalariniSenkronla,
  type SistemHatirlatmasi,
} from "../lib/bildirimQueries";
import type { Bildirim } from "../types/database";
import { Card, EmptyState, Tabs } from "../components/ui";

type Sekme = "okunmamis" | "tumu" | "arsiv";

export default function BildirimMerkezi({ onNavigate, hatirlatmalar }: {
  onNavigate: (p: string) => void;
  hatirlatmalar?: SistemHatirlatmasi[];
}) {
  const { session, ogrenciMi } = useAuth();
  const [sekme, setSekme] = useState<Sekme>("okunmamis");
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const uid = session?.user.id;

  const yenile = useCallback(async () => {
    try {
      const l = await bildirimleriGetir();
      setBildirimler(l);
    } catch {
      // sessiz
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    if (!uid) return;
    let iptal = false;
    (async () => {
      await yenile();
      let kaynak: SistemHatirlatmasi[] = hatirlatmalar ?? [];
      if (hatirlatmalar === undefined && ogrenciMi) {
        kaynak = await ogrenciHatirlatmalariniHesapla();
      }
      if (kaynak.length > 0) {
        await sistemHatirlatmalariniSenkronla(kaynak);
        if (!iptal) await yenile();
      }
    })();
    return () => {
      iptal = true;
    };
  }, [uid, ogrenciMi, hatirlatmalar, yenile]);

  useEffect(() => {
    if (!uid) return;
    const kanal = bildirimleriDinle(
      uid,
      (b) => setBildirimler((l) => [b, ...l.filter((x) => x.id !== b.id)]),
      (b) => setBildirimler((l) => l.map((x) => (x.id === b.id ? b : x))),
      `bildirimler-realtime-merkez-${uid}`
    );
    return () => {
      supabase.removeChannel(kanal);
    };
  }, [uid]);

  function tikla(b: Bildirim) {
    if (!b.okundu) {
      setBildirimler((l) => l.map((x) => (x.id === b.id ? { ...x, okundu: true } : x)));
      bildirimOkunduYap(b.id).catch(() => {});
    }
    if (b.hedef) onNavigate(b.hedef);
  }

  function arsivle(b: Bildirim) {
    setBildirimler((l) => l.map((x) => (x.id === b.id ? { ...x, arsivlendi: !x.arsivlendi } : x)));
    bildirimArsivle(b.id).catch(() => {});
  }

  function sil(b: Bildirim) {
    setBildirimler((l) => l.filter((x) => x.id !== b.id));
    bildirimSil(b.id).catch(() => {});
  }

  const filtrelenenler = bildirimler
    .filter((b) => {
      if (sekme === "arsiv") return b.arsivlendi;
      if (sekme === "okunmamis") return !b.arsivlendi && !b.okundu;
      return !b.arsivlendi;
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const okunmamisSayi = bildirimler.filter((b) => !b.okundu && !b.arsivlendi).length;
  const arsivSayi = bildirimler.filter((b) => b.arsivlendi).length;

  return (
    <div className="anim-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="page-title">Bildirimler</h1>
        <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 14, marginTop: 4 }}>
          Mesajlar, duyurular ve hatırlatmalar
        </p>
      </div>

      <Tabs
        active={sekme}
        onChange={(t) => setSekme(t as Sekme)}
        tabs={[
          { label: `Okunmamış (${okunmamisSayi})`, value: "okunmamis" },
          { label: `Tümü (${bildirimler.filter((b) => !b.arsivlendi).length})`, value: "tumu" },
          { label: `Arşiv (${arsivSayi})`, value: "arsiv" },
        ]}
      />

      {yukleniyor ? (
        <Card>
          <p style={{ color: "rgba(15,27,45,0.5)", fontSize: 13 }}>Yükleniyor…</p>
        </Card>
      ) : filtrelenenler.length === 0 ? (
        <Card>
          <EmptyState icon="🔔" title="Bildirim yok" desc="Bu sekmede gösterilecek bildirim bulunmuyor." />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtrelenenler.map((b) => (
            <Card key={b.id} className="tape-accent" style={{ padding: 0, overflow: "hidden" }}>
              <BildirimSatiri
                bildirim={b}
                onAc={() => tikla(b)}
                onOkundu={b.okundu ? undefined : () => okunduYap(b)}
                onArsivle={() => arsivle(b)}
                onSil={() => sil(b)}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  function okunduYap(b: Bildirim) {
    setBildirimler((l) => l.map((x) => (x.id === b.id ? { ...x, okundu: true } : x)));
    bildirimOkunduYap(b.id).catch(() => {});
  }
}
