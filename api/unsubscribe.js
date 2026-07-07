const SUPABASE_URL = "https://jtbqaqugnqkympwnfsod.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnFhcXVnbnFreW1wd25mc29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODUzMzQsImV4cCI6MjA5MzA2MTMzNH0.3tHT9CVRhboFrC3pTNMMQ-i2GeEPv_nUkG4d-hPuSdc";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(buildPage("Error", "Link de desuscripción inválido.", false), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  let email;
  try {
    email = atob(token);
  } catch {
    return new Response(buildPage("Error", "Token inválido.", false), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // Desactivar suscriptor
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email)}`,
    {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ activo: false }),
    }
  );

  if (res.ok || res.status === 204) {
    return new Response(
      buildPage(
        "Suscripción cancelada",
        "Ya no recibirás el newsletter semanal de Medellín Vibra. Si cambias de opinión, siempre puedes volver a suscribirte en nuestro sitio.",
        true
      ),
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  return new Response(buildPage("Error", "No pudimos procesar tu solicitud. Intenta de nuevo más tarde.", false), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function buildPage(title, message, success) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Medellín Vibra</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { min-height: 100vh; background: #f5f3ef; font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }
    .card { background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 20px; padding: 48px 32px; max-width: 420px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .icon { font-size: 56px; margin-bottom: 20px; }
    .title { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: #1a1a1a; margin-bottom: 12px; letter-spacing: 1px; }
    .message { color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 28px; }
    .btn { display: inline-block; background: #C8860A; color: white; padding: 14px 32px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 15px; transition: background 0.2s; }
    .btn:hover { background: #a06d08; }
    .logo { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #C8860A; margin-top: 32px; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "👋" : "⚠️"}</div>
    <div class="title">${title}</div>
    <div class="message">${message}</div>
    <a href="https://www.medellinvibra.co" class="btn">Ir a Medellín Vibra →</a>
  </div>
  <div class="logo">MEDELLÍN VIBRA</div>
</body>
</html>`;
}