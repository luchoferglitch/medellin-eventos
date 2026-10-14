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

// Igual slugify que src/EventoPage.jsx y api/organizador-og.js — este archivo
// corre en el runtime edge de Vercel, sin import de src/, así que se duplica
// a propósito (mismo criterio ya documentado en api/sitemap.js).
const slugify = (str) =>
  str?.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";

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
        `${SUPABASE_URL}/rest/v1/events?id=eq.${id}&estado=in.(aprobado,archivado)&select=id,estado,title,description,image_url,place,date,time,price,category,fecha_real,fecha_fin,organizer_name,organizer_contact,ticket_link,ticket_platform,performer,created_at,tag,zona&limit=1`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const data = await res.json();
      event = Array.isArray(data) ? data[0] || null : null;
    } catch { /* meta tags genéricos */ }
  }

  // El canonical se arma SIEMPRE desde el título actual + id, igual que
  // EventoPage.jsx y el sitemap — nunca desde el slug pedido. Antes se usaba
  // el slug de la URL tal cual: si el título de un evento cambiaba (o alguien
  // compartía un enlace con otro slug), cada variante se declaraba canónica a
  // sí misma y Search Console reportaba "Google eligió una canónica diferente".
  const canonicalSlug = event ? `${slugify(event.title)}-${event.id}` : slug;
  const canonical = `${DOMINIO}/evento/${canonicalSlug}`;

  // 2bis. Slug viejo o distinto con el mismo id: 301 a la URL canónica, así
  // Google consolida las variantes en una sola en vez de verlas duplicadas.
  if (event && slug !== canonicalSlug) {
    return Response.redirect(canonical, 301);
  }

  // 3. Sin shell no hay nada que inyectar: redirigir al sitio normal
  if (!shell) {
    return Response.redirect(event ? canonical : DOMINIO, 302);
  }

  // Evento que ya pasó (el cron lo archiva): se sirve igual, con su canonical
  // propio y el aviso "Ya finalizó", pero sin JSON-LD de Event — no tiene
  // sentido ofrecerle a Google un evento con fechas pasadas.
  const archivado = event?.estado === "archivado";

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

  // JSON-LD server-side: el carrusel de eventos de Google sin depender de JS.
  // Es lo que Googlebot realmente lee (el filtro de user-agent en vercel.json
  // lo manda aquí, no a EventoPage.jsx), así que debe llevar los mismos campos
  // que el JSON-LD de EventoPage.jsx: endDate, organizer con url y offers
  // siempre presentes — su ausencia era lo que reportaba Search Console.
  // Misma regla esGratis que src/priceLabel.js y EventoPage.jsx.
  const precioLower = (event.price || "").toLowerCase();
  const esGratis = precioLower.startsWith("gratis") || precioLower.startsWith("entrada libre");
  const priceMatch = (event.price || "").match(/[0-9][0-9.,]*/);
  const offerPrice = esGratis ? "0" : (priceMatch ? priceMatch[0].replace(/\./g, "").replace(/,/g, "") : undefined);
  // Municipio real para addressLocality: antes iba "Medellín" fijo incluso
  // para eventos de La Ceja o Rionegro. Se toma del propio campo place
  // (convención "..., Municipio, Antioquia"); si no se puede leer, Medellín
  // solo cuando la zona es Medellín, y si no, se omite en vez de adivinar.
  const partesPlace = (event.place || "").split(",").map((p) => p.trim()).filter(Boolean);
  const iAntioquia = partesPlace.findIndex((p) => /^antioquia$/i.test(p));
  const municipio = iAntioquia > 0 ? partesPlace[iAntioquia - 1] : (event.zona === "Medellín" ? "Medellín" : null);
  const validFrom = (event.created_at || new Date().toISOString()).split("T")[0];
  const jsonLd = event.fecha_real && !archivado
    ? `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        startDate: event.fecha_real,
        endDate: event.fecha_fin || event.fecha_real,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: { "@type": "Place", name: event.place, address: { "@type": "PostalAddress", ...(municipio ? { addressLocality: municipio } : {}), addressRegion: "Antioquia", addressCountry: "CO" } },
        image: [event.image_url || IMAGEN_DEFAULT],
        ...(event.description ? { description: event.description.slice(0, 300) } : {}),
        // performer solo si events.performer está lleno — nunca se inventa ni
        // se reutiliza organizer_name (promotor/venue) en su lugar.
        ...(event.performer ? { performer: { "@type": "Person", name: event.performer } } : {}),
        organizer: {
          "@type": "Organization",
          name: event.organizer_name || "Medellín Vibra",
          url: event.organizer_name ? `${DOMINIO}/organizador/${slugify(event.organizer_name)}` : DOMINIO,
        },
        offers: {
          "@type": "Offer",
          url: event.ticket_link && String(event.ticket_link).startsWith("http") ? event.ticket_link : canonical,
          priceCurrency: "COP",
          availability: event.tag === "Agotado" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          validFrom,
          ...(offerPrice ? { price: offerPrice } : {}),
        },
        ...(esGratis ? { isAccessibleForFree: true } : {}),
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
    ${archivado ? `<p><strong>Este evento ya finalizó.</strong> <a href="${DOMINIO}/">Ver los próximos eventos en Medellín Vibra</a></p>` : ""}
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
