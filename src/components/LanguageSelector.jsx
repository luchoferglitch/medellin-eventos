import { LANG_PREFIXES } from "../lang";
import { trackEvent } from "../analytics";

const LANGS = ["es", ...LANG_PREFIXES];

// Único punto de tracking para las 5 páginas standalone que usan estos dos
// componentes (Evento, Organizador, Hoy, EstaSemana/Finde, Faq) — el selector
// inline del home tiene su propio changeLang en App.jsx y dispara el mismo
// evento por separado ahí.
const trackCambioIdioma = (l) => trackEvent({ action: "cambiar_idioma", category: "Navegacion", label: l });

const CHIP_THEMES = {
  light: { bg: "#f5f3ef", border: "#e5e1d8", text: "#444", active: "#C8860A", activeText: "white" },
  dark: { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.18)", text: "rgba(255,255,255,0.75)", active: "#C8860A", activeText: "white" },
};

// Fila de 4 chips ES/EN/PT/FR — para headers con espacio de sobra
// (HoyPage, EventosPorRangoPage, FaqPage). Mismo patrón visual que el
// selector del home (App.jsx), pero con estilos inline propios: estas
// páginas standalone no comparten el <style> ni las variables de tema
// (--surface2, --border, etc.) que usa App.jsx.
export function LanguageSelectorChips({ lang, onChange, theme = "light" }) {
  const c = CHIP_THEMES[theme];
  return (
    <div role="group" aria-label="Idioma" style={{ display: "flex", gap: 2, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: 3 }}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => { trackCambioIdioma(l); onChange(l); }}
          aria-pressed={lang === l}
          style={{
            padding: "6px 9px",
            borderRadius: 6,
            border: "none",
            background: lang === l ? c.active : "transparent",
            color: lang === l ? c.activeText : c.text,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.3,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// <select> nativo — para headers de 3 franjas con poco espacio
// (EventoPage, OrganizadorPage), donde reemplaza el spacer vacío que
// balanceaba el wordmark centrado. Mismo patrón que los <select> de
// radio (hoy-radio-select / rp-radio-select) ya usados en el sitio.
// Borde y fondo con tinte dorado (antes: borde y fondo iguales al header
// blanco de estas páginas, prácticamente invisible como control aparte —
// EventoPage y OrganizadorPage son las de mayor tráfico real de las 6
// páginas con selector, así que valía la pena reforzar el contraste aquí).
export function LanguageSelectorCompact({ lang, onChange }) {
  return (
    <select
      aria-label="Idioma"
      value={lang}
      onChange={(e) => { trackCambioIdioma(e.target.value); onChange(e.target.value); }}
      style={{
        padding: "6px 8px",
        borderRadius: 8,
        border: "1.5px solid #C8860A",
        background: "#FBF1DC",
        color: "#C8860A",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {LANGS.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
