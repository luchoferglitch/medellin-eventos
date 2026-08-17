const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "hola@medellinvibra.co";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://www.medellinvibra.co";
const IMG_FALLBACK = "https://pub-c5ba255ea192436da56e91e3ef3ecfa5.r2.dev/default-fallback-medellin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CAT_EMOJI: Record<string, string> = {
  "Música": "🎵", "Arte": "🎨", "Comedia": "😂", "Tech": "💻",
  "Gastronomía": "🍽️", "Baile": "💃", "Deportes": "⚽",
  "Teatro": "🎭", "Bienestar": "🧘", "Académicos": "📚",
};

const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function slugify(str: string) {
  return String(str)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function formatFecha(isoStr: string | null, isoFin: string | null): string {
  if (!isoStr) return "";
  const [y, m, d] = isoStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const diaStr = `${DIAS[dt.getDay()]} ${d} ${MESES_CORTO[m - 1]}`;
  if (isoFin && isoFin !== isoStr) {
    const [y2, m2, d2] = isoFin.split("-").map(Number);
    const dt2 = new Date(y2, m2 - 1, d2);
    return `${diaStr} - ${DIAS[dt2.getDay()]} ${d2} ${MESES_CORTO[m2 - 1]}`;
  }
  return diaStr;
}

async function logNewsletter(
  estado: "ok" | "parcial" | "error",
  destinatarios: number | null,
  enviados: number,
  errores: number,
  mensajeError: string | null,
) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/newsletter_log`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        estado,
        destinatarios,
        enviados,
        errores,
        mensaje_error: mensajeError,
      }),
    });
  } catch (_e) {
    // Si el log falla, no debe tumbar el envío del newsletter.
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // destinatarios queda en null hasta que se conoce el conteo real de
  // suscriptores. Si el error ocurre antes de ese punto, se loguea NULL
  // en vez de 0, para distinguir "no llegué a contar" de "conté 0 reales".
  let destinatarios: number | null = null;

  try {
    // Filtrar desde mañana para no mostrar eventos que ya pasaron hoy
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 8);
    const mananaStr = manana.toISOString().split("T")[0];
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    // Traer TODOS los eventos aprobados de la próxima semana (tope amplio para
    // no perder eventos Destacado que caigan tarde en el orden por fecha).
    // El recorte a 8 se hace después de priorizar Destacado, no antes.
    const eventsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/events?estado=eq.aprobado&fecha_real=gte.${mananaStr}&fecha_real=lte.${nextWeekStr}&order=fecha_real.asc,time.asc.nullslast&limit=200`,
      { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
    );
    let events = await eventsRes.json();

    // Los eventos con tag "Destacado" van primero, conservando el orden
    // por fecha dentro de cada grupo (sort estable). Luego sí se recorta a 8.
    events.sort((a: any, b: any) =>
      (b.tag === "Destacado" ? 1 : 0) - (a.tag === "Destacado" ? 1 : 0)
    );
    events = events.slice(0, 8);

    const subsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/subscribers?activo=eq.true&select=email,nombre,idioma`,
      { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } }
    );
    const subscribers = await subsRes.json();
    destinatarios = subscribers.length;

    if (!subscribers.length) {
      await logNewsletter("ok", 0, 0, 0, null);
      return new Response(JSON.stringify({ message: "Sin suscriptores" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const eventCards = events.length > 0 ? events.map((ev: any) => {
      const isDestacado = ev.tag === "Destacado";
      const emoji = CAT_EMOJI[ev.category] || "📅";
      const price = ev.price === "Gratis"
        ? `<span style="color:#059669;font-weight:700;">Gratis ✓</span>`
        : `<span style="color:#C8860A;font-weight:700;">${ev.price || "Consultar boletería"}</span>`;
      const image = ev.image_url || IMG_FALLBACK;
      const eventUrl = `${SITE}/evento/${slugify(ev.title)}-${ev.id}`;
      const fechaDisplay = formatFecha(ev.fecha_real, ev.fecha_fin);
      const horaDisplay = ev.time ? ` · ${ev.time.slice(0,5).replace(':','h')}` : "";
      const ticketBtn = ev.ticket_link
        ? `<a href="${ev.ticket_link}" style="display:inline-block;margin-top:8px;margin-right:8px;background:#1a1a1a;color:white;padding:7px 16px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;">Comprar boleta →</a>`
        : "";
      const destacadoBadge = isDestacado
        ? `<span style="display:inline-block;background:#C8860A;color:white;font-size:11px;font-weight:800;letter-spacing:0.3px;padding:3px 9px;border-radius:100px;margin-left:8px;vertical-align:middle;white-space:nowrap;">★ Destacado</span>`
        : "";
      const cardBorder = isDestacado ? "2px solid #D9A521" : "1px solid #ece8dd";
      const cardBg = isDestacado ? "#FFF9EC" : "white";
      const cardShadow = isDestacado ? "0 4px 14px rgba(200,134,10,0.28)" : "0 2px 8px rgba(0,0,0,0.05)";
      const topBorder = isDestacado ? "4px solid #D9A521" : "3px solid #C8860A";
      return `
        <div style="background:${cardBg};border-radius:14px;margin-bottom:24px;overflow:hidden;border:${cardBorder};box-shadow:${cardShadow};">
          <a href="${eventUrl}" style="text-decoration:none;display:block;">
            <img src="${image}" alt="${ev.title}" style="width:100%;height:220px;object-fit:cover;display:block;" />
          </a>
          <div style="padding:20px;border-top:${topBorder};">
            <div style="font-size:12px;color:#C8860A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${emoji} ${ev.category}</div>
            <a href="${eventUrl}" style="text-decoration:none;">
              <h3 style="margin:0 0 10px;color:#1a1a1a;font-size:18px;line-height:1.3;">${ev.title}${destacadoBadge}</h3>
            </a>
            <p style="margin:4px 0;color:#444;font-size:14px;">📅 <strong>${fechaDisplay}${horaDisplay}</strong></p>
            <p style="margin:4px 0;color:#666;font-size:13px;">📍 ${ev.place}</p>
            <div style="margin-top:14px;display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
              <span style="font-size:14px;">${price}</span>
              ${ticketBtn}
              <a href="${eventUrl}" style="display:inline-block;background:#C8860A;color:white;padding:7px 16px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;">Ver detalle →</a>
            </div>
          </div>
        </div>
      `;
    }).join("") : `<p style="color:#888;text-align:center;padding:32px 0;">No hay eventos programados para esta semana. ¡Vuelve pronto!</p>`;

    const today = new Date();
    const semanaLabel = `${manana.getDate()} al ${nextWeek.getDate()} de ${MESES[nextWeek.getMonth()]}`;

    // Asuntos rotativos según el día
    const asuntos = [
      `🎶 ${events.length} planes para esta semana en Medellín`,
      `🎭 Lo mejor de Medellín esta semana — ${semanaLabel}`,
      `🏙️ Tu agenda cultural del finde y la semana`,
      `✨ Esta semana en Medellín: música, arte y más`,
    ];
    const asunto = asuntos[today.getDate() % asuntos.length];

    const buildHtml = (nombre: string, email: string) => {
      const unsubscribeToken = btoa(email);
      const unsubscribeUrl = `${SITE}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
      return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f0ede6;">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f5f3ef;">
        <!-- Header -->
        <div style="background:#C8860A;padding:32px 24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:30px;letter-spacing:3px;font-weight:900;">MEDELLÍN VIBRA</h1>
          <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;letter-spacing:0.5px;">Tu agenda cultural — ${semanaLabel}</p>
        </div>
        <!-- Saludo -->
        <div style="padding:28px 24px 0;">
          <p style="color:#333;font-size:16px;margin:0 0 6px;">Hola${nombre ? " <strong>" + nombre + "</strong>" : ""}! 👋</p>
          <p style="color:#666;font-size:14px;margin:0 0 28px;">Esta semana Medellín tiene ${events.length} planes que no te puedes perder. Aquí los mejores:</p>
        </div>
        <!-- Eventos -->
        <div style="padding:0 24px;">
          ${eventCards}
        </div>
        <!-- CTA -->
        <div style="text-align:center;padding:8px 24px 36px;">
          <a href="${SITE}" style="display:inline-block;background:#C8860A;color:white;padding:16px 40px;border-radius:100px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:0.5px;">Ver todos los eventos →</a>
          <p style="color:#888;font-size:12px;margin:16px 0 0;">Hay más de 180 eventos en la plataforma</p>
        </div>
        <!-- Footer -->
        <div style="background:#1a1a1a;padding:24px;text-align:center;">
          <p style="color:#C8860A;font-size:16px;font-weight:700;margin:0 0 4px;">MEDELLÍN VIBRA</p>
          <p style="color:#888;font-size:12px;margin:0;"><a href="${SITE}" style="color:#C8860A;text-decoration:none;">medellinvibra.co</a></p>
          <p style="color:#555;font-size:11px;margin:16px 0 0;">Recibiste este correo porque te suscribiste a Medellín Vibra.</p>
          <p style="margin:8px 0 0;"><a href="${unsubscribeUrl}" style="color:#666;font-size:11px;">Cancelar suscripción</a></p>
        </div>
      </div>
      </body></html>`;
    };

    let enviados = 0;
    let errores = 0;

    for (const sub of subscribers) {
      const html = buildHtml(sub.nombre || "", sub.email);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Medellín Vibra <${FROM_EMAIL}>`,
          to: [sub.email],
          subject: asunto,
          html,
        }),
      });
      if (res.ok) enviados++;
      else errores++;
      await new Promise(r => setTimeout(r, 120));
    }

    const estado = errores === 0 ? "ok" : (enviados === 0 ? "error" : "parcial");
    const mensajeError = estado === "error" ? "Todos los envíos a Resend fallaron" : null;
    await logNewsletter(estado, destinatarios, enviados, errores, mensajeError);

    return new Response(
      JSON.stringify({ message: "Newsletter enviado", enviados, errores, eventos: events.length, semana: semanaLabel }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const mensajeError = err instanceof Error ? err.message : String(err);
    await logNewsletter("error", destinatarios, 0, 0, mensajeError);
    return new Response(
      JSON.stringify({ error: mensajeError }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
