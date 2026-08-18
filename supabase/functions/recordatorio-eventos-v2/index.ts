import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "hola@medellinvibra.co";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://www.medellinvibra.co";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function logRecordatorio(
  estado: "ok" | "parcial" | "error",
  eventosManana: number | null,
  destinatarios: number | null,
  enviados: number,
  errores: number,
  mensajeError: string | null,
) {
  try {
    await supabase.from("recordatorio_log").insert({
      estado,
      eventos_manana: eventosManana,
      destinatarios,
      enviados,
      errores,
      mensaje_error: mensajeError,
    });
  } catch (_e) {
    // Si el log falla, no debe tumbar el envío de recordatorios.
  }
}

Deno.serve(async () => {
  // eventos_manana y destinatarios quedan en null hasta que se conocen sus
  // valores reales. Si el error ocurre antes, se loguea NULL en vez de 0,
  // para distinguir "no llegué a contar" de "conté 0 reales".
  let eventosManana: number | null = null;
  let destinatarios: number | null = null;

  try {
    // Fecha de mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Buscar eventos activos EXACTAMENTE mañana (un solo día) o multi-día que siga activo mañana
    const { data: eventos, error: eventosError } = await supabase
      .from("events")
      .select("id, title, date, time, place, price, ticket_link, fecha_real, fecha_fin")
      .or(`fecha_real.eq.${tomorrowStr},and(fecha_real.lte.${tomorrowStr},fecha_fin.gte.${tomorrowStr})`);

    if (eventosError) {
      throw new Error(`Error consultando eventos: ${eventosError.message}`);
    }
    eventosManana = eventos?.length ?? 0;

    if (!eventos || eventos.length === 0) {
      await logRecordatorio("ok", eventosManana, 0, 0, 0, null);
      return new Response(JSON.stringify({ message: "No hay eventos manana" }), { status: 200 });
    }

    // Recolectar todos los pares (evento, email) a notificar ANTES de enviar
    // nada, para conocer el total de destinatarios de una vez.
    const pendientes: { evento: (typeof eventos)[number]; email: string }[] = [];

    for (const evento of eventos) {
      const { data: favoritos, error: favoritosError } = await supabase
        .from("favorites")
        .select("user_id")
        .eq("event_id", evento.id);

      if (favoritosError) {
        throw new Error(`Error consultando favoritos del evento ${evento.id}: ${favoritosError.message}`);
      }
      if (!favoritos || favoritos.length === 0) continue;

      for (const fav of favoritos) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(fav.user_id);
        if (userError) {
          throw new Error(`Error consultando usuario ${fav.user_id}: ${userError.message}`);
        }
        const email = userData?.user?.email;
        if (!email) continue;
        pendientes.push({ evento, email });
      }
    }

    destinatarios = pendientes.length;

    if (pendientes.length === 0) {
      await logRecordatorio("ok", eventosManana, 0, 0, 0, null);
      return new Response(
        JSON.stringify({ message: `Eventos mañana: ${eventos.length}, sin destinatarios` }),
        { status: 200 }
      );
    }

    let enviados = 0;
    let errores = 0;

    for (const { evento, email } of pendientes) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Medellín Vibra <${FROM_EMAIL}>`,
          to: [email],
          subject: `🎉 Recuerda: "${evento.title}" es mañana`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #C8860A; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">MEDELLÍN VIBRA</h1>
              </div>
              <div style="padding: 32px; background: #f5f3ef;">
                <h2 style="color: #1a1a1a;">¡Tu evento es mañana! 🎉</h2>
                <div style="background: white; border-radius: 12px; padding: 24px; margin: 20px 0;">
                  <h3 style="color: #C8860A; margin-top: 0;">${evento.title}</h3>
                  <p>📅 <strong>${evento.date}</strong> · ${evento.time}</p>
                  <p>📍 ${evento.place}</p>
                  <p>💰 ${evento.price}</p>
                  ${evento.ticket_link ? `<a href="${SITE}/api/r?event_id=${evento.id}&page=email_recordatorio" style="display: inline-block; background: #C8860A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ver entradas →</a>` : ""}
                </div>
                <p style="color: #888; font-size: 14px;">Gracias por elegirnos. En Medellín Vibra estamos aquí para que nunca te pierdas lo que pasa en tu ciudad 🎉</p>
                <p style="color: #888; font-size: 12px;">
                  Equipo Medellín Vibra<br>
                  hola@medellinvibra.co<br>
                  medellinvibra.co
                </p>
              </div>
            </div>
          `,
        }),
      });
      if (res.ok) enviados++;
      else errores++;
    }

    const estado = errores === 0 ? "ok" : (enviados === 0 ? "error" : "parcial");
    const mensajeError = estado === "error" ? "Todos los envíos a Resend fallaron" : null;
    await logRecordatorio(estado, eventosManana, destinatarios, enviados, errores, mensajeError);

    return new Response(
      JSON.stringify({ message: `Recordatorios enviados para ${eventos.length} eventos`, destinatarios, enviados, errores }),
      { status: 200 }
    );
  } catch (err) {
    const mensajeError = err instanceof Error ? err.message : String(err);
    await logRecordatorio("error", eventosManana, destinatarios, 0, 0, mensajeError);
    return new Response(JSON.stringify({ error: mensajeError }), { status: 500 });
  }
});
