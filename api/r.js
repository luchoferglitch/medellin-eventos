// api/r.js — Redirección con tracking para links de boletería en correos
// (newsletter-semanal, recordatorio-eventos-v2). Un link dentro de un correo
// no puede ejecutar JS, así que este endpoint hace lo que src/registrarClic.js
// hace en el navegador: registra el clic en la tabla `clicks` y redirige.
//
// event_id es lo único que llega por query string — el ticket_link real se
// resuelve siempre contra la base de datos, nunca se acepta como parámetro.
// Aceptar la URL de destino como input abriría un open redirect (cualquiera
// podría armar medellinvibra.co/api/r?ticket_url=https://sitio-malicioso.com
// y usar el dominio de confianza del sitio como fachada).

const SUPABASE_URL = "https://jtbqaqugnqkympwnfsod.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnFhcXVnbnFreW1wd25mc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODUzMzQsImV4cCI6MjA5MzA2MTMzNH0.3tHT9CVRhboFrC3pTNMMQ-i2GeEPv_nUkG4d-hPuSdc";
const SITE = "https://www.medellinvibra.co";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const eventId = url.searchParams.get("event_id");
  const page = url.searchParams.get("page") || "email";

  if (!eventId || !/^\d+$/.test(eventId)) {
    return Response.redirect(SITE, 302);
  }

  const eventRes = await fetch(
    `${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}&select=ticket_link`,
    { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
  );
  const rows = eventRes.ok ? await eventRes.json() : [];
  const ticketUrl = rows[0]?.ticket_link;

  if (!ticketUrl) {
    return Response.redirect(SITE, 302);
  }

  // Solo se registra el clic en GET. Muchos escáneres de seguridad de correo
  // (Microsoft Defender/Safe Links y similares) pre-visitan los links con
  // HEAD antes de que la persona haga clic — un HEAD nunca es un clic humano
  // real, así que se redirige igual pero sin sumarlo a `clicks`.
  if (req.method === "GET") {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/clicks`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ event_id: Number(eventId), ticket_url: ticketUrl, page }),
      });
    } catch {
      // Nunca bloquear la redirección por un fallo de tracking.
    }
  }

  return Response.redirect(ticketUrl, 302);
}
