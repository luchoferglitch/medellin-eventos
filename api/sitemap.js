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

// Paginas con URL propia por idioma (Fase 1 de i18n). Espanol vive sin
// prefijo en "/"; home y las 3 zonas ya tienen contenido traducido, hoy/
// esta-semana/finde/FAQ todavia no (ver CLAUDE.md) pero de todas formas
// necesitan su entrada en el sitemap con hreflang apuntando entre si.
const LANGS = ["es", "en", "pt", "fr"];
const LOCALIZED_PAGES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/preguntas-frecuentes", changefreq: "monthly", priority: "0.7" },
  { path: "/hoy", changefreq: "daily", priority: "0.9" },
  { path: "/esta-semana", changefreq: "daily", priority: "0.9" },
  { path: "/finde", changefreq: "daily", priority: "0.9" },
  { path: "/medellin", changefreq: "daily", priority: "0.85" },
  { path: "/area-metropolitana", changefreq: "daily", priority: "0.85" },
  { path: "/oriente-cercano", changefreq: "daily", priority: "0.85" },
];

function langUrl(lang, path) {
  const prefix = lang === "es" ? "" : `/${lang}`;
  const suffix = path === "/" ? (prefix || "/") : `${prefix}${path}`;
  return `${BASE_URL}${suffix}`;
}

function localizedUrlEntries(page, today) {
  const alternates = [
    ...LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${langUrl(l, page.path)}" />`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${langUrl("es", page.path)}" />`,
  ].join("\n");
  return LANGS.map(lang => `  <url>
    <loc>${langUrl(lang, page.path)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${today}</lastmod>
${alternates}
  </url>`);
}

// Umbral de "contenido suficiente" para generar una página de categoría — debe
// quedar igual a MIN_EVENTS_FOR_CATEGORY_PAGE en src/CategoriaPage.jsx (ver
// CLAUDE.md, sección SEO). Este archivo corre en el runtime edge de Vercel, sin
// import de src/, así que el número se duplica a propósito en vez de compartirlo.
const MIN_EVENTS_FOR_CATEGORY_PAGE = 15;

// Debe quedar igual a MIN_EVENTS_FOR_GRATIS_PAGE en src/GratisPage.jsx — mismo
// criterio de duplicación que MIN_EVENTS_FOR_CATEGORY_PAGE de arriba.
const MIN_EVENTS_FOR_GRATIS_PAGE = 10;

// Debe quedar igual a MIN_EVENTS_FOR_BARRIO_PAGE en src/BarrioPage.jsx — mismo
// criterio de duplicación. Solo El Poblado califica hoy (19 eventos); Laureles/
// Centro/Envigado aparecerán solos cuando crucen el umbral.
const MIN_EVENTS_FOR_BARRIO_PAGE = 15;

// Misma regla esGratis que src/priceLabel.js — duplicada aquí porque este
// archivo corre en el runtime edge de Vercel, sin import de src/.
const esGratis = (price) => {
  const l = (price || "").toLowerCase();
  return l.startsWith("gratis") || l.startsWith("entrada libre");
};

export default async function handler(_req) {
  // Traer eventos aprobados
  const eventsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/events?estado=eq.aprobado&select=id,title,organizer_name,fecha_real,category,price,barrio&order=fecha_real.asc`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
  );
  const events = await eventsRes.json();

  // Organizadores únicos
  const orgs = [...new Set(events.filter(e => e.organizer_name).map(e => e.organizer_name))];

  // Categorías con eventos suficientes para sostener su propia página — se calcula
  // en cada build del sitemap, no es una lista fija: si una categoría cruza el
  // umbral (o cae por debajo), la URL aparece o desaparece sola.
  const categoryCounts = {};
  events.forEach(e => { if (e.category) categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1; });
  const qualifyingCategories = Object.keys(categoryCounts).filter(cat => categoryCounts[cat] >= MIN_EVENTS_FOR_CATEGORY_PAGE);

  // /gratis — mismo criterio de umbral que las categorías, calculado en vivo.
  const gratisCount = events.filter(e => esGratis(e.price)).length;
  const gratisQualifica = gratisCount >= MIN_EVENTS_FOR_GRATIS_PAGE;

  // Barrios con eventos suficientes — mismo cálculo en vivo que las categorías.
  const barrioCounts = {};
  events.forEach(e => { if (e.barrio) barrioCounts[e.barrio] = (barrioCounts[e.barrio] || 0) + 1; });
  const qualifyingBarrios = Object.keys(barrioCounts).filter(b => barrioCounts[b] >= MIN_EVENTS_FOR_BARRIO_PAGE);

  const today = new Date().toISOString().split("T")[0];

  const urls = [
    // Home, FAQ, hoy, esta-semana, finde y las 3 zonas — 8 páginas x 4 idiomas = 32 URLs
    ...LOCALIZED_PAGES.flatMap(page => localizedUrlEntries(page, today)),

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

    // Páginas de categoría — solo español por ahora (ver CLAUDE.md, sección SEO)
    ...qualifyingCategories.map(cat => `  <url>
    <loc>${BASE_URL}/categoria/${slugify(cat)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.75</priority>
    <lastmod>${today}</lastmod>
  </url>`),

    // Páginas de barrio — mismo patrón de umbral dinámico que las categorías.
    ...qualifyingBarrios.map(b => `  <url>
    <loc>${BASE_URL}/barrio/${slugify(b)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.75</priority>
    <lastmod>${today}</lastmod>
  </url>`),

    // /gratis — mismo patrón de umbral dinámico que las categorías, pero con
    // nav-link propio (ver App.jsx): prioridad más alta que una categoría
    // cualquiera, cercana a /hoy, por su volumen de contenido (~49% del catálogo).
    ...(gratisQualifica ? [`  <url>
    <loc>${BASE_URL}/gratis</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <lastmod>${today}</lastmod>
  </url>`] : []),

    // Landing para organizadores — página estática de captación, mismo criterio
    // de prioridad que /proveedores: contenido de soporte, no compite con /hoy.
    `  <url>
    <loc>${BASE_URL}/para-organizadores</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
    <lastmod>${today}</lastmod>
  </url>`,

    // Directorio de proveedores — contenido de soporte, no el producto principal
    // (ver CLAUDE.md, sección SEO): prioridad baja a propósito, no compite con /hoy.
    `  <url>
    <loc>${BASE_URL}/proveedores</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
    <lastmod>${today}</lastmod>
  </url>`,

    // Página institucional — mismo criterio de prioridad baja que /proveedores.
    `  <url>
    <loc>${BASE_URL}/nosotros</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
    <lastmod>${today}</lastmod>
  </url>`,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
