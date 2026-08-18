import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const kaynak = "https://yokatlas.yok.gov.tr";
const statikKaynak = "https://raw.githubusercontent.com/nejdetkadir/universities-in-turkey-api/master/db/static_data";
const statikUniversiteler = `${statikKaynak}/universities.yml`;
const statikLisansProgramlari = `${statikKaynak}/faculty_departments.yml`;
const statikOnlisansProgramlari = `${statikKaynak}/college_departments.yml`;

type ProgramTuru = "lisans" | "onlisans";

function htmlMetni(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlAttr(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .trim();
}

function programAnaSayfa(tur: ProgramTuru) {
  return `${kaynak}/${tur === "lisans" ? "lisans" : "onlisans"}-anasayfa.php`;
}

function programUniversiteSayfasi(tur: ProgramTuru, kod: string) {
  return `${kaynak}/${tur === "lisans" ? "lisans" : "onlisans"}-univ.php?u=${encodeURIComponent(kod)}`;
}

async function sayfayiGetir(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Universitely/1.0 (universite katalog servisi)" },
  });
  if (!response.ok) throw new Error(`YÖK Atlas yanıtı: ${response.status}`);
  return await response.text();
}

function universiteleriCikar(html: string) {
  const selectMatch = html.match(/<select[^>]+id=["']univ2["'][^>]*>([\s\S]*?)<\/select>/i);
  const kaynakHtml = selectMatch?.[1] ?? html;
  const liste: { kod: string; ad: string }[] = [];
  const gorulen = new Set<string>();
  const optionRegex = /<option\b[^>]*value=["']?([^"'\s>]+)["']?[^>]*>([\s\S]*?)<\/option>/gi;
  let eslesme: RegExpExecArray | null;
  while ((eslesme = optionRegex.exec(kaynakHtml)) !== null) {
    const kod = htmlAttr(eslesme[1]);
    const ad = htmlMetni(eslesme[2]);
    if (!kod || !ad || gorulen.has(kod)) continue;
    gorulen.add(kod);
    liste.push({ kod, ad });
  }
  return liste;
}

function yamlBloklariniCikar(yaml: string) {
  return yaml
    .split(/\r?\n(?=\s*-\s*(?:\S|$))/)
    .map((blok) => blok.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean);
}

function yamlDegeri(blok: string, alan: string) {
  const eslesme = blok.match(new RegExp(`^\\s*${alan}:\\s*(.*)$`, "m"));
  return eslesme?.[1]?.trim() ?? "";
}

async function statikUniversiteleriGetir() {
  const yaml = await sayfayiGetir(statikUniversiteler);
  return yamlBloklariniCikar(yaml)
    .map((blok, index) => ({ kod: `snapshot-${String(index + 1).padStart(4, "0")}`, ad: yamlDegeri(blok, "name") }))
    .filter((uni) => uni.ad);
}

async function statikProgramlariGetir(tur: ProgramTuru, universiteKodu: string) {
  const universiteler = await statikUniversiteleriGetir();
  const universite = universiteler.find((uni) => uni.kod === universiteKodu);
  if (!universite) return [];
  const yaml = await sayfayiGetir(tur === "lisans" ? statikLisansProgramlari : statikOnlisansProgramlari);
  const programlar: { kod: string; ad: string; url: string; tur: ProgramTuru; universiteKodu: string }[] = [];
  for (const [index, blok] of yamlBloklariniCikar(yaml).entries()) {
    if (yamlDegeri(blok, "university") !== universite.ad) continue;
    const ad = yamlDegeri(blok, "name");
    if (!ad) continue;
    programlar.push({
      kod: `snapshot-${universiteKodu}-${index + 1}`,
      ad,
      url: "",
      tur,
      universiteKodu,
    });
  }
  return programlar;
}

function programlariCikar(html: string, tur: ProgramTuru, universiteKodu: string) {
  const liste: { kod: string; ad: string; url: string; tur: ProgramTuru; universiteKodu: string }[] = [];
  const gorulen = new Set<string>();
  const linkRegex = /<a\b[^>]*href=["']([^"']*[?&]y=([^"'&]+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let eslesme: RegExpExecArray | null;
  while ((eslesme = linkRegex.exec(html)) !== null) {
    const url = new URL(eslesme[1], kaynak).toString();
    const kod = htmlAttr(eslesme[2]);
    const ad = htmlMetni(eslesme[3]);
    if (!kod || !ad || gorulen.has(kod)) continue;
    gorulen.add(kod);
    liste.push({ kod, ad, url, tur, universiteKodu });
  }
  return liste;
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, max-age=300",
      ...extraHeaders,
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "GET" && request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const url = new URL(request.url);
    let input: Record<string, string> = Object.fromEntries(url.searchParams.entries());
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      input = { ...input, ...body };
    }

    const isUniversiteler = input.tip === "universiteler" || !input.tip;
    const tur: ProgramTuru = input.tur === "onlisans" ? "onlisans" : "lisans";

    if (isUniversiteler) {
      try {
        const html = await sayfayiGetir(programAnaSayfa(tur));
        const universities = universiteleriCikar(html);
        if (universities.length === 0) throw new Error("YÖK Atlas üniversite listesi boş döndü.");
        return json({ source: "yok-atlas", fetchedAt: new Date().toISOString(), tur, universities });
      } catch {
        const universities = await statikUniversiteleriGetir();
        return json({ source: "community-snapshot-2021", fallback: true, fetchedAt: new Date().toISOString(), tur, universities });
      }
    }

    if (input.tip === "programlar" && input.universiteKodu) {
      try {
        const html = await sayfayiGetir(programUniversiteSayfasi(tur, input.universiteKodu));
        const programs = programlariCikar(html, tur, input.universiteKodu);
        if (programs.length === 0) throw new Error("YÖK Atlas bölüm listesi boş döndü.");
        return json({ source: "yok-atlas", fetchedAt: new Date().toISOString(), tur, programs });
      } catch {
        const programs = await statikProgramlariGetir(tur, input.universiteKodu);
        return json({ source: "community-snapshot-2021", fallback: true, fetchedAt: new Date().toISOString(), tur, programs });
      }
    }

    return json({ error: "invalid_request", message: "tip=universiteler veya tip=programlar&universiteKodu gönderilmelidir." }, 400);
  } catch (error) {
    return json({ error: "catalog_unavailable", message: error instanceof Error ? error.message : "YÖK Atlas verisi alınamadı." }, 502);
  }
});
