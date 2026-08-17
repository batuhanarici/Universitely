import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "unauthorized" }, 401);

    const { data: admin, error: adminError } = await serviceClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (adminError || !admin) return json({ error: "forbidden" }, 403);

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const adSoyad = typeof body.adSoyad === "string" ? body.adSoyad.trim().slice(0, 120) : "";
    if (!/^\S+@\S+\.\S+$/.test(email) || !adSoyad) {
      return json({ error: "invalid_request", message: "Geçerli bir e-posta ve koç adı gerekli." }, 400);
    }

    const { data: invited, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      data: { rol: "ogretmen", ad_soyad: adSoyad },
    });
    if (inviteError || !invited.user) {
      return json({ error: "invite_failed", message: inviteError?.message ?? "Koç daveti gönderilemedi." }, 400);
    }

    await serviceClient.from("ogretmen_profilleri").upsert({
      ogretmen_id: invited.user.id,
      ad_soyad: adSoyad,
    }, { onConflict: "ogretmen_id" });

    await serviceClient.from("admin_audit_log").insert({
      admin_id: authData.user.id,
      eylem: "koc_davet_edildi",
      hedef_id: invited.user.id,
      detay: { email, ad_soyad: adSoyad },
    });

    return json({ ok: true, userId: invited.user.id, email });
  } catch (error) {
    return json({ error: "server_error", message: error instanceof Error ? error.message : "Koç daveti sırasında hata oluştu." }, 500);
  }
});
