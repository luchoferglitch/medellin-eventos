// api/organizador-og.js — Meta tags y contenido real por organizador, para bots
// (GPTBot, ClaudeBot, PerplexityBot, CCBot, googlebot, bingbot, etc., filtrados
// por user-agent en vercel.json). Mismo patrón que api/og.js (evento), adaptado
// a la página de organizador: nombre, descripción y su lista de eventos.
// Los humanos nunca pasan por aquí.

const SUPABASE_URL = "https://jtbqaqugnqkympwnfsod.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnFhcXVnbnFreW1wd25mc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODUzMzQsImV4cCI6MjA5MzA2MTMzNH0.3tHT9CVRhboFrC3pTNMMQ-i2GeEPv_nUkG4d-hPuSdc";
const DOMINIO = "https://www.medellinvibra.co";

export const config = { runtime: "edge" };

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\r?\n/g, " ")
    .trim();

// Igual slugify que src/OrganizadorPage.jsx y api/sitemap.js — este archivo
// corre en el runtime edge de Vercel, sin import de src/, así que se duplica
// a propósito (mismo criterio ya documentado en api/sitemap.js).
const slugify = (str) =>
  str?.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";

export default async function handler(req) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") || url.pathname.replace(/^\/(api\/organizador-og|organizador)\/?/, "");

  // 1. Traer el shell real de la SPA
  let shell = null;
  try {
    const shellRes = await fetch(`${url.origin}/index.html`);
    if (shellRes.ok) shell = await shellRes.text();
  } catch { /* seguimos con el fallback */ }

  const canonical = `${DOMINIO}/organizador/${slug}`;

  if (!shell) return Response.redirect(DOMINIO, 302);

  // 2. Traer eventos del organizador — mismo criterio que OrganizadorPage.jsx:
  // aprobados + archivados (para no perder el historial de un organizador cuyo
  // único evento ya pasó), filtrado por slug en JS porque el nombre real del
  // organizador no está normalizado a slug en la base.
  let events = [];
  let organizerName = "";
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?estado=in.(aprobado,archivado)&organizer_name=not.is.null&select=id,title,date,fecha_real,fecha_fin,organizer_name&order=fecha_real.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    if (Array.isArray(data)) {
      events = data.filter((e) => e.organizer_name && slugify(e.organizer_name) === slug);
      if (events.length > 0) organizerName = events[0].organizer_name;
    }
  } catch { /* sin datos: cae al fallback de abajo */ }

  // 3. Sin organizador con ese slug: servir el shell tal cual (igual que
  // OrganizadorPage.jsx redirige al home cuando no hay eventos con ese slug).
  if (!organizerName) {
    return new Response(shell, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  const title = esc(`${organizerName} — Medellín Vibra`);
  const description = esc(
    events.length === 1
      ? `Eventos de ${organizerName} en Medellín — agenda cultural de Medellín Vibra. 1 evento publicado.`
      : `Eventos de ${organizerName} en Medellín — agenda cultural de Medellín Vibra. ${events.length} eventos publicados.`
  );

  const bloque = `
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Medellín Vibra" />
`;

  // Lista de eventos del organizador — solo título + fecha, suficiente para
  // que un bot entienda qué organiza esta entidad (no se piden más campos).
  const listaEventos = events
    .map((e) => `    <li>${esc(e.title)} — ${esc(e.date || e.fecha_real || "Fecha por confirmar")}</li>`)
    .join("\n");

  const cuerpo = `
  <div id="root"></div>
  <main>
    <h1>${esc(organizerName)}</h1>
    <p>${description}</p>
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
