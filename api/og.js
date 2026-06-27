const SUPABASE_URL = "https://jtbqaqugnqkympwnfsod.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnFhcXVnbnFreW1wd25mc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODUzMzQsImV4cCI6MjA5MzA2MTMzNH0.3tHT9CVRhboFrC3pTNMMQ-i2GeEPv_nUkG4d-hPuSdc";

export const config = { runtime: "edge" };

function slugToId(slug) {
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  return !isNaN(last) ? last : null;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const slug = url.pathname.replace("/evento/", "");
  const id = slugToId(slug);

  let event = null;

  if (id) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?id=eq.${id}&estado=eq.aprobado&select=title,description,image_url,place,date,price,category`,
      { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    event = data?.[0] || null;
  }

  const title = event ? `${event.title} — Medellín Vibra` : "Medellín Vibra";
  const description = event
    ? (event.description?.slice(0, 155) || `${event.category} en ${event.place} · ${event.date} · ${event.price}`)
    : "La agenda cultural de Medellín, el Área Metropolitana y el Oriente Cercano.";
  const image = event?.image_url || "https://i.imgur.com/gcIvQUD.jpg";
  const canonical = `https://www.medellinvibra.co${url.pathname}`;

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
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
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZRW8DCYBFS"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-ZRW8DCYBFS');
  </script>
  <script>window.location.href = "${canonical}";</script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
