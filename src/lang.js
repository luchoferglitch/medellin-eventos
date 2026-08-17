export const LANG_PREFIXES = ["en", "pt", "fr"];

// Español vive sin prefijo en "/" — las demás rutas empiezan con /en, /pt o /fr.
// Mismo criterio en toda la app: se lee el primer segmento del path, no hay
// estado de idioma separado que sincronizar.
export function getLangFromPath(pathname) {
  const firstSegment = pathname.split("/")[1];
  return LANG_PREFIXES.includes(firstSegment) ? firstSegment : "es";
}

export function getLangPrefix(lang) {
  return lang === "es" ? "" : `/${lang}`;
}

// Para toLocaleDateString(...) — solo afecta cómo se formatea la fecha de HOY
// (generada en el cliente), nunca el contenido de un evento (eso viene ya
// formateado en español desde la BD y no se toca).
const LOCALE_MAP = { es: "es-CO", en: "en-US", pt: "pt-BR", fr: "fr-FR" };
export function getLocale(lang) {
  return LOCALE_MAP[lang] || "es-CO";
}
