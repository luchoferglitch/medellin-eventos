// api/categoria-og.js — Meta tags y contenido real por categoría, para bots
// (GPTBot, ClaudeBot, PerplexityBot, CCBot, googlebot, bingbot, etc., filtrados
// por user-agent en vercel.json). Mismo patrón que api/og.js (evento), adaptado
// a la página de categoría: nombre, descripción (la misma que ya usa la SPA
// para SEO, ver CATEGORY_CONTENT en src/CategoriaPage.jsx) y eventos
// representativos. Los humanos nunca pasan por aquí.

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

const slugify = (str) =>
  str?.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";

// Umbral y copy duplicados a propósito desde src/CategoriaPage.jsx y
// api/sitemap.js — este archivo corre en el runtime edge de Vercel, sin
// import de src/ (ver CLAUDE.md, sección SEO). Si CATEGORY_CONTENT o
// MIN_EVENTS_FOR_CATEGORY_PAGE cambian allá, cambian aquí también.
const MIN_EVENTS_FOR_CATEGORY_PAGE = 15;

const CATEGORY_CONTENT = {
  "Música": {
    heading: "Música en Medellín",
    metaDescription: "Agenda de conciertos y música en vivo en Medellín: del Teatro Metropolitano y el Pablo Tobón Uribe a DAVIarena en Sabaneta. Filtra por fecha, género y precio.",
    intro: "La agenda de conciertos y música en vivo de la ciudad: desde las temporadas del Teatro Metropolitano José Gutiérrez Gómez y el Teatro Pablo Tobón Uribe hasta los shows grandes en DAVIarena, en Sabaneta. Hay jazz, rock, música popular, clásica y electrónica — filtra por fecha o precio para encontrar el concierto que te queda mejor esta semana.",
  },
  "Comedia": {
    heading: "Comedia en Medellín",
    metaDescription: "Shows de stand-up y comedia en Medellín: La Korte en Laureles, Teatro Acción Impro en El Poblado y más escenarios. Agenda actualizada cada semana.",
    intro: "La agenda de stand-up, improvisación y comedia en vivo: de las noches fijas en La Korte, en Laureles, a los shows de improvisación en Teatro Acción Impro y Mero Bar, en El Poblado. Un plan para reírte esta semana sin necesariamente pagar boleta de teatro grande.",
  },
  "Académicos": {
    heading: "Eventos académicos en Medellín",
    metaDescription: "Conferencias, talleres y charlas en Medellín: Planetario de Medellín, Parque Explora y más espacios académicos. Agenda actualizada.",
    intro: "Charlas, talleres, conferencias y actividades de divulgación científica y educativa — el Planetario de Medellín y el Parque Explora concentran buena parte de la agenda, junto con universidades y cámaras de comercio de la ciudad. Un plan distinto si buscas aprender algo nuevo, no solo entretenerte.",
  },
  "Teatro": {
    heading: "Teatro en Medellín",
    metaDescription: "Cartelera de teatro en Medellín: Teatro Metropolitano, Teatro Comfama Alfonso Restrepo Moreno y otros escenarios. Agenda de obras actualizada cada semana.",
    intro: "La cartelera de teatro de la ciudad: obras en el Teatro Metropolitano José Gutiérrez Gómez, el Teatro Comfama Alfonso Restrepo Moreno y salas más pequeñas como Mero Bar. Desde clásicos hasta montajes independientes — filtra por fecha para ver qué se está presentando esta semana.",
  },
  "Arte": {
    heading: "Arte en Medellín",
    metaDescription: "Exposiciones, muestras y eventos de arte en Medellín: Parque Explora, Plaza Mayor y galerías del Barrio Colombia. Agenda actualizada.",
    intro: "Exposiciones, muestras y actividades de arte en espacios como Parque Explora, Plaza Mayor y galerías del Barrio Colombia, como El Coleccionista. Planes culturales más allá del concierto o la obra de teatro.",
  },
  "Baile": {
    heading: "Baile en Medellín",
    metaDescription: "Talleres, socials y eventos de baile en Medellín: Claustro Comfama y otros escenarios. Agenda de salsa, bachata y danza actualizada.",
    intro: "Talleres, socials y presentaciones de baile — el Claustro Comfama concentra buena parte de la agenda de la ciudad, desde salsa y bachata hasta danza contemporánea. Filtra por fecha si buscas dónde bailar este fin de semana.",
  },
};

const SLUG_TO_CATEGORY = Object.fromEntries(
  Object.keys(CATEGORY_CONTENT).map((cat) => [slugify(cat), cat])
);

// Mismas imágenes que usa el grid de categorías del home (src/App.jsx, imports
// cat-musica.jpg etc. de src/assets/) — copiadas a public/ porque este archivo
// corre en el runtime edge de Vercel y necesita una URL estable, no el nombre
// hasheado que le da Vite en cada build a los assets importados desde src/.
const CATEGORY_IMAGE = {
  "Música": "cat-musica.jpg",
  "Arte": "cat-arte.jpg",
  "Comedia": "cat-comedia.jpg",
  "Tech": "cat-tech.jpg",
  "Gastronomía": "cat-gastronomia.jpg",
  "Baile": "cat-baile.jpg",
  "Deportes": "cat-deportes.jpg",
  "Teatro": "cat-teatro.jpg",
  "Bienestar": "cat-bienestar.jpg",
  "Académicos": "cat-academicos.jpg",
};

// Tope de eventos listados en el body — categorías grandes (Música tiene más
// de 100) no necesitan el listado completo para que un bot entienda de qué
// trata la página; con "representativos" alcanza (pedido explícito).
const MAX_EVENTOS_EN_BODY = 20;

export default async function handler(req) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") || url.pathname.replace(/^\/(api\/categoria-og|categoria)\/?/, "");

  let shell = null;
  try {
    const shellRes = await fetch(`${url.origin}/index.html`);
    if (shellRes.ok) shell = await shellRes.text();
  } catch { /* seguimos con el fallback */ }

  const canonical = `${DOMINIO}/categoria/${slug}`;

  if (!shell) return Response.redirect(DOMINIO, 302);

  const catName = SLUG_TO_CATEGORY[slug];

  // Sin categoría calificada para este slug: servir el shell tal cual (igual
  // que CategoriaPage.jsx redirige al home si el slug no existe o no llega
  // al umbral de eventos).
  if (!catName) {
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
      `${SUPABASE_URL}/rest/v1/events?estado=eq.aprobado&category=eq.${encodeURIComponent(catName)}&select=id,title,date,place&order=fecha_real.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    if (Array.isArray(data)) events = data;
  } catch { /* sin datos: cae al fallback de abajo */ }

  // Categoría que hoy no llega al umbral (o cayó por debajo): mismo criterio
  // que la SPA, no se genera contenido propio.
  if (events.length < MIN_EVENTS_FOR_CATEGORY_PAGE) {
    return new Response(shell, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }

  const content = CATEGORY_CONTENT[catName];
  const title = esc(`${content.heading} — Medellín Vibra`);
  const description = esc(content.metaDescription);
  const image = `${DOMINIO}/${CATEGORY_IMAGE[catName]}`;

  const bloque = `
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Medellín Vibra" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
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
