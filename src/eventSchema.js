// JSON-LD schema.org/Event para un evento crudo de la tabla `events`
// (snake_case, tal como lo devuelve `select("*")`). Lo usan las páginas de
// listado — OrganizadorPage, CategoriaPage, BarrioPage y GratisPage — que
// Google renderiza con JS. Antes cada una armaba un Event mínimo (sin
// organizer, offers ni image) y Search Console lo marcaba en la validación
// de "Datos estructurados de Eventos" (caso real: /organizador/... con
// "Laboratorio Montaña Azul").
//
// Mismas reglas que el JSON-LD de api/og.js y src/EventoPage.jsx:
// - endDate siempre (fecha_fin o, si falta, fecha_real)
// - organizer siempre, con url a su página de organizador
// - offers siempre; price solo si se puede leer del texto (nunca inventado)
// - performer solo si events.performer está lleno
// - addressLocality tomado del propio `place` ("..., Municipio, Antioquia")
import { esGratis } from "./priceLabel.js";

const DOMINIO = "https://www.medellinvibra.co";
const IMAGEN_DEFAULT = "https://pub-c5ba255ea192436da56e91e3ef3ecfa5.r2.dev/default-fallback-medellin";

const slugify = (str) =>
  str?.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 80) || "";

const municipioDe = (ev) => {
  const partes = (ev.place || "").split(",").map((p) => p.trim()).filter(Boolean);
  const i = partes.findIndex((p) => /^antioquia$/i.test(p));
  if (i > 0) return partes[i - 1];
  return ev.zona === "Medellín" ? "Medellín" : null;
};

export function buildEventSchema(ev, { withContext = false } = {}) {
  const url = `${DOMINIO}/evento/${slugify(ev.title)}-${ev.id}`;
  const gratis = esGratis(ev.price);
  const match = (ev.price || "").match(/[0-9][0-9.,]*/);
  const price = gratis ? "0" : (match ? match[0].replace(/\./g, "").replace(/,/g, "") : undefined);
  const municipio = municipioDe(ev);
  const startDate = ev.fecha_real || undefined;

  return {
    ...(withContext ? { "@context": "https://schema.org" } : {}),
    "@type": "Event",
    name: ev.title,
    startDate,
    endDate: ev.fecha_fin || startDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url,
    image: [ev.image_url || IMAGEN_DEFAULT],
    ...(ev.description ? { description: ev.description.slice(0, 300) } : {}),
    ...(ev.place
      ? {
          location: {
            "@type": "Place",
            name: ev.place,
            address: {
              "@type": "PostalAddress",
              ...(municipio ? { addressLocality: municipio } : {}),
              addressRegion: "Antioquia",
              addressCountry: "CO",
            },
          },
        }
      : {}),
    ...(ev.performer ? { performer: { "@type": "Person", name: ev.performer } } : {}),
    organizer: {
      "@type": "Organization",
      name: ev.organizer_name || "Medellín Vibra",
      url: ev.organizer_name ? `${DOMINIO}/organizador/${slugify(ev.organizer_name)}` : DOMINIO,
    },
    offers: {
      "@type": "Offer",
      url: ev.ticket_link && String(ev.ticket_link).startsWith("http") ? ev.ticket_link : url,
      priceCurrency: "COP",
      availability: ev.tag === "Agotado" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      validFrom: (ev.created_at || new Date().toISOString()).split("T")[0],
      ...(price ? { price } : {}),
    },
    ...(gratis ? { isAccessibleForFree: true } : {}),
  };
}
