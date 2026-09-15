import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

// Mismo email que las políticas RLS de events/proveedores (auth.email() = ...).
const ADMINS = ["luchofer2001@gmail.com"];

// tag no tiene CHECK constraint en la base de datos (a diferencia de category) —
// esta es la única barrera contra un valor inválido ahora que el INSERT corre con
// service_role y ya no pasa por el with_check de RLS.
const TAGS_VALIDOS = ["Destacado", "Últimas entradas", "Agotado", "Nuevo"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Falta autenticación" }, 401);

  const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
  if (userError || !userData?.user) return json({ error: "Token inválido" }, 401);

  const user = userData.user;
  const esAdmin = ADMINS.includes(user.email ?? "");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const title = str(body.title, 200);
  const place = str(body.place, 300);
  const date = str(body.date, 100);
  const organizerName = str(body.organizer_name, 150);
  if (!title || !place || !date || !organizerName) {
    return json({ error: "Completa los campos obligatorios (incluyendo organizador)" }, 400);
  }

  const tagRaw = body.tag;
  const tag = typeof tagRaw === "string" && tagRaw.trim() ? tagRaw.trim() : null;
  if (tag && !TAGS_VALIDOS.includes(tag)) {
    return json({ error: "Tag inválido" }, 400);
  }

  const payload = {
    title,
    category: str(body.category, 50),
    date,
    fecha_real: date,
    fecha_fin: date,
    time: str(body.time, 50),
    place,
    como_llegar: str(body.como_llegar, 300) || null,
    price: str(body.price, 50) || "Gratis",
    capacity: parseInt(String(body.capacity)) || 0,
    attendees: 0,
    description: str(body.description, 2000),
    emoji: str(body.emoji, 10),
    tag,
    ticket_platform: str(body.ticket_platform, 100),
    ticket_link: str(body.ticket_link, 500),
    color: "linear-gradient(135deg,#1a0a00,#2a1500)",
    organizer_name: organizerName,
    organizer_contact: str(body.organizer_contact, 150),
    performer: str(body.performer, 150) || null,
    recurrencia: body.recurrencia || null,
    dia_semana: body.dia_semana !== "" && body.dia_semana != null ? parseInt(String(body.dia_semana)) : null,
    dia_mes: body.dia_mes !== "" && body.dia_mes != null ? parseInt(String(body.dia_mes)) : null,
    image_url: body.image_url || null,
    user_id: user.id,
    estado: esAdmin ? "aprobado" : "pendiente",
  };

  const { data: nuevoEvento, error } = await adminClient
    .from("events")
    .insert([payload])
    .select()
    .single();

  if (error) return json({ error: error.message }, 500);

  if (!esAdmin) {
    try {
      await fetch(`${FUNCTIONS_BASE}/alerta-evento`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}` },
        body: JSON.stringify({
          id: nuevoEvento.id,
          title: payload.title,
          organizer: payload.organizer_name,
          contact: payload.organizer_contact,
          place: payload.place,
          date: payload.date,
        }),
      });
    } catch (e) {
      console.error("No se pudo enviar alerta-evento", e);
    }
  }

  return json({ data: nuevoEvento, error: null });
});
