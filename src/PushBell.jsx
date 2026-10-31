import { useEffect, useRef, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import usePush from "./usePush";
import PushPanel from "./PushPanel";

// Campana del menú superior (escritorio). En celular la entrada visible es
// "Avisos en el celular" en el menú Más, y en la página de evento la
// invitación que aparece tras un clic de compra o "me interesa".
export default function PushBell({ t }) {
  const push = usePush(t.pushError);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!push.supported && !push.needsInstall) return null;

  const activo = !!push.subscription;

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      <style>{`.mv-bell:focus-visible { outline: 3px solid var(--gold, #C8860A); outline-offset: 2px; }`}</style>
      <button
        type="button"
        className="mv-bell"
        onClick={() => setOpen((o) => !o)}
        aria-label={t.pushBellLabel}
        title={t.pushNavLabel}
        aria-expanded={open}
        style={{
          background: activo ? "var(--gold)" : "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "7px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: activo ? "white" : "var(--text)",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "inherit",
        }}
      >
        {activo ? <BellRing size={16} aria-hidden="true" /> : <Bell size={16} aria-hidden="true" />}
      </button>
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: 290,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          zIndex: 50,
          textAlign: "left",
        }}>
          <PushPanel t={t} push={push} origen="campana" />
        </div>
      )}
    </div>
  );
}
