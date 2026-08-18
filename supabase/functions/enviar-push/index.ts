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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

  let enviados = 0;
  let desactivados = 0;

  for (const sub of subs || []) {
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
        `enviar-push: fallo al enviar a sub ${sub.id} (frecuencia=${frecuencia})`,
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
