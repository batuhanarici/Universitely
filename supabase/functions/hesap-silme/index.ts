import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Hedef kullanıcıya ait verileri (cascade'e güvenmeden) temizler.
async function temizle(hedefId: string) {
  const ogrenciOdan: string[] = [
    "calisma_kayitlari",
    "yanlis_arsivi",
    "tekrar_planlari",
    "kitaplar",
    "konu_ilerlemeleri",
    "sonuclar",
    "ogrenci_profilleri",
    "koc_notlari",
    "gorusmeler",
    "odemeler",
  ];
  for (const t of ogrenciOdan) {
    try {
      await supabase.from(t).delete().eq("ogrenci_id", hedefId);
    } catch {
      // tablo yoksa/izin yoksa geç
    }
  }

  try {
    await supabase.from("gorevler").update({ atayan_id: null }).eq("atayan_id", hedefId);
  } catch {}
  try {
    await supabase.from("gorevler").delete().eq("ogrenci_id", hedefId);
  } catch {}
  try {
    await supabase.from("veliler").delete().eq("ogrenci_id", hedefId);
  } catch {}
  try {
    await supabase.from("veliler").delete().eq("id", hedefId);
  } catch {}
  try {
    await supabase.from("ogretmen_profilleri").delete().eq("ogretmen_id", hedefId);
  } catch {}
  try {
    await supabase.from("davet_kodlari").delete().eq("olusturan_id", hedefId);
  } catch {}
  try {
    await supabase
      .from("mesajlar")
      .delete()
      .or(`gonderici_id.eq.${hedefId},alici_id.eq.${hedefId}`);
  } catch {}
  try {
    await supabase.from("bildirimler").delete().eq("alici_id", hedefId);
  } catch {}
  try {
    await supabase.from("bildirimler").delete().eq("gonderici_id", hedefId);
  } catch {}
  try {
    await supabase.from("hesap_silme_talepleri").delete().eq("kullanici_id", hedefId);
  } catch {}
  try {
    await supabase.from("ogrenciler").update({ ogretmen_id: null }).eq("ogretmen_id", hedefId);
  } catch {}
  try {
    await supabase.from("ogrenciler").delete().eq("id", hedefId);
  } catch {}
  try {
    await supabase.storage.from("avatars").remove([`${hedefId}/avatar`]);
  } catch {}
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ hata: "Yetkisiz." }, 401);

    const body = await req.json();
    const tur = body.tur as string;
    const hedefId = body.hedef_id as string | undefined;
    const talepId = body.talep_id as string | undefined;
    const onayEmail = ((body.onay_email as string) ?? "").trim().toLowerCase();

    if (!onayEmail || onayEmail !== (user.email ?? "").toLowerCase()) {
      return json({ hata: "E-posta doğrulaması eşleşmiyor." }, 403);
    }

    let hedef = user.id;

    if (tur === "ogrenci") {
      if (!hedefId || !talepId) return json({ hata: "hedef_id ve talep_id gerekli." }, 400);
      const { data: ogr } = await supabase
        .from("ogrenciler")
        .select("id")
        .eq("id", hedefId)
        .eq("ogretmen_id", user.id)
        .maybeSingle();
      if (!ogr) return json({ hata: "Bu öğrencinin koçu değilsiniz." }, 403);
      const { data: talep } = await supabase
        .from("hesap_silme_talepleri")
        .select("id, durum")
        .eq("id", talepId)
        .eq("kullanici_id", hedefId)
        .in("durum", ["bekliyor", "onaylandi"])
        .maybeSingle();
      if (!talep) return json({ hata: "Onay bekleyen talep bulunamadı." }, 400);
      if (talep.durum === "bekliyor") {
        const { error: guncelleHata } = await supabase
          .from("hesap_silme_talepleri")
          .update({ durum: "onaylandi", onaylayan_id: user.id, updated_at: new Date().toISOString() })
          .eq("id", talepId);
        if (guncelleHata) throw guncelleHata;
      }
      hedef = hedefId;
    } else if (tur === "veli") {
      const meta = user.user_metadata?.rol as string | undefined;
      if (meta !== "veli") {
        const { data: v } = await supabase
          .from("veliler")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        if (!v) return json({ hata: "Veli hesabı bulunamadı." }, 403);
      }
    } else if (tur === "ogretmen") {
      const { data: o } = await supabase
        .from("ogretmen_profilleri")
        .select("ogretmen_id")
        .eq("ogretmen_id", user.id)
        .maybeSingle();
      if (!o) return json({ hata: "Koç hesabı bulunamadı." }, 403);
    } else {
      return json({ hata: "Geçersiz tur." }, 400);
    }

    await temizle(hedef);

    if (tur === "ogrenci" && talepId) {
      try {
        await supabase.from("bildirimler").delete().eq("ilgili_id", talepId);
      } catch {}
    }

    const { error } = await supabase.auth.admin.deleteUser(hedef);
    if (error) {
      console.error("hesap-silme deleteUser hatasi:", JSON.stringify(error));
      throw error;
    }

    return json({ basarili: true });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : "Bilinmeyen hata";
    console.error("hesap-silme hata:", mesaj);
    return json({ hata: mesaj }, 500);
  }
});
