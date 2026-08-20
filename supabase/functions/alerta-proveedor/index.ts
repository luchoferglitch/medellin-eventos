const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "hola@medellinvibra.co";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "hola@medellinvibra.co";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { nombre, tipoServicio, zona, whatsapp, email } = await req.json();

  const resendResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Medellín Vibra <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `⚠️ Nuevo proveedor pendiente de aprobación: "${nombre}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #C8860A; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">MEDELLÍN VIBRA</h1>
            <p style="color: white; margin: 8px 0 0;">Panel de Administración</p>
          </div>
          <div style="padding: 32px; background: #f5f3ef;">
            <h2 style="color: #C0392B;">⚠️ Nuevo proveedor pendiente de aprobación</h2>
            <div style="background: white; border-radius: 12px; padding: 24px; margin: 20px 0;">
              <h3 style="color: #C8860A; margin-top: 0;">${nombre}</h3>
              <p>🛠️ <strong>Tipo de servicio:</strong> ${tipoServicio || "No especificado"}</p>
              <p>📍 <strong>Zona:</strong> ${zona || "No especificada"}</p>
              <p>📞 <strong>WhatsApp:</strong> ${whatsapp || "No especificado"}</p>
              <p>✉️ <strong>Correo:</strong> ${email || "No especificado"}</p>
            </div>
            <p style="color: #555;">Para aprobar o rechazar este proveedor, ingresa a Supabase → Table Editor → proveedores y cambia el campo <strong>estado</strong> a <strong>aprobado</strong> o <strong>rechazado</strong>.</p>
            <a href="https://supabase.com/dashboard/project/jtbqaqugnqkympwnfsod/editor" style="display: inline-block; background: #C8860A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ir a Supabase →</a>
          </div>
        </div>
      `,
    }),
  });

  if (!resendResp.ok) {
    const errorBody = await resendResp.text();
    console.error(`Resend error ${resendResp.status}: ${errorBody}`);
    return new Response(JSON.stringify({ message: "Error al enviar la alerta", resendStatus: resendResp.status, resendError: errorBody }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Alerta enviada" }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
