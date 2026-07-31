import ReactGA from "react-ga4";

// Carga la variable desde Vercel o tu .env.local
const TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID;

export const initGA = () => {
  if (TRACKING_ID) {
    ReactGA.initialize(TRACKING_ID);
  } else {
    console.warn("GA4: No se encontró VITE_GA_TRACKING_ID en las variables de entorno.");
  }
};

// Registra vistas de página virtuales para la SPA
export const logPageView = (path) => {
  if (TRACKING_ID) {
    ReactGA.send({ hitType: "pageview", page: path || window.location.pathname });
  }
};

// Función helper para disparar eventos personalizados
export const trackEvent = ({ action, category, label, value }) => {
  if (TRACKING_ID) {
    ReactGA.event({
      action,   // Ej: 'click_enlace_externo', 'filtro_categoria'
      category, // Ej: 'Conversion', 'Navegacion'
      label,    // Ej: Nombre del evento o categoría seleccionada
      value,    // Ej: Valor numérico opcional
    });
  }
};