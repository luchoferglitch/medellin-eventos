import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "./supabase";
import { trackEvent } from "./analytics";

// Invitación al boletín de los viernes dentro de la página de cada evento.
// La mayoría del tráfico entra directo a un evento desde Google y se va sin
// volver: este recuadro es el punto para convertir esa visita en suscriptor.
// Cada suscripción guarda `origen` para poder medir qué invitación funciona.

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function yaSuscrito() {
  try { return localStorage.getItem("mv_subscribed") === "1"; } catch { return false; }
}

function limiteDeIntentos() {
  // Máximo 3 intentos por minuto en este navegador.
  try {
    const ahora = Date.now();
    const previos = JSON.parse(sessionStorage.getItem("mv_nl_evento_intentos") || "[]").filter((t) => ahora - t < 60000);
    if (previos.length >= 3) return false;
    sessionStorage.setItem("mv_nl_evento_intentos", JSON.stringify([...previos, ahora]));
    return true;
  } catch { return true; }
}

export default function NewsletterEventoCTA({ t, lang = "es", eventId }) {
  const [oculto] = useState(yaSuscrito);
  const [email, setEmail] = useState("");
  const [trampa, setTrampa] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | enviando | listo | ya | error | invalido

  if (oculto) return null;

  const enviar = async (e) => {
    e.preventDefault();
    if (trampa) return; // bot
    const limpio = email.trim().toLowerCase().slice(0, 200);
    if (!isValidEmail(limpio)) { setEstado("invalido"); return; }
    if (!limiteDeIntentos()) { setEstado("error"); return; }
    setEstado("enviando");
    const { error } = await supabase.from("subscribers").insert({ email: limpio, idioma: lang, origen: "evento" });
    if (error && error.code !== "23505") { setEstado("error"); return; }
    try { localStorage.setItem("mv_subscribed", "1"); } catch { /* sin storage */ }
    setEstado(error ? "ya" : "listo");
    if (!error) trackEvent({ action: "suscripcion_newsletter", category: "Conversión", label: "evento", value: eventId });
  };

  const terminado = estado === "listo" || estado === "ya";

  return (
    <section className="mv-nl-evento" aria-labelledby="mv-nl-evento-titulo">
      <style>{`
        .mv-nl-evento { background:#fef8ea; border:1px solid #f1d58f; border-radius:14px; padding:18px 20px; margin:0 0 32px; text-align:left; }
        .mv-nl-evento-cab { display:flex; gap:12px; align-items:flex-start; }
        .mv-nl-evento-icono { width:40px; height:40px; border-radius:50%; background:#C8860A; color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mv-nl-evento h2 { font-family:inherit; font-size:16px; font-weight:700; letter-spacing:0; line-height:1.3; color:#3d2a00; margin:0 0 4px; }
        .mv-nl-evento p { font-size:14px; line-height:1.5; color:#6b5320; margin:0; }
        .mv-nl-evento form { display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
        .mv-nl-evento input[type=email] { flex:1 1 200px; min-width:0; padding:12px 14px; border:1px solid #d9b968; border-radius:10px; font-size:15px; font-family:inherit; background:#fff; color:#1a1a1a; }
        .mv-nl-evento button { flex:0 0 auto; padding:12px 20px; background:#C8860A; color:#fff; border:none; border-radius:10px; font-weight:700; font-size:15px; font-family:inherit; cursor:pointer; }
        .mv-nl-evento button:disabled { opacity:.6; cursor:default; }
        .mv-nl-evento input:focus-visible, .mv-nl-evento button:focus-visible { outline:3px solid #1a1a1a; outline-offset:2px; }
        .mv-nl-evento-msg { font-size:13px; margin-top:8px; color:#b42318; }
        .mv-nl-evento-ok { display:flex; align-items:center; gap:8px; margin-top:12px; font-size:14px; font-weight:700; color:#047857; }
        .mv-nl-trampa { position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }
        .dark-mode .mv-nl-evento { background:#2a2214; border-color:#5c4718; }
        .dark-mode .mv-nl-evento h2 { color:#fbe3a3; }
        .dark-mode .mv-nl-evento p { color:#d9c79b; }
        .dark-mode .mv-nl-evento input[type=email] { background:#1e1e1e; color:#f3f4f6; border-color:#5c4718; }
        .dark-mode .mv-nl-evento input:focus-visible, .dark-mode .mv-nl-evento button:focus-visible { outline-color:#fbe3a3; }
        .dark-mode .mv-nl-evento-msg { color:#fda29b; }
        .dark-mode .mv-nl-evento-ok { color:#6ee7b7; }
      `}</style>
      <div className="mv-nl-evento-cab">
        <div className="mv-nl-evento-icono" aria-hidden="true"><Mail size={20} /></div>
        <div>
          <h2 id="mv-nl-evento-titulo">{t.eventoNlTitle}</h2>
          <p>{t.eventoNlText}</p>
        </div>
      </div>
      {terminado ? (
        <div className="mv-nl-evento-ok" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          {estado === "listo" ? t.eventoNlDone : t.eventoNlAlready}
        </div>
      ) : (
        <form onSubmit={enviar} noValidate>
          <label className="mv-nl-trampa" aria-hidden="true">
            No llenar
            <input type="text" tabIndex={-1} autoComplete="off" value={trampa} onChange={(e) => setTrampa(e.target.value)} />
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-label={t.ctaEmailPlaceholder}
            placeholder={t.ctaEmailPlaceholder}
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (estado === "invalido" || estado === "error") setEstado("idle"); }}
            required
          />
          <button type="submit" disabled={estado === "enviando"}>{t.ctaSubscribeBtn}</button>
          {(estado === "invalido" || estado === "error") && (
            <div className="mv-nl-evento-msg" role="alert" style={{ flexBasis: "100%" }}>
              {estado === "invalido" ? t.eventoNlInvalid : t.eventoNlError}
            </div>
          )}
        </form>
      )}
    </section>
  );
}
