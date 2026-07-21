// api/og.js — Meta tags dinámicos por evento (WhatsApp, Facebook, Twitter, Google)
// Los bots (filtrados por user-agent en vercel.json) reciben el index.html real
// del sitio con los meta tags del evento inyectados. Los humanos nunca pasan por aquí.

const SUPABASE_URL = "https://jtbqaqugnqkympwnfsod.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnFhcXVnbnFreW1wd25mc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODUzMzQsImV4cCI6MjA5MzA2MTMzNH0.3tHT9CVRhboFrC3pTNMMQ-i2GeEPv_nUkG4d-hPuSdc";
const DOMINIO = "https://www.medellinvibra.co";
const IMAGEN_DEFAULT = "https://pub-c5ba255ea192436da56e91e3ef3ecfa5.r2.dev/default-fallback-medellin";

export const config = { runtime: "edge" };

// Escapa caracteres que romperían los atributos HTML (títulos con comillas, etc.)
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\r?\n/g, " ")
    .trim();

function slugToId(slug) {
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  return /^\d+$/.test(last) ? last : null;
}

export default async function handler(req) {
  const url = new URL(req.url);
  // El slug llega como query param tras el rewrite; el pathname queda de respaldo
  const slug = url.searchParams.get("slug") || url.pathname.replace(/^\/(api\/og|evento)\/?/, "");
  const id = slugToId(slug);

  // 1. Traer el shell real de la SPA (index.html del deployment actual)
  let shell = null;
  try {
    const shellRes = await fetch(`${url.origin}/index.html`);
    if (shellRes.ok) shell = await shellRes.text();
  } catch { /* seguimos con el fallback */ }

  // 2. Consultar el evento en Supabase
  let event = null;
  if (id) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/events?id=eq.${id}&estado=eq.aprobado&select=title,description,image_url,place,date,time,price,category,fecha_real,fecha_fin,organizer_name&limit=1`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const data = await res.json();
      event = Array.isArray(data) ? data[0] || null : null;
    } catch { /* meta tags genéricos */ }
  }

  const canonical = `${DOMINIO}/evento/${slug}`;

  // 3. Sin shell no hay nada que inyectar: redirigir al sitio normal
  if (!shell) {
    return Response.redirect(event ? canonical : DOMINIO, 302);
  }

  // 4. Sin evento: servir el shell tal cual (meta tags genéricos del sitio)
  if (!event) {
    return new Response(shell, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  // 5. Construir los meta tags del evento
  const title = esc(`${event.title} — Medellín Vibra`);
  const description = esc(
    event.description?.slice(0, 155) ||
    `${event.category} en ${event.place} · ${event.date} · ${event.price}`
  );
  const image = esc(event.image_url || IMAGEN_DEFAULT);

  // JSON-LD server-side: el carrusel de eventos de Google sin depender de JS
  const jsonLd = event.fecha_real
    ? `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        startDate: event.fecha_real,
        ...(event.fecha_fin ? { endDate: event.fecha_fin } : {}),
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: { "@type": "Place", name: event.place, address: { "@type": "PostalAddress", addressLocality: "Medellín", addressRegion: "Antioquia", addressCountry: "CO" } },
        ...(event.image_url ? { image: [event.image_url] } : {}),
        ...(event.description ? { description: event.description.slice(0, 300) } : {}),
        ...(event.organizer_name ? { organizer: { "@type": "Organization", name: event.organizer_name } } : {}),
        ...(event.price === "Gratis" ? { isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "COP", availability: "https://schema.org/InStock", url: canonical } } : {}),
      }).replace(/</g, "\\u003c")}</script>`
    : "";

  const bloque = `
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="event" />
  <meta property="og:site_name" content="Medellín Vibra" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  ${jsonLd}
`;

  // 6. Quitar los meta tags genéricos del shell e inyectar los del evento
  const html = shell
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/<head>/i, `<head>${bloque}`);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
