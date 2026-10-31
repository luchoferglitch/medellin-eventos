import { supabase } from "./supabase";
import { visitanteAnonimo, tipoDispositivo } from "./registrarClic";

// Registra de qué campaña llega una visita (enlaces con utm_*, por ejemplo
// medellinvibra.co/ig/carrusel-halloween, o el enlace de la bio de Instagram,
// que Instagram ya marca solo con utm_source=ig). Una sola vez
// por sesión y solo cuando la URL de entrada trae utm_source, para poder
// comparar qué publicación de Instagram (u otro canal) trae gente al sitio.
// Complementa a Google Analytics, que también lee los utm por su cuenta.
export async function registrarCampana() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fuente = params.get("utm_source");
    if (!fuente) return;
    if (sessionStorage.getItem("mv_campana_registrada") === "1") return;
    sessionStorage.setItem("mv_campana_registrada", "1");
    const corta = (v) => (v ? v.toLowerCase().slice(0, 80) : null);
    await supabase.from("visitas_campana").insert({
      fuente: corta(fuente),
      medio: corta(params.get("utm_medium")),
      campana: corta(params.get("utm_campaign")),
      pagina: window.location.pathname.slice(0, 200),
      visitante: visitanteAnonimo(),
      dispositivo: tipoDispositivo(),
    });
  } catch {
    // Nunca afectar la navegación por un fallo de medición.
  }
}
