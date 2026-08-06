import { useState, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";

const SCROLL_THRESHOLD = 400;

export default function BackToTop({ hideForOverlay = false }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Capa defensiva: si un overlay se cierra sin que el navegador dispare
  // un nuevo evento de scroll (overscroll/momentum en Android), esto
  // vuelve a leer scrollY en el momento del cierre en vez de esperar
  // al próximo scroll real.
  const overlayEraActivoRef = useRef(hideForOverlay);
  useEffect(() => {
    if (overlayEraActivoRef.current && !hideForOverlay) {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    }
    overlayEraActivoRef.current = hideForOverlay;
  }, [hideForOverlay]);

  const mostrar = visible && !hideForOverlay;

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <>
      <style>{`
        .mv-back-to-top {
          position: fixed;
          right: 20px;
          bottom: 20px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--mv-btt-bg, #ffffff);
          border: 1px solid var(--mv-btt-border, rgba(0,0,0,0.08));
          color: var(--mv-btt-color, #1a1a1a);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 210;
          opacity: 0;
          transform: translateY(12px);
          pointer-events: none;
          transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s, color 0.2s;
        }
        .mv-back-to-top.mv-back-to-top-visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .mv-back-to-top:hover {
          background: #C8860A;
          color: white;
          border-color: #C8860A;
        }
        .dark-mode .mv-back-to-top {
          --mv-btt-bg: #1e1e1e;
          --mv-btt-border: rgba(255,255,255,0.12);
          --mv-btt-color: #f0f0f0;
        }
        @media (max-width: 767px) {
          .mv-back-to-top { right: 16px; bottom: 84px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mv-back-to-top { transition: opacity 0.15s linear; transform: none; }
        }
      `}</style>
      <button
        type="button"
        className={`mv-back-to-top${mostrar ? " mv-back-to-top-visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Volver arriba"
        aria-hidden={!mostrar}
        tabIndex={mostrar ? 0 : -1}
      >
        <ArrowUp size={20} strokeWidth={2.25} />
      </button>
    </>
  );
}
