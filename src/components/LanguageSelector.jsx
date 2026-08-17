import { LANG_PREFIXES } from "../lang";

const LANGS = ["es", ...LANG_PREFIXES];

const CHIP_THEMES = {
  light: { bg: "#f5f3ef", border: "#e5e1d8", text: "#777", active: "#C8860A", activeText: "white" },
  dark: { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.18)", text: "rgba(255,255,255,0.55)", active: "#C8860A", activeText: "white" },
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
          onClick={() => onChange(l)}
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
export function LanguageSelectorCompact({ lang, onChange }) {
  return (
    <select
      aria-label="Idioma"
      value={lang}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "6px 6px",
        borderRadius: 8,
        border: "1px solid #e5e1d8",
        background: "white",
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
