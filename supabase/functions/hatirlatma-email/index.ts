import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const from = Deno.env.get("EMAIL_FROM") ?? "Universitely <onboarding@resend.dev>";

function bugunIso(): string {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (_req) => {
  try {
    if (!resendApiKey) {
      return json({ hata: "RESEND_API_KEY ayarlanmamis" }, 500);
    }
    const resend = new Resend(resendApiKey);

    const { data: profiller, error: pErr } = await supabase
      .from("ogrenci_profilleri")
      .select("ogrenci_id")
      .eq("email_bildirim", true);
    if (pErr) throw pErr;

    const ogrenciIds = (profiller ?? []).map((p) => p.ogrenci_id);
    if (ogrenciIds.length === 0) return json({ mesaj: "bildirim acik ogrenci yok" });

    const { data: hesaplar } = await supabase.auth.admin.listUsers();
    const emailMap = new Map<string, string>();
    for (const u of hesaplar?.users ?? []) {
      if (u.email) emailMap.set(u.id, u.email);
    }

    const bugun = bugunIso();
    let gonderilen = 0;

    for (const id of ogrenciIds) {
      const email = emailMap.get(id);
      if (!email) continue;

      const [gorevler, tekrarlar, yanlislar, kitaplar, isim] = await Promise.all([
        supabase.from("gorevler").select("baslik").eq("ogrenci_id", id).eq("tarih", bugun).eq("tamamlandi", false).limit(10),
        supabase.from("tekrar_planlari").select("aciklama").eq("ogrenci_id", id).eq("plan_tarihi", bugun).eq("yapildi", false).limit(10),
        supabase.from("yanlis_arsivi").select("id", { count: "exact", head: true }).eq("ogrenci_id", id).eq("cozuldu", false),
        supabase.from("kitaplar").select("ad, ilerleme, toplam").eq("ogrenci_id", id).lte("bitis_hedefi", bugun).gt("ilerleme", 0).limit(5),
        supabase.from("ogrenciler").select("ad_soyad").eq("id", id).single(),
      ]);

      const maddeler: string[] = [];
      if ((gorevler.data?.length ?? 0) > 0) {
        maddeler.push(`📌 Bugünün görevleri: ${(gorevler.data ?? []).map((g) => g.baslik).join(", ")}`);
      }
      if ((tekrarlar.data?.length ?? 0) > 0) {
        maddeler.push(`🔁 Bugün yapılacak tekrarlar: ${(tekrarlar.data ?? []).map((t) => t.aciklama).join(", ")}`);
      }
      if ((yanlislar.count ?? 0) > 0) {
        maddeler.push(`❌ Çözülmemiş ${yanlislar.count} yanlışın var — bugün 2 tanesini çözerek başlayabilirsin.`);
      }
      for (const k of kitaplar.data ?? []) {
        maddeler.push(`📖 "${k.ad}" kaynağının bitiş hedefi geçti (kalan ${k.toplam - k.ilerleme}).`);
      }
      if (maddeler.length === 0) continue;

      const ad = isim.data?.ad_soyad ?? "Öğrenci";
      const html = `
        <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#2c3a52;">
          <div style="border-bottom:3px solid #e4bb60;padding-bottom:10px;margin-bottom:16px;">
            <strong style="font-size:18px;">ÜNİVERSİTELY</strong>
          </div>
          <p>Merhaba ${ad},</p>
          <p>Bugün sana hatırlatacaklarım:</p>
          <ul style="line-height:1.8;">${maddeler.map((m) => `<li>${m}</li>`).join("")}</ul>
          <p style="color:#888;font-size:13px;">Planın uygulamada seni bekliyor — küçük adımlarla devam!</p>
        </div>`;

      await resend.emails.send({
        from,
        to: [email],
        subject: "Üniversitely · Bugünün hatırlatmaları",
        html,
      });
      gonderilen++;
    }

    return json({ mesaj: "tamamlandi", gonderilen });
  } catch (err) {
    return json({ hata: String(err) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
