import { Helmet } from 'react-helmet-async';

const BASE_URL = "https://www.medellinvibra.co";
const LANGS = ["es", "en", "pt", "fr"];

// Español vive sin prefijo en "/" — las demás usan /en, /pt, /fr.
const buildHreflangUrl = (lang, basePath) => {
  const prefix = lang === "es" ? "" : `/${lang}`;
  const path = basePath === "/" ? (prefix || "/") : `${prefix}${basePath}`;
  return `${BASE_URL}${path}`;
};

/**
 * Emite los 5 <link rel="alternate" hreflang="..."> de una página (4 idiomas +
 * x-default, que apunta a la versión en español) dado su path sin prefijo
 * de idioma (ej. "/", "/medellin", "/area-metropolitana", "/oriente-cercano").
 */
export default function HreflangTags({ basePath }) {
  return (
    <Helmet>
      {LANGS.map((lang) => (
        <link key={lang} rel="alternate" hreflang={lang} href={buildHreflangUrl(lang, basePath)} />
      ))}
      <link rel="alternate" hreflang="x-default" href={buildHreflangUrl("es", basePath)} />
    </Helmet>
  );
}
