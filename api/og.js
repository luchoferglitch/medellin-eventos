// api/og.js — Meta tags y contenido real por evento, para bots (WhatsApp,
// Facebook, Twitter, Google, GPTBot, ClaudeBot, PerplexityBot, CCBot, etc.)
// Los bots (filtrados por user-agent en vercel.json) reciben el index.html
// real del sitio con los meta tags y un <body> con el contenido del evento
// (título, fecha, lugar, precio, descripción, organizador, boletería)
// inyectados. Los humanos nunca pasan por aquí.

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

// Igual que esc(), pero para texto de body: conserva saltos de línea (como <br/>)
// en vez de aplanarlos — la descripción completa del evento sí los necesita.
const escBody = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim()
    .replace(/\r?\n/g, "<br/>");

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
        `${SUPABASE_URL}/rest/v1/events?id=eq.${id}&estado=eq.aprobado&select=title,description,image_url,place,date,time,price,category,fecha_real,fecha_fin,organizer_name,organizer_contact,ticket_link,ticket_platform&limit=1`,
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
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1000" />
  <meta property="og:image:height" content="1000" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="event" />
  <meta property="og:site_name" content="Medellín Vibra" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  ${jsonLd}
`;

  // 6bis. Bloque de contenido real para el <body> — a diferencia de los meta
  // tags de arriba (pensados para previews de link), esto es lo que un bot
  // que solo lee HTML (GPTBot, ClaudeBot, PerplexityBot, CCBot, etc.) puede
  // extraer como texto de la página. Nunca se le muestra a un humano: esta
  // función solo se sirve tras el filtro de user-agent en vercel.json.
  const fecha = [event.date, event.time].filter(Boolean).join(" · ");
  const ticketHref = event.ticket_link ? esc(event.ticket_link) : null;
  const ticketLabel = event.ticket_platform
    ? `Comprar boletas en ${esc(event.ticket_platform)}`
    : "Comprar boletas";

  const organizerLine = event.organizer_name
    ? `<p><strong>Organiza:</strong> ${esc(event.organizer_name)}${
        event.organizer_contact
          ? (String(event.organizer_contact).startsWith("http")
              ? ` — <a href="${esc(event.organizer_contact)}">${esc(event.organizer_contact)}</a>`
              : ` — ${esc(event.organizer_contact)}`)
          : ""
      }</p>`
    : "";

  const cuerpo = `
  <div id="root"></div>
  <main>
    <h1>${esc(event.title)}</h1>
    <p><strong>Fecha:</strong> ${esc(fecha || event.date || "Por confirmar")}</p>
    <p><strong>Lugar:</strong> ${esc(event.place || "Por confirmar")}</p>
    <p><strong>Precio:</strong> ${esc(event.price || "Consultar boletería")}</p>
    ${event.description ? `<p>${escBody(event.description)}</p>` : ""}
    ${organizerLine}
    ${ticketHref ? `<p><a href="${ticketHref}">${ticketLabel}</a></p>` : ""}
  </main>
`;

  // 7. Quitar los meta tags genéricos del shell e inyectar los del evento;
  // el <div id="root"></div> del shell se reemplaza por sí mismo + el
  // contenido real, para no interferir si algún bot sí ejecuta JS después.
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
