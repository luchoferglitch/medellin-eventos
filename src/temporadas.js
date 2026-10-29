// Calendario de temporadas: decoración liviana del sitio por fechas especiales.
//
// Cada temporada se activa sola entre `desde` y `hasta` (MM-DD, ambos incluidos),
// calculado con la fecha de Colombia (America/Bogota), no la del navegador, para
// que alguien de viaje vea lo mismo que el público de Medellín.
//
// Qué cambia cuando hay una temporada activa (y nada más):
//   - Franja delgada debajo del menú (SeasonalRibbon.jsx) con un enlace a la
//     búsqueda de la temporada. Se puede cerrar y queda cerrada esa temporada.
//   - Ícono pequeño junto al logo.
//   - Figuras decorativas tenues en el hero (HeroBanner.jsx).
// No toca títulos, metadatos, rutas ni contenido indexable: es solo visual.
//
// Para agregar una fecha: copiar un bloque, cambiar id/desde/hasta/textos/colores.
// Los íconos deben existir en lucide-react (nada de emojis en la interfaz).
// Un rango que cruza el año nuevo (p. ej. "12-28" a "01-06") también funciona.

export const TEMPORADAS = [
  {
    id: "halloween-2026",
    desde: "10-25",
    hasta: "10-31",
    // Íconos de lucide-react: el primero va junto al logo y en la franja.
    iconos: ["Ghost", "MoonStar", "Candy", "Skull"],
    colores: {
      fondo: "#2A1740",      // morado noche — contraste >7:1 con el texto crema
      texto: "#FFF4E0",
      acento: "#FF8A2B",     // naranja calabaza
    },
    // Término que se escribe en el buscador del home al tocar la franja.
    busqueda: "halloween",
    textos: {
      es: { mensaje: "Halloween en Medellín y alrededores", cta: "Ver planes" },
      en: { mensaje: "Halloween in Medellín and nearby", cta: "See plans" },
      pt: { mensaje: "Halloween em Medellín e arredores", cta: "Ver programas" },
      fr: { mensaje: "Halloween à Medellín et alentours", cta: "Voir les sorties" },
    },
  },
];

// "MM-DD" de hoy en Colombia (UTC-5 fijo, sin horario de verano).
function hoyBogotaMMDD(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);
  const mes = partes.find((p) => p.type === "month")?.value;
  const dia = partes.find((p) => p.type === "day")?.value;
  return `${mes}-${dia}`;
}

function enRango(hoy, desde, hasta) {
  // Comparación lexicográfica de "MM-DD" funciona dentro del mismo año.
  if (desde <= hasta) return hoy >= desde && hoy <= hasta;
  // Rango que cruza el año nuevo.
  return hoy >= desde || hoy <= hasta;
}

// Permite probar una temporada fuera de fecha con ?temporada=<id> en la URL.
function temporadaForzada() {
  try {
    const id = new URLSearchParams(window.location.search).get("temporada");
    return id ? TEMPORADAS.find((t) => t.id === id) || null : null;
  } catch {
    return null;
  }
}

export function getTemporadaActiva(fecha = new Date()) {
  const forzada = temporadaForzada();
  if (forzada) return forzada;
  const hoy = hoyBogotaMMDD(fecha);
  return TEMPORADAS.find((t) => enRango(hoy, t.desde, t.hasta)) || null;
}
