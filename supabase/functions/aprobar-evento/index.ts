const SECRET = Deno.env.get("APROBAR_EVENTO_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_URL = "https://www.medellinvibra.co";

async function sign(id: string, action: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${id}:${action}`));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// La página de confirmación vive en el sitio (Vercel), no acá: las respuestas GET de
// Supabase Edge Functions llegan al navegador forzadas a Content-Type: text/plain a nivel
// de gateway (Cloudflare) sin importar qué header ponga esta función — eso rompía el
// acento/emoji de la página de confirmación (mojibake tipo "MedellÃ­n"). Redirigir a una
// ruta real del sitio evita el problema de raíz en vez de parchear el síntoma.
function redirect(params: Record<string, string>): Response {
  const url = new URL(`${SITE_URL}/admin/aprobacion-evento`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return Response.redirect(url.toString(), 302);
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const action = url.searchParams.get("action");
  const token = url.searchParams.get("token");

  if (!id || !action || !token || !["aprobado", "rechazado"].includes(action)) {
    return redirect({ error: "invalido" });
  }

  const expected = await sign(id, action);
  if (expected !== token) {
    return redirect({ error: "invalido" });
  }

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({ estado: action }),
  });

  if (!resp.ok) {
    return redirect({ error: "servidor" });
  }
  const rows = await resp.json();
  const eventTitle = rows?.[0]?.title ?? `Evento #${id}`;

  return redirect({ estado: action, titulo: eventTitle });
});
