import { supabase } from "./supabase";

// Identificador anónimo del navegador (no es un dato personal: es un número
// al azar guardado en este dispositivo). Sirve para contar personas distintas
// y no solo clics, y para detectar clics repetidos o automáticos.
function visitanteAnonimo() {
  try {
    let id = localStorage.getItem("mv_vid");
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      localStorage.setItem("mv_vid", id);
    }
    return id;
  } catch { return null; }
}

// Tipo de dispositivo, sin guardar el user agent completo.
function tipoDispositivo() {
  const ua = navigator.userAgent || "";
  if (navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp/i.test(ua)) return "bot";
  return /Mobi|Android|iPhone|iPad/i.test(ua) ? "movil" : "escritorio";
}

/**
 * Registra un clic en "Comprar boleta" y abre el link.
 * @param {number} eventId       - ID del evento
 * @param {string} ticketUrl     - URL de la boletería
 * @param {string} page          - Página origen: 'home' | 'evento' | 'hoy' | 'esta-semana' | 'finde'
 * @param {string} eventName     - Título del evento (para el evento de GA4)
 * @param {string} eventCategory - Categoría del evento (para el evento de GA4)
 */
export async function registrarClic(eventId, ticketUrl, page = "home", eventName = "", eventCategory = "") {
  // Abrir el link inmediatamente — no esperar a que el INSERT termine
  window.open(ticketUrl, "_blank", "noopener,noreferrer");

  if (typeof window.gtag === "function") {
    window.gtag("event", "comprar_boleta", {
      evento_id: eventId,
      evento_nombre: eventName,
      evento_categoria: eventCategory,
    });
  }

  // Registrar en segundo plano (fire & forget)
  try {
    await supabase.from("clicks").insert({
      event_id:    eventId,
      ticket_url:  ticketUrl,
      page,
      visitante:   visitanteAnonimo(),
      dispositivo: tipoDispositivo(),
    });
  } catch {
    // Silencioso — nunca bloquear la experiencia del usuario por un fallo de tracking
  }
}
