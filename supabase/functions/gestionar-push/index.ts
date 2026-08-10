import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FRECUENCIAS_VALIDAS = ["diaria", "semanal", "destacados"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Cambia la frecuencia o desactiva una suscripción push existente.
// El cliente nunca escribe directo a push_subscriptions (RLS solo permite INSERT);
// esta función usa la service role key y localiza la fila por endpoint,
// que el navegador solo conoce si es dueño de esa suscripción.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { endpoint, frecuencia, activo } = body;

  if (!endpoint || typeof endpoint !== "string") {
    return new Response(JSON.stringify({ error: "Falta endpoint" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const patch: Record<string, unknown> = {};

  if (frecuencia !== undefined) {
    if (!FRECUENCIAS_VALIDAS.includes(frecuencia)) {
      return new Response(JSON.stringify({ error: "Frecuencia inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    patch.frecuencia = frecuencia;
    patch.activo = true; // cambiar de frecuencia reactiva la suscripción
  }

  if (activo === false) {
    patch.activo = false;
  }

  if (Object.keys(patch).length === 0) {
    return new Response(JSON.stringify({ error: "Nada que actualizar" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .update(patch)
    .eq("endpoint", endpoint)
    .select("id");

  if (error) {
    return new Response(JSON.stringify({ error: "No se pudo actualizar" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ message: "Actualizado", filas: data?.length || 0 }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
