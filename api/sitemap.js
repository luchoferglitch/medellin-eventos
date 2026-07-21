const SUPABASE_URL = "https://jtbqaqugnqkympwnfsod.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnFhcXVnbnFreW1wd25mc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODUzMzQsImV4cCI6MjA5MzA2MTMzNH0.3tHT9CVRhboFrC3pTNMMQ-i2GeEPv_nUkG4d-hPuSdc";
const BASE_URL = "https://www.medellinvibra.co";

export const config = { runtime: "edge" };

function slugify(str) {
  return str?.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";
}

export default async function handler(_req) {
  // Traer eventos aprobados
  const eventsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/events?estado=eq.aprobado&select=id,title,organizer_name,fecha_real&order=fecha_real.asc`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
  );
  const events = await eventsRes.json();

  // Organizadores únicos
  const orgs = [...new Set(events.filter(e => e.organizer_name).map(e => e.organizer_name))];

  const today = new Date().toISOString().split("T")[0];

  const urls = [
    // Home
    `  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${today}</lastmod>
  </url>`,

    // FAQ (AEO/SEO)
    ` <url>
    <loc>${BASE_URL}/preguntas-frecuentes</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${today}</lastmod>
  </url>`,

    // Página HOY (URL propia, contenido dinámico)
`  <url>
    <loc>${BASE_URL}/hoy</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${today}</lastmod>
  </url>`,

    // Páginas de eventos
    ...events.map(e => `  <url>
    <loc>${BASE_URL}/evento/${slugify(e.title)}-${e.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${e.fecha_real || today}</lastmod>
  </url>`),

    // Páginas de organizadores
    ...orgs.map(org => `  <url>
    <loc>${BASE_URL}/organizador/${slugify(org)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <lastmod>${today}</lastmod>
  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
