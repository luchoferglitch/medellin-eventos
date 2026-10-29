// Calendario de temporadas: decoración liviana del sitio por fechas especiales.
//
// Cada temporada se activa sola entre su fecha de inicio y de fin (ambas
// incluidas), calculado con la fecha de Colombia (America/Bogota), no la del
// navegador, para que alguien de viaje vea lo mismo que el público de Medellín.
//
// Qué cambia cuando hay una temporada activa (y nada más):
//   - Franja delgada debajo del menú (SeasonalRibbon.jsx). Al tocarla, si hay
//     eventos con la palabra de `busqueda`, filtra por ella; si no, baja a la
//     agenda. Se puede cerrar y queda cerrada esa temporada ese año.
//   - Ícono pequeño junto al logo (solo en computador).
//   - Figuras con brillo y un velo de color en el hero (HeroBanner.jsx).
// No toca títulos, metadatos, rutas ni contenido indexable: es solo visual.
//
// Fechas:
//   - Fijas: `desde` / `hasta` en "MM-DD". Un rango que cruza el año nuevo
//     ("12-31" a "01-01") también funciona.
//   - Móviles (Semana Santa, Día de la Madre, Día del Padre): `fechas(año)`
//     devuelve { desde, hasta } en "MM-DD" calculados para ese año.
// Si dos temporadas se cruzan, gana la que aparece primero en la lista.
//
// Íconos: deben existir en lucide-react y estar registrados en
// ICONOS_TEMPORADA (SeasonalRibbon.jsx). Nada de emojis en la interfaz.
//
// Para probar una temporada fuera de fecha: agregar ?temporada=<id> a la URL.

const mmdd = (d) => `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
const sumarDias = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));

// Domingo de Pascua (algoritmo de Meeus/Jones/Butcher, calendario gregoriano).
export function domingoDePascua(año) {
  const a = año % 19, b = Math.floor(año / 100), c = año % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(año, mes - 1, dia));
}

// n-ésimo domingo de un mes (mes 1-12).
export function enesimoDomingo(año, mes, n) {
  const primero = new Date(Date.UTC(año, mes - 1, 1));
  const hastaDomingo = (7 - primero.getUTCDay()) % 7;
  return sumarDias(primero, hastaDomingo + 7 * (n - 1));
}

// Semana que termina en un domingo dado (lunes a domingo).
const semanaHasta = (domingo) => ({ desde: mmdd(sumarDias(domingo, -6)), hasta: mmdd(domingo) });

export const TEMPORADAS = [
  // ── Primer semestre ──────────────────────────────────────────────
  {
    id: "semana-santa",
    // Domingo de Ramos a Domingo de Resurrección.
    fechas: (año) => {
      const pascua = domingoDePascua(año);
      return { desde: mmdd(sumarDias(pascua, -7)), hasta: mmdd(pascua) };
    },
    iconos: ["Church", "Flame", "Sprout", "Sunrise"],
    colores: { fondo: "#3B2A4A", texto: "#F7F1FA", acento: "#E8C46A" },
    busqueda: "semana santa",
    textos: {
      es: { mensaje: "Semana Santa en Medellín y el Oriente", cta: "Ver agenda" },
      en: { mensaje: "Holy Week in Medellín and the East", cta: "See schedule" },
      pt: { mensaje: "Semana Santa em Medellín e no Oriente", cta: "Ver agenda" },
      fr: { mensaje: "Semaine sainte à Medellín et dans l'Est", cta: "Voir l'agenda" },
    },
  },
  {
    id: "dia-de-la-madre",
    // Segundo domingo de mayo: se muestra toda esa semana.
    fechas: (año) => semanaHasta(enesimoDomingo(año, 5, 2)),
    iconos: ["Flower2", "Heart", "Gift", "Sparkles"],
    colores: { fondo: "#5A1E3A", texto: "#FFF1F5", acento: "#FF8FB1" },
    busqueda: null,
    textos: {
      es: { mensaje: "Día de la Madre: planes para celebrarla", cta: "Ver planes" },
      en: { mensaje: "Mother's Day: plans to celebrate her", cta: "See plans" },
      pt: { mensaje: "Dia das Mães: programas para celebrar", cta: "Ver programas" },
      fr: { mensaje: "Fête des mères : des sorties pour la célébrer", cta: "Voir les sorties" },
    },
  },
  {
    id: "dia-del-maestro",
    desde: "05-15",
    hasta: "05-15",
    iconos: ["GraduationCap", "BookOpen", "Pencil", "Apple"],
    colores: { fondo: "#1E3A5F", texto: "#F0F6FF", acento: "#F2C14E" },
    busqueda: null,
    textos: {
      es: { mensaje: "Feliz Día del Maestro", cta: "Ver agenda" },
      en: { mensaje: "Happy Teachers' Day", cta: "See schedule" },
      pt: { mensaje: "Feliz Dia do Professor", cta: "Ver agenda" },
      fr: { mensaje: "Bonne fête des enseignants", cta: "Voir l'agenda" },
    },
  },
  {
    id: "dia-del-padre",
    // Tercer domingo de junio: se muestra toda esa semana.
    fechas: (año) => semanaHasta(enesimoDomingo(año, 6, 3)),
    iconos: ["Coffee", "Award", "Gift", "Star"],
    colores: { fondo: "#1F3B3A", texto: "#EEFAF8", acento: "#6FD3C1" },
    busqueda: null,
    textos: {
      es: { mensaje: "Día del Padre: planes para celebrarlo", cta: "Ver planes" },
      en: { mensaje: "Father's Day: plans to celebrate him", cta: "See plans" },
      pt: { mensaje: "Dia dos Pais: programas para celebrar", cta: "Ver programas" },
      fr: { mensaje: "Fête des pères : des sorties pour le célébrer", cta: "Voir les sorties" },
    },
  },

  // ── Segundo semestre ─────────────────────────────────────────────
  {
    id: "feria-de-las-flores",
    // La Alcaldía anuncia las fechas cada año: ajustar aquí cuando salgan.
    desde: "08-01",
    hasta: "08-10",
    iconos: ["Flower", "Flower2", "Music", "Sparkles"],
    colores: { fondo: "#1F4D2B", texto: "#F3FFF4", acento: "#FFC93C" },
    busqueda: "feria de las flores",
    textos: {
      es: { mensaje: "Feria de las Flores: silleteros, tablados y conciertos", cta: "Ver planes" },
      en: { mensaje: "Flower Festival: silleteros, stages and concerts", cta: "See plans" },
      pt: { mensaje: "Feira das Flores: silleteros, palcos e shows", cta: "Ver programas" },
      fr: { mensaje: "Fête des Fleurs : silleteros, scènes et concerts", cta: "Voir les sorties" },
    },
  },
  {
    id: "antioquenidad",
    desde: "08-11",
    hasta: "08-11",
    iconos: ["Mountain", "Coffee", "Music", "Star"],
    colores: { fondo: "#14532D", texto: "#F2FFF6", acento: "#8EE4A8" },
    busqueda: "antioqueñidad",
    textos: {
      es: { mensaje: "Día de la Antioqueñidad", cta: "Ver planes" },
      en: { mensaje: "Antioquia Identity Day", cta: "See plans" },
      pt: { mensaje: "Dia da Antioquenidade", cta: "Ver programas" },
      fr: { mensaje: "Journée de l'identité d'Antioquia", cta: "Voir les sorties" },
    },
  },
  {
    id: "halloween",
    desde: "10-25",
    hasta: "10-31",
    iconos: ["Ghost", "MoonStar", "Candy", "Skull"],
    colores: { fondo: "#2A1740", texto: "#FFF4E0", acento: "#FF8A2B" },
    busqueda: "halloween",
    textos: {
      es: { mensaje: "Halloween en Medellín y alrededores", cta: "Ver planes" },
      en: { mensaje: "Halloween in Medellín and nearby", cta: "See plans" },
      pt: { mensaje: "Halloween em Medellín e arredores", cta: "Ver programas" },
      fr: { mensaje: "Halloween à Medellín et alentours", cta: "Voir les sorties" },
    },
  },
  {
    id: "todos-los-santos",
    // Todos los Santos (1) y Fieles Difuntos (2), hasta el final del día 3.
    // Tono sobrio: es una fecha de memoria, no de fiesta.
    desde: "11-01",
    hasta: "11-03",
    iconos: ["Flame", "Flower2", "Church", "Moon"],
    colores: { fondo: "#26222E", texto: "#F4F1EA", acento: "#E7B95C" },
    busqueda: null,
    textos: {
      es: { mensaje: "Todos los Santos y Fieles Difuntos: días de memoria", cta: "Ver agenda" },
      en: { mensaje: "All Saints' and All Souls' Days: days of remembrance", cta: "See schedule" },
      pt: { mensaje: "Todos os Santos e Finados: dias de memória", cta: "Ver agenda" },
      fr: { mensaje: "Toussaint et Jour des morts : jours de mémoire", cta: "Voir l'agenda" },
    },
  },
  {
    id: "velitas",
    desde: "12-07",
    hasta: "12-08",
    iconos: ["Flame", "Lamp", "Sparkles", "Star"],
    colores: { fondo: "#3A2208", texto: "#FFF6E6", acento: "#FFB547" },
    busqueda: "alumbrado",
    textos: {
      es: { mensaje: "Noche de Velitas y alumbrados navideños", cta: "Ver planes" },
      en: { mensaje: "Night of the Little Candles and Christmas lights", cta: "See plans" },
      pt: { mensaje: "Noite das Velinhas e iluminação de Natal", cta: "Ver programas" },
      fr: { mensaje: "Nuit des Petites Bougies et illuminations de Noël", cta: "Voir les sorties" },
    },
  },
  {
    id: "navidad",
    // Novenas de aguinaldos (16 al 24) y Navidad (25).
    desde: "12-16",
    hasta: "12-25",
    iconos: ["TreePine", "Star", "Gift", "Bell"],
    colores: { fondo: "#14361F", texto: "#FFF8EC", acento: "#E8473C" },
    busqueda: "navidad",
    textos: {
      es: { mensaje: "Novenas y Navidad en Medellín", cta: "Ver planes" },
      en: { mensaje: "Novenas and Christmas in Medellín", cta: "See plans" },
      pt: { mensaje: "Novenas e Natal em Medellín", cta: "Ver programas" },
      fr: { mensaje: "Neuvaines et Noël à Medellín", cta: "Voir les sorties" },
    },
  },
  {
    id: "ano-nuevo",
    // Cruza el año: 31 de diciembre y 1 de enero.
    desde: "12-31",
    hasta: "01-01",
    iconos: ["PartyPopper", "Sparkles", "Star", "Clock"],
    colores: { fondo: "#1A1A2E", texto: "#FFF8E7", acento: "#F5C542" },
    busqueda: null,
    textos: {
      es: { mensaje: "¡Feliz Año Nuevo!", cta: "Ver agenda" },
      en: { mensaje: "Happy New Year!", cta: "See schedule" },
      pt: { mensaje: "Feliz Ano Novo!", cta: "Ver agenda" },
      fr: { mensaje: "Bonne année !", cta: "Voir l'agenda" },
    },
  },
];

// Fecha de hoy en Colombia: { año, mmdd: "MM-DD" }.
function hoyBogota(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);
  const v = (t) => partes.find((p) => p.type === t)?.value;
  return { año: Number(v("year")), mmdd: `${v("month")}-${v("day")}` };
}

function enRango(hoy, desde, hasta) {
  // Comparación lexicográfica de "MM-DD" funciona dentro del mismo año.
  if (desde <= hasta) return hoy >= desde && hoy <= hasta;
  // Rango que cruza el año nuevo.
  return hoy >= desde || hoy <= hasta;
}

export function rangoDe(temporada, año) {
  return temporada.fechas ? temporada.fechas(año) : { desde: temporada.desde, hasta: temporada.hasta };
}

function temporadaForzada() {
  try {
    const id = new URLSearchParams(window.location.search).get("temporada");
    return id ? TEMPORADAS.find((t) => t.id === id) || null : null;
  } catch {
    return null;
  }
}

export function getTemporadaActiva(fecha = new Date(), { permitirForzar = true } = {}) {
  if (permitirForzar) {
    const forzada = temporadaForzada();
    if (forzada) return forzada;
  }
  const { año, mmdd: hoy } = hoyBogota(fecha);
  return TEMPORADAS.find((t) => {
    const { desde, hasta } = rangoDe(t, año);
    return enRango(hoy, desde, hasta);
  }) || null;
}

// Año de Colombia, para que "cerrar la franja" valga solo para esa temporada ese año.
export function añoBogota(fecha = new Date()) {
  return hoyBogota(fecha).año;
}
