const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "hola@medellinvibra.co";
const ADMIN_EMAIL = "hola@medellinvibra.co";
const SECRET = Deno.env.get("APROBAR_EVENTO_SECRET") ?? "";
const FUNCTIONS_BASE = "https://jtbqaqugnqkympwnfsod.supabase.co/functions/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sign(id: string, action: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${id}:${action}`));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { id, title, organizer, contact, place, date } = await req.json();

  let actionButtons = `<a href="https://supabase.com/dashboard/project/jtbqaqugnqkympwnfsod/editor" style="display: inline-block; background: #C8860A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ir a Supabase →</a>`;

  if (id) {
    const approveToken = await sign(String(id), "aprobado");
    const rejectToken = await sign(String(id), "rechazado");
    const approveLink = `${FUNCTIONS_BASE}/aprobar-evento?id=${id}&action=aprobado&token=${approveToken}`;
    const rejectLink = `${FUNCTIONS_BASE}/aprobar-evento?id=${id}&action=rechazado&token=${rejectToken}`;
    actionButtons = `
      <div style="display:flex; gap:12px;">
        <a href="${approveLink}" style="flex:1; text-align:center; background:#059669; color:white; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold;">✓ Aprobar</a>
        <a href="${rejectLink}" style="flex:1; text-align:center; background:#C0392B; color:white; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold;">✕ Rechazar</a>
      </div>
    `;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Medellín Vibra <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `⚠️ Nuevo evento pendiente de aprobación: "${title}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #C8860A; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">MEDELLÍN VIBRA</h1>
            <p style="color: white; margin: 8px 0 0;">Panel de Administración</p>
          </div>
          <div style="padding: 32px; background: #f5f3ef;">
            <h2 style="color: #C0392B;">⚠️ Nuevo evento pendiente de aprobación</h2>
            <div style="background: white; border-radius: 12px; padding: 24px; margin: 20px 0;">
              <h3 style="color: #C8860A; margin-top: 0;">${title}</h3>
              <p>📍 <strong>Lugar:</strong> ${place}</p>
              <p>📅 <strong>Fecha:</strong> ${date}</p>
              <p>👤 <strong>Organizador:</strong> ${organizer || "No especificado"}</p>
              <p>📞 <strong>Contacto:</strong> ${contact || "No especificado"}</p>
            </div>
            ${actionButtons}
            <p style="color: #999; font-size:12px; margin-top:20px;">Si los botones no funcionan, entra a Supabase → Table Editor → events y cambia el campo estado manualmente.</p>
          </div>
        </div>
      `,
    }),
  });

  return new Response(JSON.stringify({ message: "Alerta enviada" }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
