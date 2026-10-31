import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import usePush from "./usePush";
import PushPanel from "./PushPanel";

// Invitación a activar avisos que aparece abajo en la página de un evento
// justo después de que la persona muestra interés (clic en comprar o en
// "me interesa"): es el momento en que más sentido tiene ofrecerle avisos.
// Se muestra una vez por sesión y, si la cierra, no vuelve en 14 días.

const CLAVE_CERRADA = "mv_push_invite_cerrada";
const DIAS_SIN_MOSTRAR = 14;

function cerradaHacePoco() {
  try {
    const t = Number(localStorage.getItem(CLAVE_CERRADA) || 0);
    return Date.now() - t < DIAS_SIN_MOSTRAR * 86400000;
  } catch { return false; }
}
function yaMostradaEnSesion() {
  try { return sessionStorage.getItem("mv_push_invite_vista") === "1"; } catch { return false; }
}

export default function PushInvite({ t, disparo }) {
  const push = usePush(t.pushError);
  const [visible, setVisible] = useState(false);

  const puedeMostrarse = push.checked && !push.subscription && push.permission !== "denied"
    && (push.supported || push.needsInstall);

  useEffect(() => {
    if (!disparo || !puedeMostrarse || cerradaHacePoco() || yaMostradaEnSesion()) return;
    // Pequeña espera: si el clic abrió la boletería en otra pestaña, la
    // invitación ya está ahí cuando la persona vuelve.
    const id = setTimeout(() => {
      setVisible(true);
      try { sessionStorage.setItem("mv_push_invite_vista", "1"); } catch { /* sin storage */ }
    }, 1200);
    return () => clearTimeout(id);
  }, [disparo, puedeMostrarse]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible) return null;

  function cerrar() {
    setVisible(false);
    try { localStorage.setItem(CLAVE_CERRADA, String(Date.now())); } catch { /* sin storage */ }
  }

  return (
    <div className="mv-push-invite" role="dialog" aria-modal="false" aria-labelledby="mv-push-invite-t">
      <style>{`
        .mv-push-invite { position:fixed; left:12px; right:12px; bottom:12px; z-index:250; max-width:440px; margin:0 auto;
          background:#fff; color:#1a1a1a; border:1px solid #e5e1d8; border-radius:16px; padding:18px 18px 16px;
          box-shadow:0 12px 40px rgba(0,0,0,.22); text-align:left; animation: mvPushIn .25s ease-out;
          --text:#1a1a1a; --muted:#5c5c5c; --gold:#C8860A; --gold-text:#9a6606; --red:#b42318; }
        @keyframes mvPushIn { from { transform: translateY(16px); opacity:0 } to { transform:none; opacity:1 } }
        @media (prefers-reduced-motion: reduce) { .mv-push-invite { animation:none } }
        .mv-push-invite-cab { display:flex; gap:12px; align-items:center; margin-bottom:12px; padding-right:28px; }
        .mv-push-invite-icono { width:38px; height:38px; border-radius:50%; background:#C8860A; color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .mv-push-invite-t { font-weight:700; font-size:16px; line-height:1.3; }
        .mv-push-invite-x { position:absolute; top:10px; right:10px; background:none; border:none; color:#666; cursor:pointer; padding:6px; border-radius:8px; }
        .mv-push-invite button:focus-visible, .mv-push-invite input:focus-visible, .mv-push-invite a:focus-visible { outline:3px solid #1a1a1a; outline-offset:2px; }
        .dark-mode .mv-push-invite { background:#1e1e1e; color:#f3f4f6; border-color:#333; --text:#f3f4f6; --muted:#b5b5b5; --gold-text:#f0c060; --red:#fda29b; }
        .dark-mode .mv-push-invite-x { color:#aaa; }
        .dark-mode .mv-push-invite button:focus-visible, .dark-mode .mv-push-invite input:focus-visible { outline-color:#fbe3a3; }
      `}</style>
      <button type="button" className="mv-push-invite-x" onClick={cerrar} aria-label={t.closeLabel || "Cerrar"}><X size={18} aria-hidden="true" /></button>
      <div className="mv-push-invite-cab">
        <div className="mv-push-invite-icono" aria-hidden="true"><BellRing size={18} /></div>
        <div className="mv-push-invite-t" id="mv-push-invite-t">{t.pushInviteTitle}</div>
      </div>
      <PushPanel t={t} push={push} origen="evento" text={t.pushInviteText} hideTitle onDone={() => setTimeout(() => setVisible(false), 1500)} />
    </div>
  );
}
