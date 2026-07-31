import { supabase } from "./supabase";

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
      event_id:   eventId,
      ticket_url: ticketUrl,
      page,
    });
  } catch {
    // Silencioso — nunca bloquear la experiencia del usuario por un fallo de tracking
  }
}
