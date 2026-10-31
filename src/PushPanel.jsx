import { Link } from "react-router-dom";

// Contenido del panel de avisos: elegir frecuencia y activar/desactivar.
// Usa variables del tema del home (--text, --muted, --gold...) con valores de
// respaldo para que también se vea bien en páginas que no las definen.

const C = {
  text: "var(--text, #1a1a1a)",
  muted: "var(--muted, #666)",
  gold: "var(--gold, #C8860A)",
  goldText: "var(--gold-text, #9a6606)",
  red: "var(--red, #b42318)",
};

export default function PushPanel({ t, push, origen = "campana", title, text, hideTitle = false, onDone }) {
  const { needsInstall, isSafari, supported, permission, subscription, frecuencia, saving, error, activar, cambiarFrecuencia, desactivar } = push;

  if (needsInstall) {
    return (
      <div>
        {title && !hideTitle && <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>}
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, marginBottom: 8 }}>
          {isSafari ? t.pushIOSInstructions : t.pushIOSNotSafari}
        </div>
        <Link to="/preguntas-frecuentes#instalar-app" style={{ fontSize: 13, color: C.goldText, fontWeight: 600, textDecoration: "underline" }}>
          {t.pushIOSMoreInfo}
        </Link>
      </div>
    );
  }

  if (!supported) {
    return <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{t.pushUnsupported}</div>;
  }

  if (permission === "denied") {
    return <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{t.pushDenied}</div>;
  }

  const FREQ_OPTIONS = [
    ["diaria", t.pushFreqDaily],
    ["semanal", t.pushFreqWeekly],
    ["destacados", t.pushFreqFeatured],
  ];

  return (
    <div>
      {(!hideTitle || subscription) && (
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          {subscription ? t.pushManageTitle : (title || t.pushOptInTitle)}
        </div>
      )}
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, lineHeight: 1.45 }}>
        {subscription ? t.pushManageText : (text || t.pushOptInText)}
      </div>
      <fieldset style={{ border: "none", padding: 0, margin: "0 0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        <legend style={{ position: "absolute", left: -9999 }}>{t.pushOptInText}</legend>
        {FREQ_OPTIONS.map(([val, label]) => (
          <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.text, cursor: "pointer" }}>
            <input
              type="radio"
              name={`push-frecuencia-${origen}`}
              checked={frecuencia === val}
              onChange={() => cambiarFrecuencia(val)}
              disabled={saving}
            />
            {label}
          </label>
        ))}
      </fieldset>
      {error && <div role="alert" style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>{error}</div>}
      {subscription ? (
        <button
          type="button"
          onClick={desactivar}
          disabled={saving}
          style={{ background: "none", border: "none", color: C.red, fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 0, fontFamily: "inherit" }}
        >
          {t.pushDisable}
        </button>
      ) : (
        <button
          type="button"
          onClick={async () => { const ok = await activar(origen); if (ok && onDone) onDone(); }}
          disabled={saving}
          className="mv-push-activar"
          style={{ width: "100%", background: C.gold, color: "white", border: "none", borderRadius: 10, padding: "12px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
        >
          {saving ? t.pushActivating : t.pushActivateBtn}
        </button>
      )}
    </div>
  );
}
