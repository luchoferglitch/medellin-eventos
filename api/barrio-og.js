// api/barrio-og.js — Meta tags y contenido real por barrio, para bots
// (GPTBot, ClaudeBot, PerplexityBot, CCBot, googlebot, bingbot, etc., filtrados
// por user-agent en vercel.json). Mismo patrón que api/categoria-og.js, adaptado
// a la página de barrio: nombre, descripción (la misma que ya usa la SPA
// para SEO, ver BARRIO_CONTENT en src/BarrioPage.jsx) y eventos representativos.
// Los humanos nunca pasan por aquí.

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

const slugify = (str) =>
  str?.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";

// Umbral y copy duplicados a propósito desde src/BarrioPage.jsx — este archivo
// corre en el runtime edge de Vercel, sin import de src/ (ver CLAUDE.md, sección
// SEO). Si BARRIO_CONTENT o MIN_EVENTS_FOR_BARRIO_PAGE cambian allá, cambian
// aquí también.
const MIN_EVENTS_FOR_BARRIO_PAGE = 15;

const BARRIO_CONTENT = {
  "El Poblado": {
    heading: "Planes en El Poblado",
    metaDescription: "Agenda de eventos en El Poblado, Medellín: comedia en Teatro Acción Impro y Mero Bar, shows en Teatro El Tesoro, música en vivo en Trilogía Bar. Filtra por fecha y precio.",
    intro: "La agenda de El Poblado: comedia y stand-up en Teatro Acción Impro y Mero Bar, música en vivo en Trilogía Bar, funciones en Teatro El Tesoro y charlas o eventos corporativos en espacios como el Auditorio La Enseñanza. Filtra por fecha o precio para ver qué hay esta semana cerca de ti.",
  },
};

const SLUG_TO_BARRIO = Object.fromEntries(
  Object.keys(BARRIO_CONTENT).map((b) => [slugify(b), b])
);

// Tope de eventos listados en el body — mismo criterio y mismo número que
// api/categoria-og.js: con "representativos" alcanza para que un bot entienda
// de qué trata la página.
const MAX_EVENTOS_EN_BODY = 20;

export default async function handler(req) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") || url.pathname.replace(/^\/(api\/barrio-og|barrio)\/?/, "");

  let shell = null;
  try {
    const shellRes = await fetch(`${url.origin}/index.html`);
    if (shellRes.ok) shell = await shellRes.text();
  } catch { /* seguimos con el fallback */ }

  const canonical = `${DOMINIO}/barrio/${slug}`;

  if (!shell) return Response.redirect(DOMINIO, 302);

  const barrioName = SLUG_TO_BARRIO[slug];

  // Sin barrio calificado para este slug: servir el shell tal cual (igual
  // que BarrioPage.jsx redirige al home si el slug no existe o no llega
  // al umbral de eventos).
  if (!barrioName) {
    return new Response(shell, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  let events = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?estado=eq.aprobado&barrio=eq.${encodeURIComponent(barrioName)}&select=id,title,date,place&order=fecha_real.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    if (Array.isArray(data)) events = data;
  } catch { /* sin datos: cae al fallback de abajo */ }

  // Barrio que hoy no llega al umbral (o cayó por debajo): mismo criterio
  // que la SPA, no se genera contenido propio.
  if (events.length < MIN_EVENTS_FOR_BARRIO_PAGE) {
    return new Response(shell, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  const content = BARRIO_CONTENT[barrioName];
  const title = esc(`${content.heading} — Medellín Vibra`);
  const description = esc(content.metaDescription);

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
    <h1>${esc(content.heading)}</h1>
    <p>${esc(content.intro)}</p>
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
