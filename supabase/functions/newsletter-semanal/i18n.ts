// Diccionario propio del newsletter — separado de src/translations.js a propósito.
// Esta función corre en Deno sobre Supabase, fuera del build de Vite; traer el
// diccionario completo del frontend (1385 líneas, cientos de claves de UI que no
// aplican a un correo) acoplaría el deploy de la Edge Function al del sitio.
// Aquí solo van las ~10 claves de texto fijo del correo. El contenido de cada
// evento (título, categoría, precio, lugar) NUNCA se traduce — viene tal cual de
// la BD, siempre en español, sin importar el idioma del suscriptor.

export type Lang = "es" | "en" | "pt" | "fr";

export const SUPPORTED_LANGS: Lang[] = ["es", "en", "pt", "fr"];

export function resolveLang(idioma: string | null | undefined): Lang {
  return SUPPORTED_LANGS.includes(idioma as Lang) ? (idioma as Lang) : "es";
}

// El sitio ya tiene getLocale(lang) en src/lang.js para formatear fechas con
// toLocaleDateString, pero esta función corre en Deno separada de ese build
// (mismo motivo que el resto de este archivo) y, además, ese helper alimenta
// una plantilla de oración distinta ("Del {desde} al {hasta}", con el mes
// repetido dos veces) — no el rótulo compacto de una sola línea que usa el
// newsletter en el subtítulo del header. Se replica aquí la misma idea (una
// tabla de nombres de mes por idioma) con el formato compacto propio del
// correo. El mes usado es el de la fecha final, igual que antes.
const MESES_BY_LANG: Record<Lang, string[]> = {
  es: ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  pt: ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"],
  fr: ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"],
};

export function buildSemanaLabel(desdeDay: number, hastaDay: number, hastaMonthIndex: number, lang: Lang): string {
  const mes = MESES_BY_LANG[lang][hastaMonthIndex];
  switch (lang) {
    case "en": return `${mes} ${desdeDay} to ${hastaDay}`;
    case "pt": return `${desdeDay} a ${hastaDay} de ${mes}`;
    case "fr": return `${desdeDay} au ${hastaDay} ${mes}`;
    default: return `${desdeDay} al ${hastaDay} de ${mes}`;
  }
}

interface NewsletterCopy {
  hi: string;
  subtitleAgenda: string;
  intro: (n: number) => string;
  emptyEvents: string;
  ticketBtn: string;
  detailBtn: string;
  ctaBtn: string;
  ctaSub: string;
  footerReceived: string;
  unsubscribe: string;
  asuntos: (n: number, semanaLabel: string) => [string, string, string, string];
  // Única etiqueta fija del bloque de patrocinador — el mensaje del patrocinador
  // en sí (nombre, mensaje, link) nunca se traduce, viene tal cual lo escribió,
  // siempre en español. Ver comentario en buildPatrocinadorBlock en index.ts.
  patrocinadoPor: string;
}

export const NEWSLETTER_I18N: Record<Lang, NewsletterCopy> = {
  es: {
    hi: "Hola",
    subtitleAgenda: "Tu agenda cultural",
    intro: (n) => `Esta semana Medellín tiene ${n} planes que no te puedes perder. Aquí los mejores:`,
    emptyEvents: "No hay eventos programados para esta semana. ¡Vuelve pronto!",
    ticketBtn: "Comprar boleta →",
    detailBtn: "Ver detalle →",
    ctaBtn: "Ver todos los eventos →",
    ctaSub: "Hay más de 180 eventos en la plataforma",
    footerReceived: "Recibiste este correo porque te suscribiste a Medellín Vibra.",
    unsubscribe: "Cancelar suscripción",
    patrocinadoPor: "Este boletín es presentado por",
    asuntos: (n, semanaLabel) => [
      `🎶 ${n} planes para esta semana en Medellín`,
      `🎭 Lo mejor de Medellín esta semana — ${semanaLabel}`,
      `🏙️ Tu agenda cultural del finde y la semana`,
      `✨ Esta semana en Medellín: música, arte y más`,
    ],
  },
  en: {
    hi: "Hello",
    subtitleAgenda: "Your cultural calendar",
    intro: (n) => `This week Medellín has ${n} plans you can't miss. Here are the best:`,
    emptyEvents: "No events scheduled for this week. Check back soon!",
    ticketBtn: "Buy tickets →",
    detailBtn: "View details →",
    ctaBtn: "See all events →",
    ctaSub: "There are more than 180 events on the platform",
    footerReceived: "You received this email because you subscribed to Medellín Vibra.",
    unsubscribe: "Unsubscribe",
    patrocinadoPor: "This newsletter is brought to you by",
    asuntos: (n, semanaLabel) => [
      `🎶 ${n} plans for this week in Medellín`,
      `🎭 The best of Medellín this week — ${semanaLabel}`,
      `🏙️ Your cultural calendar for the weekend and the week`,
      `✨ This week in Medellín: music, art and more`,
    ],
  },
  pt: {
    hi: "Olá",
    subtitleAgenda: "Sua agenda cultural",
    intro: (n) => `Esta semana Medellín tem ${n} programas que você não pode perder. Aqui estão os melhores:`,
    emptyEvents: "Nenhum evento programado para esta semana. Volte em breve!",
    ticketBtn: "Comprar ingresso →",
    detailBtn: "Ver detalhes →",
    ctaBtn: "Ver todos os eventos →",
    ctaSub: "Há mais de 180 eventos na plataforma",
    footerReceived: "Você recebeu este e-mail porque se inscreveu no Medellín Vibra.",
    unsubscribe: "Cancelar inscrição",
    patrocinadoPor: "Este boletim é apresentado por",
    asuntos: (n, semanaLabel) => [
      `🎶 ${n} programas para esta semana em Medellín`,
      `🎭 O melhor de Medellín esta semana — ${semanaLabel}`,
      `🏙️ Sua agenda cultural do fim de semana e da semana`,
      `✨ Esta semana em Medellín: música, arte e mais`,
    ],
  },
  fr: {
    hi: "Bonjour",
    subtitleAgenda: "Votre agenda culturel",
    intro: (n) => `Cette semaine, Medellín compte ${n} événements à ne pas manquer. Voici les meilleurs :`,
    emptyEvents: "Aucun événement prévu cette semaine. Revenez bientôt !",
    ticketBtn: "Acheter des billets →",
    detailBtn: "Voir les détails →",
    ctaBtn: "Voir tous les événements →",
    ctaSub: "Il y a plus de 180 événements sur la plateforme",
    footerReceived: "Vous recevez cet e-mail car vous êtes abonné à Medellín Vibra.",
    unsubscribe: "Se désabonner",
    patrocinadoPor: "Cette newsletter est présentée par",
    asuntos: (n, semanaLabel) => [
      `🎶 ${n} sorties à ne pas manquer cette semaine à Medellín`,
      `🎭 Le meilleur de Medellín cette semaine — ${semanaLabel}`,
      `🏙️ Votre agenda culturel du week-end et de la semaine`,
      `✨ Cette semaine à Medellín : musique, art et plus`,
    ],
  },
};
