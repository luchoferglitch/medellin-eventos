import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = "re_FpmMceDx_4D8QRf4HzMCdUu9BWN7UgFan";
const FROM_EMAIL = "hola@medellinvibra.co";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fecha de mañana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Buscar eventos activos mañana (incluye eventos de varios días)
  const { data: eventos } = await supabase
    .from("events")
    .select("id, title, date, time, place, price, ticket_link, fecha_real, fecha_fin")
    .lte("fecha_real", tomorrowStr)
    .or(`fecha_fin.gte.${tomorrowStr},fecha_fin.is.null`);

  if (!eventos || eventos.length === 0) {
    return new Response(JSON.stringify({ message: "No hay eventos mañana" }), { status: 200 });
  }

  // Para cada evento, buscar usuarios que lo tienen en favoritos
  for (const evento of eventos) {
    const { data: favoritos } = await supabase
      .from("favorites")
      .select("user_id")
      .eq("event_id", evento.id);

    if (!favoritos || favoritos.length === 0) continue;

    // Obtener emails de los usuarios
    for (const fav of favoritos) {
      const { data: userData } = await supabase.auth.admin.getUserById(fav.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      // Enviar correo con Resend
      await fetch("https://api.resend.com/emails", {
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
                  ${evento.ticket_link ? `<a href="${evento.ticket_link}" style="display: inline-block; background: #C8860A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ver entradas →</a>` : ""}
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
    }
  }

  return new Response(JSON.stringify({ message: `Recordatorios enviados para ${eventos.length} eventos` }), { status: 200 });
});