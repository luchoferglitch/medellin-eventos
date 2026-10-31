import { useEffect } from "react";
import { X } from "lucide-react";
import usePush from "./usePush";
import PushPanel from "./PushPanel";

// Hoja inferior con el panel de avisos, para la entrada "Avisos" del menú Más
// en celular (donde la campana del menú superior casi no se ve).
export default function PushSheet({ t, onClose }) {
  const push = usePush(t.pushError);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="more-menu-overlay" onClick={onClose}>
      <div className="more-menu-panel" role="dialog" aria-modal="true" aria-label={t.pushBellLabel}
        onClick={(e) => e.stopPropagation()} style={{ position: "relative", textAlign: "left", padding: "16px 20px 28px" }}>
        <div className="more-menu-handle" />
        <button type="button" onClick={onClose} aria-label={t.closeLabel || "Cerrar"}
          style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 6 }}>
          <X size={18} aria-hidden="true" />
        </button>
        <div style={{ marginTop: 8 }}>
          <PushPanel t={t} push={push} origen="menu_mas" title={t.pushOptInTitle} />
        </div>
      </div>
    </div>
  );
}
