import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT")!,
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

const FRECUENCIAS_VALIDAS = ["diaria", "semanal", "destacados"];
const MAX_FALLOS = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-anuncio-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Igual a slugify() en src/App.jsx: normalize("NFD") descompone tildes en
// letra + marca combinante, y el filtro [^a-z0-9\s-] se encarga de botar esa
// marca junto con el resto de símbolos no alfanuméricos.
const slugify = (str: string) =>
  str?.toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";

// Formatea una fecha 'YYYY-MM-DD' en español fijando timeZone: 'UTC' para que
// no se corra un día según la zona horaria del runtime de la función.
function formatFecha(fechaStr: string) {
  const [y, m, d] = fechaStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "long", timeZone: "UTC" });
}

async function getEventosDiaria() {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const mananaStr = manana.toISOString().split("T")[0];

  const { data } = await supabase
    .from("events")
    .select("id, title")
    .eq("estado", "aprobado")
    .lte("fecha_real", mananaStr)
    .or(`fecha_fin.gte.${mananaStr},fecha_fin.is.null`)
    .order("fecha_real", { ascending: true });

  return data || [];
}

async function getEventosSemanal() {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 8);

  const { data } = await supabase
    .from("events")
    .select("id, title")
    .eq("estado", "aprobado")
    .gte("fecha_real", manana.toISOString().split("T")[0])
    .lte("fecha_real", nextWeek.toISOString().split("T")[0])
    .order("fecha_real", { ascending: true })
    .limit(8);

  return data || [];
}

async function getEventosDestacados() {
  const { data } = await supabase
    .from("events")
    .select("id, title")
    .eq("estado", "aprobado")
    .eq("tag", "Destacado")
    .eq("destacado_notificado", false);

  return data || [];
}

function buildPayload(frecuencia: string, eventos: { id: number; title: string }[]) {
  if (eventos.length === 0) return null;
  const top = eventos[0];

  if (frecuencia === "diaria") {
    return {
      title: eventos.length === 1 ? `🎉 Hoy: ${top.title}` : `🎉 ${eventos.length} eventos mañana en Medellín`,
      body: eventos.length === 1 ? "Toca para ver los detalles" : `Incluye "${top.title}" y más`,
      url: "/hoy",
      tag: "medellin-vibra-diaria",
    };
  }

  if (frecuencia === "semanal") {
    return {
      title: `🎶 ${eventos.length} planes para esta semana`,
      body: "Descubre lo que vibra en Medellín, el Área Metropolitana y el Oriente Cercano",
      url: "/",
      tag: "medellin-vibra-semanal",
    };
  }

  return {
    title: eventos.length === 1 ? `⭐ Nuevo evento destacado: ${top.title}` : `⭐ ${eventos.length} eventos destacados esta semana`,
    body: "No te los pierdas",
    url: "/",
    tag: "medellin-vibra-destacados",
  };
}

type Sub = { id: number; endpoint: string; p256dh: string; auth_key: string; fail_count: number | null };

// Loop de envío compartido por el modo cron (frecuencia) y el modo anuncio
// (evento puntual): manda el mismo payload a cada suscripción y aplica el
// mismo criterio de desactivación por fallos permanentes o repetidos.
async function enviarATodos(subs: Sub[], payload: Record<string, unknown>, contexto: string) {
  let enviados = 0;
  let desactivados = 0;

  for (const sub of subs) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth_key },
    };

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      await supabase
        .from("push_subscriptions")
        .update({ fail_count: 0, last_sent_at: new Date().toISOString() })
        .eq("id", sub.id);
      enviados++;
    } catch (err: any) {
      console.error(
        `enviar-push: fallo al enviar a sub ${sub.id} (${contexto})`,
        "statusCode=", err?.statusCode,
        "body=", err?.body,
        "message=", err?.message
      );

      // 404/410 = la suscripción fue revocada o expiró del lado del navegador/push
      // service (spec Web Push). No tiene sentido reintentar: es un fallo permanente.
      const esFalloPermanente = err?.statusCode === 404 || err?.statusCode === 410;
      const nuevoFailCount = (sub.fail_count || 0) + 1;
      const desactivar = esFalloPermanente || nuevoFailCount >= MAX_FALLOS;
      if (desactivar) desactivados++;
      await supabase
        .from("push_subscriptions")
        .update({ fail_count: nuevoFailCount, activo: !desactivar })
        .eq("id", sub.id);
    }
  }

  return { enviados, desactivados };
}

// Modo anuncio: push manual dedicado a un evento puntual (festival, feria),
// disparado a mano vía script local — no corre por cron. Protegido con un
// secret propio (ANUNCIO_PUSH_SECRET) porque, a diferencia de gestionar-push,
// esto le llega a suscriptores reales y no debe quedar abierto con la anon key.
async function manejarAnuncio(req: Request, body: any) {
  const secretEsperado = Deno.env.get("ANUNCIO_PUSH_SECRET");
  const secretRecibido = req.headers.get("x-anuncio-secret");
  if (!secretEsperado || secretRecibido !== secretEsperado) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: evento, error: eventoError } = await supabase
    .from("events")
    .select("id, title, fecha_real, fecha_fin, place, estado")
    .eq("id", body.eventoId)
    .single();

  if (eventoError || !evento) {
    return new Response(JSON.stringify({ error: "Evento no encontrado" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (evento.estado !== "aprobado") {
    return new Response(JSON.stringify({ error: `El evento tiene estado '${evento.estado}', no 'aprobado'` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const segmentos = Array.isArray(body.segmentos) && body.segmentos.length > 0
    ? body.segmentos
    : FRECUENCIAS_VALIDAS;

  if (!segmentos.every((s: string) => FRECUENCIAS_VALIDAS.includes(s))) {
    return new Response(JSON.stringify({ error: "segmentos inválidos" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const slug = `${slugify(evento.title)}-${evento.id}`;
  const fechaTexto = evento.fecha_fin && evento.fecha_fin !== evento.fecha_real
    ? `Del ${formatFecha(evento.fecha_real)} al ${formatFecha(evento.fecha_fin)}`
    : `El ${formatFecha(evento.fecha_real)}`;

  const titulo = body.titulo || `📢 ${evento.title}`;
  const cuerpo = body.cuerpo || `${fechaTexto}${evento.place ? ` · ${evento.place}` : ""}`;

  const payload = {
    title: titulo,
    body: cuerpo,
    url: `/evento/${slug}`,
    tag: `medellin-vibra-anuncio-${evento.id}`,
  };

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key, fail_count")
    .in("frecuencia", segmentos)
    .eq("activo", true);

  const { enviados, desactivados } = await enviarATodos(subs || [], payload, `anuncio evento ${evento.id}`);

  return new Response(
    JSON.stringify({
      message: "Anuncio enviado",
      eventoId: evento.id,
      titulo,
      cuerpo,
      url: payload.url,
      segmentos,
      suscriptores: subs?.length || 0,
      enviados,
      desactivados,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // pg_cron llama con body '{}', un JSON vacío también es válido
  }

  if (body.eventoId !== undefined) {
    return manejarAnuncio(req, body);
  }

  const frecuencia = body.frecuencia;
  if (!FRECUENCIAS_VALIDAS.includes(frecuencia)) {
    return new Response(JSON.stringify({ error: "frecuencia inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const eventos =
    frecuencia === "diaria" ? await getEventosDiaria() :
    frecuencia === "semanal" ? await getEventosSemanal() :
    await getEventosDestacados();

  const payload = buildPayload(frecuencia, eventos);
  if (!payload) {
    return new Response(JSON.stringify({ message: "Sin eventos que notificar", frecuencia }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key, fail_count")
    .eq("frecuencia", frecuencia)
    .eq("activo", true);

  const { enviados, desactivados } = await enviarATodos(subs || [], payload, `frecuencia=${frecuencia}`);

  if (frecuencia === "destacados" && eventos.length > 0) {
    await supabase
      .from("events")
      .update({ destacado_notificado: true })
      .in("id", eventos.map((e) => e.id));
  }

  return new Response(
    JSON.stringify({
      message: "Push procesado",
      frecuencia,
      eventos: eventos.length,
      suscriptores: subs?.length || 0,
      enviados,
      desactivados,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
