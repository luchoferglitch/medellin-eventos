// api/gratis-og.js — Meta tags y contenido real para /gratis, para bots
// (GPTBot, ClaudeBot, PerplexityBot, CCBot, googlebot, bingbot, etc., filtrados
// por user-agent en vercel.json). Mismo patrón que api/categoria-og.js y
// api/barrio-og.js, adaptado a la página de gratis: a diferencia de esas dos,
// no hay diccionario de slug → nombre porque /gratis es una sola página fija,
// no una colección de páginas. Los humanos nunca pasan por aquí.

const SUPABASE_URL = "https://jtbqaqugnqkympwnfsod.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnFhcXVnbnFreW1wd25mc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODUzMzQsImV4cCI6MjA5MzA2MTMzNH0.3tHT9CVRhboFrC3pTNMMQ-i2GeEPv_nUkG4d-hPuSdc";
const DOMINIO = "https://www.medellinvibra.co";
const IMG_FALLBACK = "https://pub-c5ba255ea192436da56e91e3ef3ecfa5.r2.dev/default-fallback-medellin";

export const config = { runtime: "edge" };

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\r?\n/g, " ")
    .trim();

// Misma regla que src/priceLabel.js (esGratis) — este archivo corre en el
// runtime edge de Vercel, sin import de src/ (ver CLAUDE.md, sección SEO).
// Si esGratis cambia allá, cambia aquí también.
const esGratis = (price) => {
  const l = (price || "").toLowerCase();
  return l.startsWith("gratis") || l.startsWith("entrada libre");
};

// Umbral y copy duplicados a propósito desde src/GratisPage.jsx — mismo
// motivo que MIN_EVENTS_FOR_CATEGORY_PAGE en api/categoria-og.js. Si
// MIN_EVENTS_FOR_GRATIS_PAGE, META_DESCRIPTION o INTRO cambian allá, cambian
// aquí también.
const MIN_EVENTS_FOR_GRATIS_PAGE = 10;
const META_DESCRIPTION = "Eventos gratis en Medellín, el Área Metropolitana y el Oriente Cercano: charlas y talleres del Parque Explora, actividades del Jardín Botánico, agenda cultural de alcaldías municipales y más. Entrada libre, sin boletería.";
const INTRO = "La mitad de los eventos publicados en Medellín Vibra son gratuitos: desde la programación científica del Parque Explora y el Planetario de Medellín, hasta las actividades culturales del Jardín Botánico Joaquín Antonio Uribe y la agenda de alcaldías municipales como Marinilla. Todos con entrada libre confirmada, sin boletería de por medio.";

// Tope de eventos listados en el body — mismo criterio que api/categoria-og.js
// y api/barrio-og.js: con "representativos" alcanza para que un bot entienda
// de qué trata la página.
const MAX_EVENTOS_EN_BODY = 20;

export default async function handler(req) {
  const url = new URL(req.url);

  let shell = null;
  try {
    const shellRes = await fetch(`${url.origin}/index.html`);
    if (shellRes.ok) shell = await shellRes.text();
  } catch { /* seguimos con el fallback */ }

  const canonical = `${DOMINIO}/gratis`;

  if (!shell) return Response.redirect(DOMINIO, 302);

  let events = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?estado=eq.aprobado&select=id,title,date,place,price,image_url&order=fecha_real.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    if (Array.isArray(data)) events = data.filter((e) => esGratis(e.price));
  } catch { /* sin datos: cae al fallback de abajo */ }

  // Bajo el umbral (o sin datos): mismo criterio que GratisPage.jsx, que
  // redirige al home en vez de mostrar la página.
  if (events.length < MIN_EVENTS_FOR_GRATIS_PAGE) {
    return new Response(shell, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  const title = esc("Eventos gratis en Medellín — Medellín Vibra");
  const description = esc(META_DESCRIPTION);

  const bloque = `
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${IMG_FALLBACK}" />
  <meta property="og:image:secure_url" content="${IMG_FALLBACK}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Medellín Vibra" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${IMG_FALLBACK}" />
`;

  const listaEventos = events
    .slice(0, MAX_EVENTOS_EN_BODY)
    .map((e) => `    <li>${esc(e.title)} — ${esc(e.date || "Fecha por confirmar")} — ${esc(e.place || "Lugar por confirmar")}</li>`)
    .join("\n");

  const cuerpo = `
  <div id="root"></div>
  <main>
    <h1>Eventos gratis en Medellín</h1>
    <p>${esc(INTRO)}</p>
    <ul>
${listaEventos}
    </ul>
  </main>
`;

  const html = shell
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/<head>/i, `<head>${bloque}`)
    .replace(/<div id="root"><\/div>/i, cuerpo);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
